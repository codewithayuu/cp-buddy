-- Sublime Text Identical Keybindings for CPBuddy
-- Covers Undo/Redo, Clipboard, Line Moves, Comments, Duplication, and CP Shortcuts

local M = {}

function M.setup()
    local map = function(modes, lhs, rhs, desc)
        if type(modes) == "string" then modes = { modes } end
        for _, mode in ipairs(modes) do
            vim.keymap.set(mode, lhs, rhs, { silent = true, noremap = true, desc = desc })
        end
    end

    -- 1. Undo & Redo (Sublime Style: Ctrl+Z for undo, Ctrl+Y / Ctrl+Shift+Z for redo)
    map({ "n", "v" }, "<C-z>", "u", "Undo (Sublime)")
    map("i", "<C-z>", "<C-o>u", "Undo (Sublime)")
    map({ "n", "v" }, "<C-y>", "<C-r>", "Redo (Sublime)")
    map("i", "<C-y>", "<C-o><C-r>", "Redo (Sublime)")
    map({ "n", "v" }, "<C-S-z>", "<C-r>", "Redo (Sublime)")
    map("i", "<C-S-z>", "<C-o><C-r>", "Redo (Sublime)")
    map({ "n", "v" }, "<C-S-Z>", "<C-r>", "Redo (Sublime)")
    map("i", "<C-S-Z>", "<C-o><C-r>", "Redo (Sublime)")

    -- 2. Save & Quit
    map({ "n", "i", "v" }, "<C-s>", "<cmd>silent! write<cr>", "Save File (Sublime)")
    map({ "n" }, "<C-q>", "<cmd>qa!<cr>", "Force Quit All")
    map({ "n" }, "<leader>w", "<cmd>silent! write<cr>", "Save File")
    map({ "n" }, "<leader>q", "<cmd>q<cr>", "Quit Window")
    map({ "n" }, "<leader>Q", "<cmd>qa!<cr>", "Force Quit All")

    -- 3. Clipboard (Sublime Style: Ctrl+C copy, Ctrl+X cut, Ctrl+V paste)
    map("v", "<C-c>", '"+y', "Copy to Clipboard (Sublime)")
    map("v", "<C-x>", '"+d', "Cut to Clipboard (Sublime)")
    map("n", "<C-v>", '"+p', "Paste from Clipboard (Sublime)")
    map("i", "<C-v>", '<C-r>+', "Paste from Clipboard (Sublime)")
    map("c", "<C-v>", '<C-r>+', "Paste from Clipboard (Sublime)")

    -- 4. Select All (Ctrl+A)
    map({ "n", "v" }, "<C-a>", "ggVG", "Select All (Sublime)")
    map("i", "<C-a>", "<Esc>ggVG", "Select All (Sublime)")

    -- 5. Line Duplication & Deletion (Sublime Style)
    -- Duplicate Line: Ctrl+Shift+D or Ctrl+Alt+Down
    map("n", "<C-S-d>", "<cmd>t.<cr>", "Duplicate Line Down (Sublime)")
    map("i", "<C-S-d>", "<Esc><cmd>t.<cr>gi", "Duplicate Line Down (Sublime)")
    map("v", "<C-S-d>", ":t'><cr>gv", "Duplicate Selection (Sublime)")
    map("n", "<C-M-Down>", "<cmd>t.<cr>", "Duplicate Line Down")
    map("i", "<C-M-Down>", "<Esc><cmd>t.<cr>gi", "Duplicate Line Down")

    -- Delete Line: Ctrl+Shift+K or Ctrl+Alt+Up
    map("n", "<C-S-k>", "dd", "Delete Line (Sublime)")
    map("i", "<C-S-k>", "<Esc>ddi", "Delete Line (Sublime)")
    map("n", "<C-M-Up>", "dd", "Delete Line")
    map("i", "<C-M-Up>", "<Esc>ddi", "Delete Line")

    -- Move Line / Selection Up & Down (Alt+Up / Alt+Down or Alt+k / Alt+j)
    map("n", "<M-Up>", "<cmd>m .-2<cr>==", "Move Line Up")
    map("n", "<M-Down>", "<cmd>m .+1<cr>==", "Move Line Down")
    map("i", "<M-Up>", "<Esc><cmd>m .-2<cr>==gi", "Move Line Up")
    map("i", "<M-Down>", "<Esc><cmd>m .+1<cr>==gi", "Move Line Down")
    map("v", "<M-Up>", ":m '<-2<cr>gv=gv", "Move Selection Up")
    map("v", "<M-Down>", ":m '>+1<cr>gv=gv", "Move Selection Down")

    -- 6. Commenting (Ctrl+/ or Ctrl+_)
    local comment_line = function()
        local line = vim.api.nvim_get_current_line()
        local lnum = vim.api.nvim_win_get_cursor(0)[1]
        local comment_leader = "// "
        if vim.bo.filetype == "python" or vim.bo.filetype == "sh" then
            comment_leader = "# "
        end
        if line:match("^%s*" .. vim.pesc(comment_leader:sub(1, 1))) then
            local stripped = line:gsub("^([%s]*)" .. vim.pesc(comment_leader), "%1", 1)
            if stripped == line then
                stripped = line:gsub("^([%s]*)" .. vim.pesc(comment_leader:sub(1, 1)), "%1", 1)
            end
            vim.api.nvim_set_current_line(stripped)
        else
            local indent, content = line:match("^([%s]*)(.*)$")
            vim.api.nvim_set_current_line(indent .. comment_leader .. content)
        end
    end

    map({ "n", "i" }, "<C-/>", comment_line, "Toggle Line Comment (Sublime)")
    map({ "n", "i" }, "<C-_>", comment_line, "Toggle Line Comment (Sublime)")
    map("v", "<C-/>", ":'<,'>normal gcc<cr>", "Toggle Comment Selection")
    map("v", "<C-_>", ":'<,'>normal gcc<cr>", "Toggle Comment Selection")

    -- 7. Search & Replace (Sublime Style: Ctrl+F find, Ctrl+H replace)
    map("n", "<C-f>", "/", "Find (Sublime)")
    map("i", "<C-f>", "<Esc>/", "Find (Sublime)")
    map("n", "<C-h>", ":%s/", "Find & Replace (Sublime)")

    -- 8. Indentation (Ctrl+] indent, Ctrl+[ unindent or Tab / Shift+Tab in visual)
    map("v", "<Tab>", ">gv", "Indent Block")
    map("v", "<S-Tab>", "<gv", "Unindent Block")

    -- 9. Competitive Programming & User Sublime Custom Mappings
    -- Local Run: Ctrl+Shift+U, Ctrl+Alt+B, F5, <leader>r
    map({ "n", "i", "v" }, "<C-S-u>", "<cmd>CPBuddyRun<cr>", "Run CP Testcases Locally (Sublime)")
    map({ "n", "i", "v" }, "<C-S-U>", "<cmd>CPBuddyRun<cr>", "Run CP Testcases Locally (Sublime)")
    map({ "n", "i", "v" }, "<C-M-b>", "<cmd>CPBuddyRun<cr>", "Run CP Testcases Locally")
    map({ "n", "i", "v" }, "<F5>", "<cmd>CPBuddyRun<cr>", "Run CP Testcases Locally")
    map({ "n" }, "<leader>r", "<cmd>CPBuddyRun<cr>", "Run CP Testcases")
    
    -- Submit Solution: Ctrl+Shift+O, F6, <leader>s
    map({ "n", "i", "v" }, "<C-S-o>", "<cmd>CPBuddySubmit<cr>", "Submit Solution (Sublime)")
    map({ "n", "i", "v" }, "<C-S-O>", "<cmd>CPBuddySubmit<cr>", "Submit Solution (Sublime)")
    map({ "n", "i", "v" }, "<F6>", "<cmd>CPBuddySubmit<cr>", "Submit Solution")
    map({ "n" }, "<leader>s", "<cmd>CPBuddySubmit<cr>", "Submit Solution")
    
    -- CPBuddy Snippets Browser: Ctrl+Shift+Y, <leader>y
    map({ "n", "i", "v" }, "<C-S-y>", "<cmd>CPBuddySnippets<cr>", "Snippets Browser (Sublime)")
    map({ "n", "i", "v" }, "<C-S-Y>", "<cmd>CPBuddySnippets<cr>", "Snippets Browser (Sublime)")
    map({ "n" }, "<leader>y", "<cmd>CPBuddySnippets<cr>", "Snippets Browser")
    
    -- Toggle Right Layout Pane: Ctrl+K Ctrl+P, <leader>t
    vim.keymap.set("n", "<C-k><C-p>", "<cmd>CPBuddyLayout<cr>", { silent = true, desc = "Toggle Right Panel (Sublime)" })
    map({ "n" }, "<leader>t", "<cmd>CPBuddyLayout<cr>", "Toggle 4-Split Layout")
    map({ "n" }, "<leader>p", "<cmd>CPBuddyContest<cr>", "Contest Problem Switcher")
    map({ "n" }, "<leader>d", "<cmd>CPBuddyDashboard<cr>", "Open Dashboard")

    -- 10. Sublime Text Tabs Navigation & Close
    map({ "n", "i", "v" }, "<C-w>", "<cmd>CPBuddyCloseTab<cr>", "Close Tab (Sublime)")
    map({ "n" }, "<leader>bd", "<cmd>CPBuddyCloseTab<cr>", "Close Tab")
    map({ "n" }, "<leader>c", "<cmd>CPBuddyCloseTab<cr>", "Close Tab")
    map({ "n", "i", "v" }, "<C-PageDown>", "<cmd>CPBuddyNextTab<cr>", "Next Tab (Sublime)")
    map({ "n", "i", "v" }, "<C-PageUp>", "<cmd>CPBuddyPrevTab<cr>", "Previous Tab (Sublime)")
    map({ "n" }, "gt", "<cmd>CPBuddyNextTab<cr>", "Next Tab")
    map({ "n" }, "gT", "<cmd>CPBuddyPrevTab<cr>", "Previous Tab")
    map({ "n" }, "]b", "<cmd>CPBuddyNextTab<cr>", "Next Tab")
    map({ "n" }, "[b", "<cmd>CPBuddyPrevTab<cr>", "Previous Tab")
    map({ "n", "i", "v" }, "<C-Tab>", "<cmd>CPBuddyNextTab<cr>", "Next Tab")
    map({ "n", "i", "v" }, "<C-S-Tab>", "<cmd>CPBuddyPrevTab<cr>", "Previous Tab")
end

return M
