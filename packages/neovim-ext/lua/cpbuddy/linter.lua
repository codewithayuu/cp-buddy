-- Instant Real-Time Syntax & Error Checker for CPBuddy
-- Runs lightning-fast in-memory syntax check (g++ / python3 ast) on every keystroke

local M = {}
local lint_ns = vim.api.nvim_create_namespace("cpbuddy_instant_linter")
local timer = nil
local active_job = nil

function M.check_buffer(bufnr)
    bufnr = bufnr or vim.api.nvim_get_current_buf()
    if not vim.api.nvim_buf_is_valid(bufnr) then return end

    local ft = vim.bo[bufnr].filetype
    local lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)
    local code_str = table.concat(lines, "\n")
    if #lines == 0 or code_str:match("^%s*$") then
        vim.diagnostic.reset(lint_ns, bufnr)
        return
    end

    if ft == "cpp" or ft == "c" then
        M.check_cpp(bufnr, code_str)
    elseif ft == "python" then
        M.check_python(bufnr, code_str)
    end
end

function M.check_cpp(bufnr, code_str)
    if active_job then
        pcall(vim.fn.jobstop, active_job)
        active_job = nil
    end

    local stderr_lines = {}
    local cmd = { "g++", "-fsyntax-only", "-std=c++23", "-x", "c++", "-" }
    if vim.fn.executable("g++") == 0 then
        cmd = { "clang++", "-fsyntax-only", "-std=c++23", "-x", "c++", "-" }
    end

    active_job = vim.fn.jobstart(cmd, {
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
            active_job = nil
            if not vim.api.nvim_buf_is_valid(bufnr) then return end

            local diagnostics = {}
            for _, line in ipairs(stderr_lines) do
                -- Match: <stdin>:line:col: error: msg OR <stdin>:line:col: warning: msg
                local lnum, col, sev_str, msg = line:match("<stdin>:(%d+):(%d+):%s*(%w+):%s*(.*)")
                if not lnum then
                    lnum, sev_str, msg = line:match("<stdin>:(%d+):%s*(%w+):%s*(.*)")
                    col = 1
                end

                if lnum and sev_str and msg then
                    local severity = vim.diagnostic.severity.ERROR
                    if sev_str:lower():find("warn") then
                        severity = vim.diagnostic.severity.WARN
                    elseif sev_str:lower():find("note") then
                        severity = vim.diagnostic.severity.HINT
                    end

                    local line_idx = math.max(0, tonumber(lnum) - 1)
                    local col_idx = math.max(0, tonumber(col) - 1)

                    table.insert(diagnostics, {
                        bufnr = bufnr,
                        lnum = line_idx,
                        col = col_idx,
                        end_lnum = line_idx,
                        end_col = col_idx + 10,
                        severity = severity,
                        message = msg,
                        source = "CPBuddy Syntax",
                    })
                end
            end

            vim.schedule(function()
                if vim.api.nvim_buf_is_valid(bufnr) then
                    vim.diagnostic.set(lint_ns, bufnr, diagnostics, {
                        virtual_text = {
                            prefix = " ✘ ",
                            spacing = 2,
                        },
                        underline = true,
                        signs = true,
                    })
                end
            end)
        end,
    })

    if active_job and active_job > 0 then
        vim.fn.chansend(active_job, code_str)
        vim.fn.chanclose(active_job, "stdin")
    end
end

function M.check_python(bufnr, code_str)
    -- Quick Python AST compilation check
    local py_script = [[
import sys, ast, json
try:
    code = sys.stdin.read()
    ast.parse(code)
    print("OK")
except SyntaxError as e:
    print(json.dumps([{"lnum": e.lineno or 1, "col": e.offset or 1, "msg": e.msg}]))
except Exception as e:
    print(json.dumps([{"lnum": 1, "col": 1, "msg": str(e)}]))
]]
    local stdout_lines = {}
    vim.fn.jobstart({ "python3", "-c", py_script }, {
        stdout_buffered = true,
        on_stdout = function(_, data)
            if data then
                for _, line in ipairs(data) do
                    if line ~= "" then table.insert(stdout_lines, line) end
                end
            end
        end,
        on_exit = function()
            if not vim.api.nvim_buf_is_valid(bufnr) then return end
            local out_str = table.concat(stdout_lines, "")
            local diagnostics = {}
            if out_str ~= "OK" and out_str ~= "" then
                local ok, parsed = pcall(vim.fn.json_decode, out_str)
                if ok and type(parsed) == "table" then
                    for _, err in ipairs(parsed) do
                        local lnum = math.max(0, (err.lnum or 1) - 1)
                        local col = math.max(0, (err.col or 1) - 1)
                        table.insert(diagnostics, {
                            bufnr = bufnr,
                            lnum = lnum,
                            col = col,
                            end_lnum = lnum,
                            end_col = col + 5,
                            severity = vim.diagnostic.severity.ERROR,
                            message = err.msg or "Syntax Error",
                            source = "CPBuddy Syntax",
                        })
                    end
                end
            end
            vim.schedule(function()
                if vim.api.nvim_buf_is_valid(bufnr) then
                    vim.diagnostic.set(lint_ns, bufnr, diagnostics, {
                        virtual_text = {
                            prefix = " ✘ ",
                            spacing = 2,
                        },
                        underline = true,
                        signs = true,
                    })
                end
            end)
        end,
    })
end

function M.debounced_check(bufnr)
    if timer then
        timer:stop()
        timer:close()
        timer = nil
    end

    timer = vim.loop.new_timer()
    timer:start(150, 0, vim.schedule_wrap(function()
        M.check_buffer(bufnr)
        if timer then
            timer:stop()
            timer:close()
            timer = nil
        end
    end))
end

function M.setup()
    -- Enable diagnostics options globally
    vim.diagnostic.config({
        virtual_text = {
            prefix = "● ",
            spacing = 2,
            severity = { min = vim.diagnostic.severity.HINT },
        },
        signs = {
            text = {
                [vim.diagnostic.severity.ERROR] = "✘",
                [vim.diagnostic.severity.WARN] = "▲",
                [vim.diagnostic.severity.HINT] = "⚑",
                [vim.diagnostic.severity.INFO] = "ℹ",
            },
        },
        underline = true,
        update_in_insert = true,
        severity_sort = true,
    })

    -- Trigger real-time linting on buffer enter and text changes
    vim.api.nvim_create_autocmd({ "BufEnter", "BufReadPost", "TextChanged", "TextChangedI" }, {
        pattern = { "*.cpp", "*.cc", "*.c", "*.py", "*.rs", "*.go" },
        callback = function(ev)
            M.debounced_check(ev.buf)
        end,
    })
end

return M
