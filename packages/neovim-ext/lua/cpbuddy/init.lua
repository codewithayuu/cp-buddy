local M = {}

M.config = require("cpbuddy.config")
M.highlights = require("cpbuddy.highlights")
M.utils = require("cpbuddy.utils")
M.layout = require("cpbuddy.layout")
M.runner = require("cpbuddy.runner")
M.testcase_manager = require("cpbuddy.testcase_manager")
M.tui_dashboard = require("cpbuddy.tui_dashboard")
M.stress = require("cpbuddy.stress")
M.snippets = require("cpbuddy.snippets")
M.contest = require("cpbuddy.contest")
M.submit = require("cpbuddy.submit")
M.router = require("cpbuddy.router")
M.zoom = require("cpbuddy.zoom")
M.home = require("cpbuddy.home")
M.completion = require("cpbuddy.completion")
M.autopairs = require("cpbuddy.autopairs")
M.theme = require("cpbuddy.monokai_true_dark")
M.sublime_keys = require("cpbuddy.sublime_keys")
M.linter = require("cpbuddy.linter")
M.quickfix = require("cpbuddy.quickfix")
M.notify_toast = require("cpbuddy.notify")

function M.setup(opts)
    -- 1. Initialize configuration
    M.config.setup(opts)

    -- Set cmdheight=0 to remove empty gap below status bar
    pcall(function() vim.opt.cmdheight = 0 end)

    -- Override vim.notify with 3-second auto-dismiss in-status-bar notification with [✕] close button
    vim.notify = function(msg, level, options)
        M.notify_toast.notify(msg, level, options)
    end

    -- 2. Initialize Pure AMOLED Monokai True Dark Theme & UI Highlights
    M.theme.setup()
    M.highlights.setup()

    -- 3. Setup Layout Auto-Sync
    M.layout.setup_autocmds()

    -- 4. Setup Mouse Scroll Zoom (Ctrl + ScrollWheel) & Split Dragging
    M.zoom.setup()

    -- 5. Setup Sublime-identical Autocompletion Popup
    M.completion.setup()

    -- 6. Setup Smart Bracket Autopairs & Auto-Closing
    M.autopairs.setup()

    -- 7. Setup Sublime Text Identical Keybindings (Undo, Redo, Save, Lines, CP)
    M.sublime_keys.setup()

    -- 8. Setup Instant Real-Time Syntax & Error Linter
    M.linter.setup()

    -- 9. Setup Ctrl+Click & Ctrl+. Instant QuickFix / Suggestion Applicator
    M.quickfix.setup()

    -- 10. Start Router and Polling in background
    if M.config.get("router").auto_start then
        M.router.start()
        M.router.poll()
    end

    -- 9. Register User Commands
    M.register_commands()

    -- 10. Register Default Keymaps
    M.register_keymaps()
end

function M.register_commands()
    local cmd = vim.api.nvim_create_user_command

    cmd("CPBuddyRun", function()
        M.runner.run_current_problem()
    end, { desc = "Run CPBuddy Testcases" })

    cmd("CPBuddyLayout", function()
        M.layout.toggle_layout()
    end, { desc = "Toggle Sublime Text 4-Split Layout" })

    cmd("CPBuddyDashboard", function()
        M.tui_dashboard.open()
    end, { desc = "Open CPBuddy Floating TUI Dashboard" })

    cmd("CPBuddySubmit", function()
        M.submit.submit_current()
    end, { desc = "Submit Problem Solution to Online Judge" })

    cmd("Submit", function()
        M.submit.submit_current()
    end, { desc = "Submit Problem Solution to Online Judge" })

    cmd("CPBuddyAddTest", function()
        M.testcase_manager.add_testcase()
    end, { desc = "Add a Custom Testcase" })

    cmd("CPBuddyDeleteProblem", function()
        M.testcase_manager.delete_problem()
    end, { desc = "Delete Current Problem & Testcases" })

    cmd("CPBuddyStressTest", function(opts)
        local iters = tonumber(opts.args)
        M.stress.start_stress_test(iters)
    end, { nargs = "?", desc = "Start Stress Testing against Brute Force" })

    cmd("CPBuddySnippets", function()
        M.snippets.open_picker()
    end, { desc = "Open CP Algorithm & Snippet Library" })

    cmd("CPBuddyContest", function()
        M.contest.open_problem_switcher()
    end, { desc = "Switch Between Contest Problems" })

    cmd("CPBuddyContestTimer", function(opts)
        local dur = tonumber(opts.args)
        if dur then
            M.contest.start(dur)
        else
            M.contest.toggle()
        end
    end, { nargs = "?", desc = "Start or Toggle Contest Countdown Timer" })

    cmd("CPBuddySwitchTest", function(opts)
        local idx = tonumber(opts.args) or 1
        M.layout.switch_testcase(idx)
    end, { nargs = 1, desc = "Switch to Specific Testcase in Split View" })

    cmd("CPBuddyNextTest", function()
        M.layout.next_testcase()
    end, { desc = "Switch to Next Testcase in Split View" })

    cmd("CPBuddyPrevTest", function()
        M.layout.prev_testcase()
    end, { desc = "Switch to Previous Testcase in Split View" })

    cmd("CPBuddyCloseTab", function()
        M.layout.close_problem_tab()
    end, { desc = "Close Current Problem Tab & Sync Layout" })

    cmd("CPBuddyNextTab", function()
        M.layout.next_problem_tab()
    end, { desc = "Switch to Next Problem Tab & Sync Layout" })

    cmd("CPBuddyPrevTab", function()
        M.layout.prev_problem_tab()
    end, { desc = "Switch to Previous Problem Tab & Sync Layout" })

    cmd("CPBuddyRouterStatus", function()
        M.router.status()
    end, { desc = "Check Router Connection & Daemon Status" })

    cmd("CPBuddyHome", function()
        M.home.open()
    end, { desc = "Open CPBuddy Home Dashboard" })
end

function M.register_keymaps()
    local km = M.config.get("keymaps")
    if not km then return end

    local function map(lhs, rhs, desc)
        if lhs and lhs ~= "" then
            vim.keymap.set("n", lhs, rhs, { noremap = true, silent = true, desc = "CPBuddy: " .. desc })
        end
    end

    map(km.run, ":CPBuddyRun<CR>", "Run Tests")
    map(km.run_leader, ":CPBuddyRun<CR>", "Run Tests")
    map(km.dashboard, ":CPBuddyDashboard<CR>", "Open TUI Dashboard")
    map(km.toggle_layout, ":CPBuddyLayout<CR>", "Toggle Sublime 4-Split Layout")
    map(km.add_test, ":CPBuddyAddTest<CR>", "Add Custom Testcase")
    map(km.delete_problem, ":CPBuddyDeleteProblem<CR>", "Delete Problem")
    map(km.submit, ":CPBuddySubmit<CR>", "Submit Solution")
    map(km.stress_test, ":CPBuddyStressTest<CR>", "Stress Test")
    map(km.snippets, ":CPBuddySnippets<CR>", "Algorithm Snippets")
    map(km.contest, ":CPBuddyContest<CR>", "Contest Problems")

    -- Sublime-style Testcase Switcher Keymaps
    map("<leader>1", ":CPBuddySwitchTest 1<CR>", "View Testcase 1")
    map("<leader>2", ":CPBuddySwitchTest 2<CR>", "View Testcase 2")
    map("<leader>3", ":CPBuddySwitchTest 3<CR>", "View Testcase 3")
    map("<leader>4", ":CPBuddySwitchTest 4<CR>", "View Testcase 4")
    map("<leader>5", ":CPBuddySwitchTest 5<CR>", "View Testcase 5")
    map("<leader>]", ":CPBuddyNextTest<CR>", "Next Testcase")
    map("<leader>[", ":CPBuddyPrevTest<CR>", "Prev Testcase")
end

return M
