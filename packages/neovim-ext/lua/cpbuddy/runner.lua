local M = {}

function M.run_current_problem()
    local cpp_file = vim.g.cpbuddy_current_cpp
    local cpbuddy_dir = vim.g.cpbuddy_current_dir
    local test_count = vim.g.cpbuddy_test_count
    
    if not cpp_file or not cpbuddy_dir then
        print("CPBuddy: No active problem found to run.")
        return
    end
    
    -- Save all files before running
    vim.cmd("wa")
    
    local executable = cpbuddy_dir .. "/a.out"
    local compile_cmd = string.format("g++ -std=c++20 -O2 -Wall %s -o %s", vim.fn.shellescape(cpp_file), vim.fn.shellescape(executable))
    
    M.print_to_results({"Compiling...", compile_cmd})
    
    vim.fn.jobstart(compile_cmd, {
        on_exit = function(_, exit_code)
            if exit_code ~= 0 then
                M.print_to_results({"Compilation Failed!", "Exit Code: " .. exit_code})
                return
            end
            
            M.print_to_results({"Compilation Successful. Running Tests...", ""})
            M.run_tests(executable, cpbuddy_dir, test_count)
        end,
        stderr_buffered = true,
        on_stderr = function(_, data)
            if data and #data > 0 and data[1] ~= "" then
                M.print_to_results(data, true)
            end
        end
    })
end

function M.run_tests(executable, cpbuddy_dir, test_count)
    local results = {}
    
    for i = 1, test_count do
        local in_file = cpbuddy_dir .. "/test" .. i .. ".in"
        local ans_file = cpbuddy_dir .. "/test" .. i .. ".ans"
        local out_file = cpbuddy_dir .. "/test" .. i .. ".out"
        
        local run_cmd = string.format("%s < %s > %s", vim.fn.shellescape(executable), vim.fn.shellescape(in_file), vim.fn.shellescape(out_file))
        
        -- Blocking execute for simplicity in CP runner
        local start_time = vim.loop.hrtime()
        os.execute(run_cmd)
        local end_time = vim.loop.hrtime()
        local time_ms = (end_time - start_time) / 1000000
        
        -- Compare output
        local actual_lines = vim.fn.readfile(out_file)
        local expected_lines = vim.fn.filereadable(ans_file) == 1 and vim.fn.readfile(ans_file) or {}
        
        local actual_str = table.concat(actual_lines, "\n"):gsub("%s+$", "")
        local expected_str = table.concat(expected_lines, "\n"):gsub("%s+$", "")
        
        local status = "FAILED"
        if actual_str == expected_str then
            status = "PASSED"
        end
        
        table.insert(results, string.format("Test #%d: [%s] (%.2f ms)", i, status, time_ms))
        if status == "FAILED" then
            table.insert(results, "--- Expected ---")
            table.insert(results, expected_str)
            table.insert(results, "--- Actual ---")
            table.insert(results, actual_str)
        end
        table.insert(results, "")
    end
    
    M.print_to_results(results, true)
end

function M.print_to_results(lines, append)
    -- Find the CPBuddy_Results buffer
    local target_buf = nil
    for _, buf in ipairs(vim.api.nvim_list_bufs()) do
        if vim.api.nvim_buf_get_name(buf):match("CPBuddy_Results$") then
            target_buf = buf
            break
        end
    end
    
    if not target_buf then return end
    
    vim.schedule(function()
        if not append then
            vim.api.nvim_buf_set_lines(target_buf, 0, -1, false, lines)
        else
            local line_count = vim.api.nvim_buf_line_count(target_buf)
            vim.api.nvim_buf_set_lines(target_buf, line_count, line_count, false, lines)
        end
    end)
end

return M
