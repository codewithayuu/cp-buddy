local M = {}
local utils = require("cpbuddy.utils")
local layout = require("cpbuddy.layout")

function M.add_testcase()
    local info = utils.get_problem_info()
    if not info then
        utils.notify("No active problem detected to add testcase.", vim.log.levels.WARN)
        return
    end

    local new_idx = info.test_count + 1
    local in_file = info.cpbuddy_dir .. "/test" .. new_idx .. ".in"
    local ans_file = info.cpbuddy_dir .. "/test" .. new_idx .. ".ans"

    utils.write_file(in_file, "")
    utils.write_file(ans_file, "")

    -- Update .bin metadata if present
    local meta = utils.read_bin_metadata(info.bin_file)
    if meta then
        local test_id = "test_" .. new_idx
        table.insert(meta.testcaseOrder, test_id)
        meta.testcases[test_id] = {
            stdin = { data = "" },
            answer = { data = "" },
            isExpand = true,
            isDisabled = false,
            result = nil,
        }
        utils.write_bin_metadata(info.bin_file, meta)
    end

    vim.g.cpbuddy_test_count = new_idx
    layout.switch_testcase(new_idx)
    utils.notify(string.format("Created Testcase #%d for %s", new_idx, info.name), vim.log.levels.INFO)
end

function M.delete_testcase(idx)
    local info = utils.get_problem_info()
    if not info or info.test_count == 0 then
        utils.notify("No testcases found to delete.", vim.log.levels.WARN)
        return
    end

    idx = idx or layout.current_test_idx or info.test_count
    if idx < 1 or idx > info.test_count then
        utils.notify("Invalid testcase index: " .. idx, vim.log.levels.WARN)
        return
    end

    -- Remove files for index
    utils.delete_file(info.cpbuddy_dir .. "/test" .. idx .. ".in")
    utils.delete_file(info.cpbuddy_dir .. "/test" .. idx .. ".ans")
    utils.delete_file(info.cpbuddy_dir .. "/test" .. idx .. ".out")

    -- Renumber remaining files
    for i = idx + 1, info.test_count do
        local old_in = info.cpbuddy_dir .. "/test" .. i .. ".in"
        local old_ans = info.cpbuddy_dir .. "/test" .. i .. ".ans"
        local old_out = info.cpbuddy_dir .. "/test" .. i .. ".out"

        local new_in = info.cpbuddy_dir .. "/test" .. (i - 1) .. ".in"
        local new_ans = info.cpbuddy_dir .. "/test" .. (i - 1) .. ".ans"
        local new_out = info.cpbuddy_dir .. "/test" .. (i - 1) .. ".out"

        if vim.fn.filereadable(old_in) == 1 then os.rename(old_in, new_in) end
        if vim.fn.filereadable(old_ans) == 1 then os.rename(old_ans, new_ans) end
        if vim.fn.filereadable(old_out) == 1 then os.rename(old_out, new_out) end
    end

    local new_total = info.test_count - 1
    vim.g.cpbuddy_test_count = new_total

    local new_active_idx = math.min(idx, math.max(1, new_total))
    layout.switch_testcase(new_active_idx)
    utils.notify(string.format("Deleted Testcase #%d. Total remaining: %d", idx, new_total), vim.log.levels.INFO)
end

function M.delete_problem()
    local info = utils.get_problem_info()
    if not info then
        utils.notify("No active problem to delete.", vim.log.levels.WARN)
        return
    end

    local choice = vim.fn.confirm("Are you sure you want to permanently delete problem '" .. info.name .. "' and all testcases?", "&Yes\n&No", 2)
    if choice ~= 1 then return end

    -- 1. Close associated buffers
    for _, buf in ipairs(vim.api.nvim_list_bufs()) do
        if vim.api.nvim_buf_is_valid(buf) then
            local bname = vim.api.nvim_buf_get_name(buf)
            if bname == info.filepath or bname:find(info.cpbuddy_dir, 1, true) or bname:find("CPBuddy_Results:" .. info.safe_name, 1, true) then
                pcall(vim.api.nvim_buf_delete, buf, { force = true })
            end
        end
    end

    -- 2. Delete source file and .cpbuddy directory
    utils.delete_file(info.filepath)
    utils.delete_dir_recursive(info.cpbuddy_dir)

    utils.notify("Problem '" .. info.name .. "' completely deleted.", vim.log.levels.INFO)
    vim.cmd("enew")
end

function M.import_from_clipboard()
    local clip = vim.fn.getreg("+")
    if not clip or clip == "" then
        clip = vim.fn.getreg('"')
    end
    if not clip or clip == "" then
        utils.notify("Clipboard is empty.", vim.log.levels.WARN)
        return
    end

    local info = utils.get_problem_info()
    if not info then
        utils.notify("No active problem detected to import testcase.", vim.log.levels.WARN)
        return
    end

    local new_idx = info.test_count + 1
    local in_file = info.cpbuddy_dir .. "/test" .. new_idx .. ".in"
    local ans_file = info.cpbuddy_dir .. "/test" .. new_idx .. ".ans"

    utils.write_file(in_file, clip)
    utils.write_file(ans_file, "")

    vim.g.cpbuddy_test_count = new_idx
    layout.switch_testcase(new_idx)
    utils.notify(string.format("Imported clipboard into Testcase #%d for %s", new_idx, info.name), vim.log.levels.INFO)
end

return M
