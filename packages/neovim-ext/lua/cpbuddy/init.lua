local M = {}

M.router = require("cpbuddy.router")
M.layout = require("cpbuddy.layout")
M.runner = require("cpbuddy.runner")

function M.setup(opts)
    opts = opts or {}
    
    -- Start router in background
    M.router.start()
    
    -- Start polling for problems
    M.router.poll()
    
    -- Create commands
    vim.api.nvim_create_user_command("CPBuddyRun", function()
        M.runner.run_current_problem()
    end, {})
    
    -- Map keyboard shortcut (like F5)
    vim.keymap.set('n', '<F5>', ':CPBuddyRun<CR>', { noremap = true, silent = true, desc = "Run CPBuddy Tests" })
end

return M
