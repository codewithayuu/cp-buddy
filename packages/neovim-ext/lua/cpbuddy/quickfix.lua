local M = {}
local utils = require("cpbuddy.utils")

-- Apply Code Action / Suggestion at cursor or mouse click position
function M.apply_quickfix_at_cursor(is_mouse_click)
    if is_mouse_click then
        local mouse = vim.fn.getmousepos()
        if mouse and mouse.winid > 0 then
            pcall(vim.api.nvim_set_current_win, mouse.winid)
            pcall(vim.api.nvim_win_set_cursor, mouse.winid, { mouse.line, math.max(0, mouse.column - 1) })
        end
    end

    local bufnr = vim.api.nvim_get_current_buf()
    local lnum = vim.fn.line(".")

    -- 1. Try immediate heuristic fix first (instant response for common CP patterns like NULL -> nullptr)
    if M.fallback_heuristic_fix(bufnr, lnum) then
        return
    end

    -- 2. Try LSP Code Action
    local clients = vim.lsp.get_clients({ bufnr = bufnr })
    if #clients > 0 then
        vim.lsp.buf.code_action({
            apply = true,
            context = {
                diagnostics = vim.diagnostic.get(bufnr, { lnum = lnum - 1 }),
            },
        })
        return
    end

    utils.notify("No automatic quick-fix available on this line.", vim.log.levels.INFO)
end

function M.fallback_heuristic_fix(bufnr, lnum)
    local line = vim.api.nvim_buf_get_lines(bufnr, lnum - 1, lnum, false)[1] or ""
    local diags = vim.diagnostic.get(bufnr, { lnum = lnum - 1 })

    -- Heuristic 1: Replace NULL with nullptr (e.g. cin.tie(NULL))
    if line:find("NULL") then
        local new_line = line:gsub("%f[%w_]NULL%f[^%w_]", "nullptr")
        if new_line ~= line then
            vim.api.nvim_buf_set_lines(bufnr, lnum - 1, lnum, false, { new_line })
            utils.notify("✨ Replaced NULL with nullptr", vim.log.levels.INFO)
            return true
        end
    end

    -- Heuristic 2: Missing semicolon at end of line
    for _, d in ipairs(diags) do
        local msg = (d.message or ""):lower()
        if msg:find("semicolon") or msg:find("expected ';'") or msg:find("expected ';'") then
            if not line:match(";%s*$") then
                vim.api.nvim_buf_set_lines(bufnr, lnum - 1, lnum, false, { line .. ";" })
                utils.notify("✨ Added missing semicolon", vim.log.levels.INFO)
                return true
            end
        end
    end

    return false
end

function M.setup()
    local modes = { "n", "i", "v" }
    for _, mode in ipairs(modes) do
        -- Ctrl + Left Mouse Click on suggestion/issue
        vim.keymap.set(mode, "<C-LeftMouse>", function()
            M.apply_quickfix_at_cursor(true)
        end, { silent = true, desc = "Apply QuickFix / Suggestion (Ctrl + Click)" })

        -- Keyboard Shortcuts: Ctrl + . (Sublime/VSCode standard) & Alt + Enter
        vim.keymap.set(mode, "<C-.>", function()
            M.apply_quickfix_at_cursor(false)
        end, { silent = true, desc = "Quick Fix / Code Action" })

        vim.keymap.set(mode, "<M-CR>", function()
            M.apply_quickfix_at_cursor(false)
        end, { silent = true, desc = "Quick Fix / Code Action" })
    end
end

return M
