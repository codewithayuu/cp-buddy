-- LazyVim / Lazy.nvim plugin specification for CPBuddy
-- Add this file to your ~/.config/nvim/lua/plugins/cpbuddy.lua or lazy extras

return {
    "codewithayuu/cp-buddy",
    dir = vim.fn.expand("~/Projects/CPBuddy/packages/neovim-ext"), -- or github repo
    name = "cpbuddy.nvim",
    cmd = {
        "CPBuddyRun",
        "CPBuddyLayout",
        "CPBuddyDashboard",
        "CPBuddySubmit",
        "CPBuddyAddTest",
        "CPBuddyDeleteProblem",
        "CPBuddyStressTest",
        "CPBuddySnippets",
        "CPBuddyContest",
        "CPBuddyContestTimer",
        "CPBuddySwitchTest",
        "CPBuddyRouterStatus",
    },
    keys = {
        { "<F5>", "<cmd>CPBuddyRun<cr>", desc = "Run CPBuddy Tests" },
        { "<leader>cr", "<cmd>CPBuddyRun<cr>", desc = "Run CPBuddy Tests" },
        { "<leader>ct", "<cmd>CPBuddyDashboard<cr>", desc = "CPBuddy TUI Dashboard" },
        { "<leader>cl", "<cmd>CPBuddyLayout<cr>", desc = "Toggle Sublime 4-Split Layout" },
        { "<leader>ca", "<cmd>CPBuddyAddTest<cr>", desc = "Add Custom Testcase" },
        { "<leader>cd", "<cmd>CPBuddyDeleteProblem<cr>", desc = "Delete Problem & Tests" },
        { "<leader>cs", "<cmd>CPBuddySubmit<cr>", desc = "Submit to Judge" },
        { "<leader>cst", "<cmd>CPBuddyStressTest<cr>", desc = "Stress Test Solution" },
        { "<leader>cp", "<cmd>CPBuddySnippets<cr>", desc = "CP Algorithm Snippets" },
        { "<leader>cc", "<cmd>CPBuddyContest<cr>", desc = "Contest Problem Switcher" },
    },
    opts = {
        workspace_root = "/home/ayu/Dev/cp",
        default_language = "cpp",
        layout = {
            mode = "sublime", -- "sublime" or "floating"
            code_width_ratio = 0.70,
        },
        router = {
            auto_start = true,
            port = 27121,
        },
    },
    config = function(_, opts)
        require("cpbuddy").setup(opts)
    end,
}
