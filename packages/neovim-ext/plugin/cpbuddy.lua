if vim.g.loaded_cpbuddy then
    return
end
vim.g.loaded_cpbuddy = 1

-- Define auto-commands / commands entry
require("cpbuddy").setup()
