local M = {}
local utils = require("cpbuddy.utils")
local runner = require("cpbuddy.runner")
local testcase_manager = require("cpbuddy.testcase_manager")

M.win = nil
M.buf = nil
M.current_tab = 1

function M.open()
    local info = utils.get_problem_info()
    if not info then
        utils.notify("No active CP problem found in current buffer.", vim.log.levels.WARN)
        return
    end

    if M.win and vim.api.nvim_win_is_valid(M.win) then
        vim.api.nvim_set_current_win(M.win)
        return
    end

    -- Create floating window
    local width = math.min(100, math.floor(vim.o.columns * 0.85))
    local height = math.min(30, math.floor(vim.o.lines * 0.80))
    local row = math.floor((vim.o.lines - height) / 2)
    local col = math.floor((vim.o.columns - width) / 2)

    M.buf = vim.api.nvim_create_buf(false, true)
    vim.bo[M.buf].buftype = "nofile"
    vim.bo[M.buf].bufhidden = "wipe"
    vim.bo[M.buf].swapfile = false

    M.win = vim.api.nvim_open_win(M.buf, true, {
        relative = "editor",
        row = row,
        col = col,
        width = width,
        height = height,
        style = "minimal",
        border = "rounded",
        title = " 🏆 CPBuddy TUI Dashboard: " .. info.name .. " ",
        title_pos = "center",
    })

    M.current_tab = math.min(M.current_tab or 1, math.max(1, info.test_count))
    M.render()
    M.setup_keymaps()
end

function M.render()
    if not M.buf or not vim.api.nvim_buf_is_valid(M.buf) then return end

    local info = utils.get_problem_info()
    if not info then return end

    local test_count = info.test_count
    local last_results = runner.last_results or {}
    local lines = {}

    -- 1. Render Tab Header
    local tab_line = " "
    for i = 1, math.max(1, test_count) do
        local status_icon = "⚪"
        if last_results[i] then
            if last_results[i].verdict == "AC" then status_icon = "✔"
            elseif last_results[i].verdict == "WA" then status_icon = "✖"
            elseif last_results[i].verdict == "TLE" then status_icon = "⏳"
            elseif last_results[i].verdict == "RTE" then status_icon = "💥"
            end
        end

        if i == M.current_tab then
            tab_line = tab_line .. string.format(" [ #%d %s ] ", i, status_icon)
        else
            tab_line = tab_line .. string.format("   #%d %s   ", i, status_icon)
        end
    end
    tab_line = tab_line .. "  [+ Add: 'a']"

    table.insert(lines, tab_line)
    table.insert(lines, " " .. string.rep("─", 80))

    -- 2. Render Active Testcase Details
    if test_count == 0 then
        table.insert(lines, "")
        table.insert(lines, "  No testcases available. Press 'a' to add a custom testcase.")
    else
        local cur_idx = M.current_tab
        local in_file = info.cpbuddy_dir .. "/test" .. cur_idx .. ".in"
        local ans_file = info.cpbuddy_dir .. "/test" .. cur_idx .. ".ans"
        local out_file = info.cpbuddy_dir .. "/test" .. cur_idx .. ".out"

        local in_content = utils.read_file(in_file) or "<empty>"
        local ans_content = utils.read_file(ans_file) or "<empty>"
        local out_content = utils.read_file(out_file) or "<no execution yet>"

        local res = last_results[cur_idx]
        local verdict_str = "NOT RUN"
        local time_str = "-"
        if res then
            verdict_str = res.verdict
            time_str = string.format("%.1f ms", res.elapsed_ms)
        end

        table.insert(lines, string.format("  Testcase #%d  |  Verdict: [%s]  |  Execution Time: %s", cur_idx, verdict_str, time_str))
        table.insert(lines, "")

        -- Input Box
        table.insert(lines, "  ┌─── 📥 INPUT (stdin) ──────────────────────────────────────────────────────────")
        for _, l in ipairs(vim.split(in_content, "\n")) do
            table.insert(lines, "  │ " .. l)
        end
        table.insert(lines, "  └───────────────────────────────────────────────────────────────────────────────")

        -- Expected Output Box
        table.insert(lines, "  ┌─── 🎯 EXPECTED OUTPUT ────────────────────────────────────────────────────────")
        for _, l in ipairs(vim.split(ans_content, "\n")) do
            table.insert(lines, "  │ " .. l)
        end
        table.insert(lines, "  └───────────────────────────────────────────────────────────────────────────────")

        -- Actual Output Box
        table.insert(lines, "  ┌─── 📤 ACTUAL OUTPUT ──────────────────────────────────────────────────────────")
        for _, l in ipairs(vim.split(out_content, "\n")) do
            table.insert(lines, "  │ " .. l)
        end
        table.insert(lines, "  └───────────────────────────────────────────────────────────────────────────────")

        -- Diff Details if WA
        if res and res.verdict == "WA" then
            table.insert(lines, "  ┌─── 🔍 DIFF (Expected vs Actual) ──────────────────────────────────────────────")
            local diffs = utils.diff_lines(ans_content, out_content)
            for _, d in ipairs(diffs) do
                if d.type == "diff" then
                    table.insert(lines, string.format("  │ - Exp (L%d): %s", d.line, d.expected))
                    table.insert(lines, string.format("  │ + Got (L%d): %s", d.line, d.actual))
                end
            end
            table.insert(lines, "  └───────────────────────────────────────────────────────────────────────────────")
        end
    end

    -- 3. Render Help Footer
    table.insert(lines, "")
    table.insert(lines, " " .. string.rep("─", 80))
    table.insert(lines, "  [Tab/S-Tab] Switch Test | [r] Run | [a] Add | [e] Edit | [d] Delete | [s] Submit | [q] Close")

    vim.bo[M.buf].modifiable = true
    vim.api.nvim_buf_set_lines(M.buf, 0, -1, false, lines)
    vim.bo[M.buf].modifiable = false
end

function M.setup_keymaps()
    if not M.buf then return end

    local function map(lhs, rhs)
        vim.keymap.set("n", lhs, rhs, { buffer = M.buf, nowait = true, silent = true })
    end

    map("<Tab>", function()
        local info = utils.get_problem_info()
        if info and info.test_count > 0 then
            M.current_tab = (M.current_tab % info.test_count) + 1
            M.render()
        end
    end)

    map("<S-Tab>", function()
        local info = utils.get_problem_info()
        if info and info.test_count > 0 then
            M.current_tab = M.current_tab - 1
            if M.current_tab < 1 then M.current_tab = info.test_count end
            M.render()
        end
    end)

    map("l", function() vim.cmd("normal! <Tab>") end)
    map("h", function() vim.cmd("normal! <S-Tab>") end)

    map("r", function()
        runner.run_current_problem({
            on_complete = function()
                M.render()
            end
        })
    end)

    map("a", function()
        testcase_manager.add_testcase()
        local info = utils.get_problem_info()
        if info then M.current_tab = info.test_count end
        M.render()
    end)

    map("d", function()
        testcase_manager.delete_testcase(M.current_tab)
        local info = utils.get_problem_info()
        if info then M.current_tab = math.max(1, math.min(M.current_tab, info.test_count)) end
        M.render()
    end)

    map("e", function()
        local info = utils.get_problem_info()
        if not info or info.test_count == 0 then return end
        M.close()
        local in_file = info.cpbuddy_dir .. "/test" .. M.current_tab .. ".in"
        vim.cmd("edit " .. vim.fn.fnameescape(in_file))
    end)

    map("s", function()
        require("cpbuddy.submit").submit_current()
    end)

    map("q", M.close)
    map("<Esc>", M.close)
end

function M.close()
    if M.win and vim.api.nvim_win_is_valid(M.win) then
        vim.api.nvim_win_close(M.win, true)
    end
    M.win = nil
    M.buf = nil
end

return M
