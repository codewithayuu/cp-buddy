local M = {}
local config = require("cpbuddy.config")
local utils = require("cpbuddy.utils")
local layout = require("cpbuddy.layout")

M.is_running = false
M.last_results = {}

function M.run_current_problem(opts)
    opts = opts or {}
    local on_complete = opts.on_complete
    
    if M.is_running then
        utils.notify("A test run is already in progress!", vim.log.levels.WARN)
        return
    end

    local info = utils.get_problem_info()
    if not info or not info.filepath then
        utils.notify("No active problem found to run.", vim.log.levels.WARN)
        return
    end

    -- 1. Auto-save files
    if config.get("runner").auto_save then
        vim.cmd("silent! wa")
    end

    local src_file = info.filepath
    local cpbuddy_dir = info.cpbuddy_dir
    local lang_key = info.language
    local lang_conf = config.get("languages")[lang_key] or config.defaults.languages.cpp
    
    -- Ensure cpbuddy directory exists
    vim.fn.mkdir(cpbuddy_dir, "p")

    -- 2. Read time limit from .bin metadata or defaults
    local time_limit_ms = config.get("runner").default_time_limit_ms or 2000
    local bin_meta = utils.read_bin_metadata(info.bin_file)
    if bin_meta and bin_meta.timeLimit then
        time_limit_ms = tonumber(bin_meta.timeLimit) or time_limit_ms
    end

    -- 3. Prepare executable and commands
    local exec_path = cpbuddy_dir .. "/" .. info.safe_name .. "_exec"
    local results_buf = layout.get_or_create_results_buffer(info.safe_name)

    M.is_running = true
    M.print_to_results(results_buf, { "Compiling / Running..." }, false)

    -- 4. Compile step (if language requires compilation)
    if lang_conf.is_compiled then
        local compile_cmd = M.build_compile_cmd(lang_key, lang_conf, src_file, exec_path, cpbuddy_dir, info.safe_name)
        
        local stderr_lines = {}
        vim.fn.jobstart(compile_cmd, {
            stdout_buffered = true,
            stderr_buffered = true,
            on_stderr = function(_, data)
                if data then
                    for _, line in ipairs(data) do
                        if line ~= "" then table.insert(stderr_lines, line) end
                    end
                end
            end,
            on_exit = function(_, exit_code)
                if exit_code ~= 0 then
                    M.is_running = false
                    local err_output = { "Compilation Error:" }
                    for _, l in ipairs(stderr_lines) do
                        table.insert(err_output, l)
                    end
                    M.print_to_results(results_buf, err_output, false)
                    utils.notify("Compilation failed for " .. info.name, vim.log.levels.ERROR)
                    if on_complete then on_complete({ status = "CE", results = {}, compilation_error = stderr_lines }) end
                    return
                end

                -- Compilation successful, run tests
                M.execute_all_tests(exec_path, info, time_limit_ms, lang_key, lang_conf, results_buf, on_complete)
            end,
        })
    else
        -- Interpreted language (e.g. Python)
        M.execute_all_tests(src_file, info, time_limit_ms, lang_key, lang_conf, results_buf, on_complete)
    end
end

function M.build_compile_cmd(lang_key, lang_conf, src_file, exec_path, cpbuddy_dir, safe_name)
    if lang_key == "cpp" or lang_key == "c" then
        local cmd = { lang_conf.compile_cmd or "g++" }
        for _, arg in ipairs(lang_conf.compile_args or {}) do
            table.insert(cmd, arg)
        end
        table.insert(cmd, src_file)
        table.insert(cmd, "-o")
        table.insert(cmd, exec_path)
        return cmd
    elseif lang_key == "rust" then
        return { "rustc", "-O", "-o", exec_path, src_file }
    elseif lang_key == "go" then
        return { "go", "build", "-o", exec_path, src_file }
    elseif lang_key == "java" then
        return { "javac", "-d", cpbuddy_dir, src_file }
    end
    return { "g++", "-std=c++23", "-O2", src_file, "-o", exec_path }
end

function M.execute_all_tests(exec_target, info, time_limit_ms, lang_key, lang_conf, results_buf, on_complete)
    local testcases = info.testcases
    if #testcases == 0 then
        M.is_running = false
        M.print_to_results(results_buf, { "No testcases found. Use :CPBuddyAddTest to create one." }, false)
        if on_complete then on_complete({ status = "NO_TESTS", results = {} }) end
        return
    end

    local test_results = {}
    local passed_count = 0
    local total_time_ms = 0
    local output_blocks = {}

    -- Run testcases sequentially
    local function run_single_test(idx)
        if idx > #testcases then
            -- All tests finished!
            M.is_running = false
            M.last_results = test_results

            local final_lines = {}
            local is_single = (#testcases == 1)

            if is_single then
                local res = test_results[1]
                if res.verdict == "AC" then
                    for _, l in ipairs(res.stdout_lines) do
                        table.insert(final_lines, l)
                    end
                    table.insert(final_lines, "")
                    table.insert(final_lines, string.format("[Passed in %.1f ms]", res.elapsed_ms))
                elseif res.verdict == "WA" then
                    table.insert(final_lines, "Output:")
                    for _, l in ipairs(res.stdout_lines) do table.insert(final_lines, l) end
                    table.insert(final_lines, "")
                    table.insert(final_lines, "Expected:")
                    for _, l in ipairs(vim.split(res.expected, "\n")) do table.insert(final_lines, l) end
                    table.insert(final_lines, "")
                    table.insert(final_lines, string.format("[WRONG ANSWER] (%.1f ms)", res.elapsed_ms))
                elseif res.verdict == "RTE" then
                    for _, l in ipairs(res.stderr_lines) do table.insert(final_lines, l) end
                    table.insert(final_lines, "")
                    table.insert(final_lines, string.format("[RUNTIME ERROR (code %d)] (%.1f ms)", res.exit_code, res.elapsed_ms))
                elseif res.verdict == "TLE" then
                    table.insert(final_lines, string.format("[TIME LIMIT EXCEEDED (> %d ms)]", time_limit_ms))
                end
            else
                for _, res in ipairs(test_results) do
                    if res.verdict == "AC" then
                        table.insert(final_lines, string.format("--- Test #%d [PASSED in %.1f ms] ---", res.index, res.elapsed_ms))
                        for _, l in ipairs(res.stdout_lines) do table.insert(final_lines, l) end
                        table.insert(final_lines, "")
                    elseif res.verdict == "WA" then
                        table.insert(final_lines, string.format("--- Test #%d [WRONG ANSWER in %.1f ms] ---", res.index, res.elapsed_ms))
                        table.insert(final_lines, "Output:")
                        for _, l in ipairs(res.stdout_lines) do table.insert(final_lines, l) end
                        table.insert(final_lines, "")
                        table.insert(final_lines, "Expected:")
                        for _, l in ipairs(vim.split(res.expected, "\n")) do table.insert(final_lines, l) end
                        table.insert(final_lines, "")
                    elseif res.verdict == "RTE" then
                        table.insert(final_lines, string.format("--- Test #%d [RUNTIME ERROR] (%.1f ms) ---", res.index, res.elapsed_ms))
                        for _, l in ipairs(res.stderr_lines) do table.insert(final_lines, l) end
                        table.insert(final_lines, "")
                    elseif res.verdict == "TLE" then
                        table.insert(final_lines, string.format("--- Test #%d [TIME LIMIT EXCEEDED (> %d ms)] ---", res.index, time_limit_ms))
                        table.insert(final_lines, "")
                    end
                end

                if passed_count == #testcases then
                    table.insert(final_lines, string.format("[All %d tests PASSED in %.1f ms]", #testcases, total_time_ms))
                else
                    table.insert(final_lines, string.format("[%d of %d tests FAILED]", #testcases - passed_count, #testcases))
                end
            end

            M.print_to_results(results_buf, final_lines, false)

            if passed_count == #testcases then
                utils.notify(string.format("All %d testcases PASSED (%.1fms)", #testcases, total_time_ms), vim.log.levels.INFO)
            else
                utils.notify(string.format("%d of %d testcases failed", #testcases - passed_count, #testcases), vim.log.levels.WARN)
            end

            if on_complete then
                on_complete({
                    status = (passed_count == #testcases) and "AC" or "WA",
                    results = test_results,
                    passed_count = passed_count,
                    total_tests = #testcases,
                    total_time_ms = total_time_ms,
                })
            end
            return
        end

        local test = testcases[idx]
        local in_file = test.in_file
        local ans_file = test.ans_file
        local out_file = test.out_file

        local in_data = utils.read_file(in_file) or ""
        local ans_data = utils.read_file(ans_file) or ""

        -- Construct run command
        local run_cmd = {}
        if lang_conf.is_compiled then
            if lang_key == "java" then
                run_cmd = { "java", "-cp", info.cpbuddy_dir, "Solution" }
            else
                run_cmd = { exec_target }
            end
        else
            if lang_key == "python" then
                run_cmd = { "python3", exec_target }
            end
        end

        local start_hr = vim.loop.hrtime()
        local stdout_chunks = {}
        local stderr_chunks = {}
        local has_timed_out = false
        local job_id = nil

        -- Timeout timer
        local timer = vim.loop.new_timer()
        timer:start(time_limit_ms + 100, 0, vim.schedule_wrap(function()
            has_timed_out = true
            if job_id then
                pcall(vim.fn.jobstop, job_id)
            end
            timer:close()
        end))

        job_id = vim.fn.jobstart(run_cmd, {
            stdout_buffered = true,
            stderr_buffered = true,
            on_stdout = function(_, data)
                if data then
                    for _, line in ipairs(data) do table.insert(stdout_chunks, line) end
                end
            end,
            on_stderr = function(_, data)
                if data then
                    for _, line in ipairs(data) do table.insert(stderr_chunks, line) end
                end
            end,
            on_exit = function(_, exit_code)
                pcall(function() timer:stop(); timer:close() end)
                local end_hr = vim.loop.hrtime()
                local elapsed_ms = (end_hr - start_hr) / 1000000

                -- Remove trailing blank lines added by nvim jobstart
                while #stdout_chunks > 0 and stdout_chunks[#stdout_chunks] == "" do
                    table.remove(stdout_chunks)
                end
                while #stderr_chunks > 0 and stderr_chunks[#stderr_chunks] == "" do
                    table.remove(stderr_chunks)
                end

                local actual_str = table.concat(stdout_chunks, "\n")
                local stderr_str = table.concat(stderr_chunks, "\n")
                utils.write_file(out_file, actual_str)

                -- Compute Verdict
                local verdict = "AC"
                local is_passed = false

                if has_timed_out or elapsed_ms > time_limit_ms then
                    verdict = "TLE"
                elseif exit_code ~= 0 then
                    verdict = "RTE"
                else
                    local clean_actual = utils.trim(actual_str):gsub("\r\n", "\n")
                    local clean_expected = utils.trim(ans_data):gsub("\r\n", "\n")
                    if clean_actual == clean_expected then
                        verdict = "AC"
                        is_passed = true
                        passed_count = passed_count + 1
                    else
                        verdict = "WA"
                    end
                end

                total_time_ms = total_time_ms + elapsed_ms

                local result_item = {
                    index = idx,
                    verdict = verdict,
                    is_passed = is_passed,
                    elapsed_ms = elapsed_ms,
                    exit_code = exit_code,
                    input = in_data,
                    expected = ans_data,
                    actual = actual_str,
                    stdout_lines = stdout_chunks,
                    stderr = stderr_str,
                    stderr_lines = stderr_chunks,
                }
                table.insert(test_results, result_item)

                -- Next test
                vim.defer_fn(function()
                    run_single_test(idx + 1)
                end, 20)
            end,
        })

        -- Send input via stdin
        if in_data and in_data ~= "" then
            vim.fn.chansend(job_id, in_data)
        end
        vim.fn.chanclose(job_id, "stdin")
    end

    -- Kick off test 1
    run_single_test(1)
end

function M.print_to_results(buf, lines, append)
    if not buf or not vim.api.nvim_buf_is_valid(buf) then return end
    vim.schedule(function()
        if not vim.api.nvim_buf_is_valid(buf) then return end
        if not append then
            vim.api.nvim_buf_set_lines(buf, 0, -1, false, lines)
        else
            local count = vim.api.nvim_buf_line_count(buf)
            vim.api.nvim_buf_set_lines(buf, count, count, false, lines)
        end
    end)
end

return M
