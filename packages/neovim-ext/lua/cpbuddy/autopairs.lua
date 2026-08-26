local M = {}

local pairs_map = {
    ["("] = ")",
    ["["] = "]",
    ["{"] = "}",
    ['"'] = '"',
    ["'"] = "'",
}

local closing_chars = {
    [")"] = true,
    ["]"] = true,
    ["}"] = true,
    ['"'] = true,
    ["'"] = true,
}

local matching_open = {
    [")"] = "(",
    ["]"] = "[",
    ["}"] = "{",
    ['"'] = '"',
    ["'"] = "'",
}

function M.handle_open(open_char, close_char)
    local line = vim.api.nvim_get_current_line()
    local col = vim.api.nvim_win_get_cursor(0)[2]
    local char_after = line:sub(col + 1, col + 1)
    
    -- Quotes check: if inside word, don't auto-close single quote
    if (open_char == "'" or open_char == '"') and open_char == close_char then
        local char_before = col > 0 and line:sub(col, col) or ""
        if char_after == open_char then
            -- Skip over closing quote
            return "<Right>"
        end
        if char_before:match("[%w_]") then
            return open_char
        end
    end

    -- Insert open and close char, then move cursor back 1 position
    return open_char .. close_char .. "<Left>"
end

function M.handle_close(close_char)
    local line = vim.api.nvim_get_current_line()
    local col = vim.api.nvim_win_get_cursor(0)[2]
    local char_after = line:sub(col + 1, col + 1)

    if char_after == close_char then
        return "<Right>"
    else
        return close_char
    end
end

function M.handle_backspace()
    local line = vim.api.nvim_get_current_line()
    local col = vim.api.nvim_win_get_cursor(0)[2]
    if col == 0 then return "<BS>" end

    local char_before = line:sub(col, col)
    local char_after = line:sub(col + 1, col + 1)

    if pairs_map[char_before] and pairs_map[char_before] == char_after then
        -- Delete both the open and close bracket
        return "<BS><Del>"
    end

    return "<BS>"
end

function M.handle_cr()
    if vim.fn.pumvisible() == 1 then
        return "<C-y>"
    end

    local line = vim.api.nvim_get_current_line()
    local col = vim.api.nvim_win_get_cursor(0)[2]
    local char_before = col > 0 and line:sub(col, col) or ""
    local char_after = line:sub(col + 1, col + 1)

    if char_before == "{" and char_after == "}" then
        return "<CR><Esc>O"
    elseif char_before == "(" and char_after == ")" then
        return "<CR><Esc>O"
    elseif char_before == "[" and char_after == "]" then
        return "<CR><Esc>O"
    end

    return "<CR>"
end

function M.setup()
    -- Map opening brackets
    for open_ch, close_ch in pairs(pairs_map) do
        vim.keymap.set("i", open_ch, function()
            return M.handle_open(open_ch, close_ch)
        end, { expr = true, noremap = true, desc = "Auto-close " .. open_ch })
    end

    -- Map closing brackets (skip-over)
    for close_ch, _ in pairs(closing_chars) do
        if close_ch ~= '"' and close_ch ~= "'" then
            vim.keymap.set("i", close_ch, function()
                return M.handle_close(close_ch)
            end, { expr = true, noremap = true, desc = "Skip close " .. close_ch })
        end
    end

    -- Map Smart Backspace
    vim.keymap.set("i", "<BS>", function()
        return M.handle_backspace()
    end, { expr = true, noremap = true, desc = "Smart Pair Backspace" })

    -- Map Smart Enter inside {}
    vim.keymap.set("i", "<CR>", function()
        return M.handle_cr()
    end, { expr = true, noremap = true, desc = "Smart Enter Expansion" })
end

return M
