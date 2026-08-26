local M = {}

M.default_font_size = 14
M.is_maximized = false

-- Adjust Font Size / Scaling
function M.adjust(delta)
    -- 1. Neovide GUI scaling
    if vim.g.neovide then
        local current = vim.g.neovide_scale_factor or 1.0
        local next_scale = math.max(0.5, math.min(3.0, current + (delta * 0.05)))
        vim.g.neovide_scale_factor = next_scale
        return
    end

    -- 2. General GUI (Neovim-qt, Goneovim, VimR, FVim, etc.)
    if vim.fn.has("gui_running") == 1 or (vim.o.guifont and vim.o.guifont ~= "") then
        local guifont = vim.o.guifont
        local font_name, size = guifont:match("^(.-):h(%d+)")
        if font_name and size then
            local new_size = math.max(6, math.min(48, tonumber(size) + delta))
            vim.o.guifont = string.format("%s:h%d", font_name, new_size)
            return
        end
        local default_name = "JetBrainsMono Nerd Font"
        local new_size = math.max(6, math.min(48, M.default_font_size + delta))
        M.default_font_size = new_size
        vim.o.guifont = string.format("%s:h%d", default_name, new_size)
        return
    end

    -- 3. Terminal Emulator Dynamic Font Sizing (OSC 50 & Terminal CLIs)
    pcall(function()
        if delta > 0 then
            io.stdout:write("\027]50;#+1\007")
        else
            io.stdout:write("\027]50;#-1\007")
        end
        io.stdout:flush()
    end)

    local term_program = os.getenv("TERM_PROGRAM") or ""
    if term_program == "kitty" or os.getenv("KITTY_PID") then
        local cmd = string.format("kitty @ set-font-size %s%d 2>/dev/null", delta > 0 and "+" or "", delta)
        pcall(vim.fn.system, cmd)
    elseif term_program == "WezTerm" or os.getenv("WEZTERM_PANE") then
        local cmd = string.format("wezterm cli zoom %s 2>/dev/null", delta > 0 and "in" or "out")
        pcall(vim.fn.system, cmd)
    end
end

-- Reset Font Zoom
function M.reset()
    if vim.g.neovide then
        vim.g.neovide_scale_factor = 1.0
        return
    end
    M.default_font_size = 14
    local guifont = vim.o.guifont
    if guifont and guifont ~= "" then
        local font_name = guifont:match("^(.-):h%d+")
        if font_name then
            vim.o.guifont = string.format("%s:h14", font_name)
            return
        end
    end
    vim.o.guifont = "JetBrainsMono Nerd Font:h14"

    pcall(function()
        io.stdout:write("\027]50;#0\007")
        io.stdout:flush()
    end)

    local term_program = os.getenv("TERM_PROGRAM") or ""
    if term_program == "kitty" or os.getenv("KITTY_PID") then
        pcall(vim.fn.system, "kitty @ set-font-size 0 2>/dev/null")
    end
end

-- Window Split Resize Controls
function M.resize_width(delta)
    local cur_w = vim.api.nvim_win_get_width(0)
    local new_w = math.max(15, cur_w + delta)
    pcall(vim.api.nvim_win_set_width, 0, new_w)
end

function M.resize_height(delta)
    local cur_h = vim.api.nvim_win_get_height(0)
    local new_h = math.max(4, cur_h + delta)
    pcall(vim.api.nvim_win_set_height, 0, new_h)
end

-- Toggle Window Zoom / Maximize (Focus Single Pane <-> Restore 4-Split)
function M.toggle_maximize()
    local wins = vim.api.nvim_list_wins()
    if #wins > 1 then
        M.is_maximized = true
        vim.cmd("silent! only")
        local utils = require("cpbuddy.utils")
        utils.notify("🔍 Maximized pane (Press <leader>z to restore layout)", vim.log.levels.INFO)
    else
        M.is_maximized = false
        local layout = require("cpbuddy.layout")
        local info = require("cpbuddy.utils").get_problem_info()
        if info then
            layout.setup_layout(info.filepath, layout.current_test_idx or 1)
        end
    end
end

function M.setup()
    -- Enable Full Mouse Support for Dragging Borders & Scrolling
    vim.opt.mouse = "a"
    vim.opt.mousemodel = "extend"
    vim.opt.equalalways = false
    vim.opt.mousescroll = "ver:3,hor:6"
    vim.opt.fillchars = {
        vert = "│",
        horiz = "─",
        eob = " ",
    }

    local modes = { "n", "i", "v", "t" }

    -- 1. Mouse Scroll Zoom with Ctrl key
    for _, mode in ipairs(modes) do
        vim.keymap.set(mode, "<C-ScrollWheelUp>", function() M.adjust(1) end, { silent = true, desc = "Zoom In (Font Size)" })
        vim.keymap.set(mode, "<C-ScrollWheelDown>", function() M.adjust(-1) end, { silent = true, desc = "Zoom Out (Font Size)" })

        -- Keyboard Font Zoom Shortcuts
        vim.keymap.set(mode, "<C-=>", function() M.adjust(1) end, { silent = true, desc = "Zoom In" })
        vim.keymap.set(mode, "<C-+>", function() M.adjust(1) end, { silent = true, desc = "Zoom In" })
        vim.keymap.set(mode, "<C-->", function() M.adjust(-1) end, { silent = true, desc = "Zoom Out" })
        vim.keymap.set(mode, "<C-0>", function() M.reset() end, { silent = true, desc = "Reset Zoom" })
    end

    -- 2. Seamless Split Window Resizing Keymaps
    local resize_modes = { "n", "v" }
    for _, mode in ipairs(resize_modes) do
        -- Ctrl + Arrow keys
        vim.keymap.set(mode, "<C-Left>", function() M.resize_width(-4) end, { silent = true, desc = "Shrink Window Width" })
        vim.keymap.set(mode, "<C-Right>", function() M.resize_width(4) end, { silent = true, desc = "Expand Window Width" })
        vim.keymap.set(mode, "<C-Up>", function() M.resize_height(3) end, { silent = true, desc = "Expand Window Height" })
        vim.keymap.set(mode, "<C-Down>", function() M.resize_height(-3) end, { silent = true, desc = "Shrink Window Height" })

        -- Alt / Option + Arrow keys
        vim.keymap.set(mode, "<M-Left>", function() M.resize_width(-4) end, { silent = true, desc = "Shrink Window Width" })
        vim.keymap.set(mode, "<M-Right>", function() M.resize_width(4) end, { silent = true, desc = "Expand Window Width" })
        vim.keymap.set(mode, "<M-Up>", function() M.resize_height(3) end, { silent = true, desc = "Expand Window Height" })
        vim.keymap.set(mode, "<M-Down>", function() M.resize_height(-3) end, { silent = true, desc = "Shrink Window Height" })

        -- Alt + H/J/K/L
        vim.keymap.set(mode, "<M-h>", function() M.resize_width(-4) end, { silent = true, desc = "Shrink Window Width" })
        vim.keymap.set(mode, "<M-l>", function() M.resize_width(4) end, { silent = true, desc = "Expand Window Width" })
        vim.keymap.set(mode, "<M-k>", function() M.resize_height(3) end, { silent = true, desc = "Expand Window Height" })
        vim.keymap.set(mode, "<M-j>", function() M.resize_height(-3) end, { silent = true, desc = "Shrink Window Height" })
    end

    -- Window maximize toggle (<leader>z or <leader>wm)
    vim.keymap.set("n", "<leader>z", M.toggle_maximize, { silent = true, desc = "Toggle Maximize Window" })
    vim.keymap.set("n", "<leader>wm", M.toggle_maximize, { silent = true, desc = "Toggle Maximize Window" })
    vim.keymap.set("n", "<leader>w=", "<C-w>=", { silent = true, desc = "Equalize All Splits" })
end

return M
