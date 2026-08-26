local M = {}
local utils = require("cpbuddy.utils")
local config = require("cpbuddy.config")

function M.open()
    -- Only open if no arguments were passed and current buffer is empty
    local buf = vim.api.nvim_get_current_buf()
    
    vim.bo[buf].buftype = "nofile"
    vim.bo[buf].bufhidden = "wipe"
    vim.bo[buf].swapfile = false
    vim.bo[buf].filetype = "cpbuddy_home"

    -- Setup custom highlights
    vim.cmd([[
        highlight default CPBuddyTitle guifg=#7aa2f7 gui=bold ctermfg=39 cterm=bold
        highlight default CPBuddySub guifg=#bb9af7 gui=italic ctermfg=141
        highlight default CPBuddyKey guifg=#ff9e64 gui=bold ctermfg=215 cterm=bold
        highlight default CPBuddyLabel guifg=#c0caf5 gui=none ctermfg=253
        highlight default CPBuddyInfo guifg=#7dcfff gui=none ctermfg=117
        highlight default CPBuddyBorder guifg=#565f89 gui=none ctermfg=60
        highlight default CPBuddySuccess guifg=#9ece6a gui=bold ctermfg=120 cterm=bold
    ]])

    local workspace = utils.get_workspace_root()
    local port = config.get("router.port") or 27121
    local default_lang = config.get("default_language") or "cpp"

    local lines = {
        "",
        "   ██████╗██████╗ ██████╗ ██╗   ██╗██████╗ ██████╗ ██╗   ██╗",
        "  ██╔════╝██╔══██╗██╔══██╗██║   ██║██╔══██╗██╔══██╗╚██╗ ██╔╝",
        "  ██║     ██████╔╝██████╔╝██║   ██║██║  ██║██║  ██║ ╚████╔╝ ",
        "  ██║     ██╔═══╝ ██╔══██╗██║   ██║██║  ██║██║  ██║  ╚██╔╝  ",
        "  ╚██████╗██║     ██████╔╝╚██████╔╝██████╔╝██████╔╝   ██║   ",
        "   ╚═════╝╚═╝     ╚═════╝  ╚═════╝ ╚═════╝ ╚═════╝    ╚═╝   ",
        "",
        "     🏆 High-Speed Competitive Programming TUI Environment",
        "   ─────────────────────────────────────────────────────────────",
        "",
        "     [n]  📝  New Problem Solution",
        "     [f]  🔍  Find / Browse Problem Files",
        "     [s]  📦  CP Algorithm & Snippets Library",
        "     [c]  ⏱️   Contest Mode & Timer",
        "     [d]  🎛️   Interactive Testcase Dashboard",
        "     [t]  📐  Toggle Sublime Text 4-Split Layout",
        "     [q]  🚪  Quit CPBuddy",
        "",
        "   ─────────────────────────────────────────────────────────────",
        "    ⚡ Competitive Companion: Listening on port " .. tostring(port),
        "    📁 Workspace Directory:    " .. workspace,
        "    🔧 Default Language:      " .. default_lang:upper() .. " (LSP: clangd/pyright ready)",
        "    ⌨️  Runner Keybinding:      <F5> or <leader>cr",
        "",
    }

    vim.bo[buf].modifiable = true
    vim.api.nvim_buf_set_lines(buf, 0, -1, false, lines)
    vim.bo[buf].modifiable = false

    -- Apply syntax highlighting highlights to buffer
    local ns = vim.api.nvim_create_namespace("cpbuddy_home")
    
    -- Title banner highlight
    for i = 1, 7 do
        vim.api.nvim_buf_add_highlight(buf, ns, "CPBuddyTitle", i, 0, -1)
    end
    -- Subtitle
    vim.api.nvim_buf_add_highlight(buf, ns, "CPBuddySub", 8, 0, -1)
    vim.api.nvim_buf_add_highlight(buf, ns, "CPBuddyBorder", 9, 0, -1)

    -- Menu options
    for i = 11, 17 do
        vim.api.nvim_buf_add_highlight(buf, ns, "CPBuddyKey", i, 5, 8)
        vim.api.nvim_buf_add_highlight(buf, ns, "CPBuddyLabel", i, 8, -1)
    end

    -- Separator and info footer
    vim.api.nvim_buf_add_highlight(buf, ns, "CPBuddyBorder", 18, 0, -1)
    vim.api.nvim_buf_add_highlight(buf, ns, "CPBuddySuccess", 19, 0, -1)
    vim.api.nvim_buf_add_highlight(buf, ns, "CPBuddyInfo", 20, 0, -1)
    vim.api.nvim_buf_add_highlight(buf, ns, "CPBuddyInfo", 21, 0, -1)
    vim.api.nvim_buf_add_highlight(buf, ns, "CPBuddyKey", 22, 0, -1)

    -- Buffer-local action keymaps
    local opts = { buffer = buf, silent = true, noremap = true }

    -- New Problem
    vim.keymap.set("n", "n", function()
        vim.ui.input({ prompt = "Enter problem name (e.g. Codeforces/1920A): " }, function(name)
            if not name or name == "" then return end
            local ext = config.get("default_language") == "python" and "py" or "cpp"
            local full_path = workspace .. "/" .. name
            if not full_path:find("%." .. ext .. "$") then
                full_path = full_path .. "." .. ext
            end
            vim.fn.mkdir(vim.fs.dirname(full_path), "p")
            vim.cmd("edit " .. full_path)
        end)
    end, opts)

    -- Find Problem
    vim.keymap.set("n", "f", function()
        local files = vim.fn.globpath(workspace, "**/*.*", false, true)
        local display_items = {}
        for _, file in ipairs(files) do
            if not file:find("/%.cpbuddy/") and not file:find("/%.git/") then
                local rel = file:sub(#workspace + 2)
                table.insert(display_items, { text = rel, path = file })
            end
        end
        if #display_items == 0 then
            vim.notify("No problem files found in " .. workspace, vim.log.levels.INFO)
            return
        end
        vim.ui.select(display_items, {
            prompt = "Select Problem to Open:",
            format_item = function(item) return "📄 " .. item.text end,
        }, function(choice)
            if choice then
                vim.cmd("edit " .. choice.path)
            end
        end)
    end, opts)

    -- Snippets
    vim.keymap.set("n", "s", function()
        require("cpbuddy.snippets").open_picker()
    end, opts)

    -- Contest Mode
    vim.keymap.set("n", "c", function()
        require("cpbuddy.contest").prompt_start()
    end, opts)

    -- Dashboard
    vim.keymap.set("n", "d", function()
        require("cpbuddy.tui_dashboard").open()
    end, opts)

    -- Layout
    vim.keymap.set("n", "t", function()
        require("cpbuddy.layout").toggle()
    end, opts)

    -- Quit
    vim.keymap.set("n", "q", "<cmd>qa!<cr>", opts)
    vim.keymap.set("n", "<CR>", function()
        local line_nr = vim.api.nvim_win_get_cursor(0)[1]
        if line_nr == 12 then -- n
            vim.api.nvim_feedkeys("n", "n", false)
        elseif line_nr == 13 then -- f
            vim.api.nvim_feedkeys("f", "n", false)
        elseif line_nr == 14 then -- s
            vim.api.nvim_feedkeys("s", "n", false)
        elseif line_nr == 15 then -- c
            vim.api.nvim_feedkeys("c", "n", false)
        elseif line_nr == 16 then -- d
            vim.api.nvim_feedkeys("d", "n", false)
        elseif line_nr == 17 then -- t
            vim.api.nvim_feedkeys("t", "n", false)
        elseif line_nr == 18 then -- q
            vim.api.nvim_feedkeys("q", "n", false)
        end
    end, opts)
end

return M
