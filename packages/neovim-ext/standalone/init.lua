-- CPBuddy Standalone Full-Battery Competitive Programming IDE
-- Merges the best of LazyVim and jdhao/nvim-config

-- 1. Base Neovim Options
vim.g.mapleader = " "
vim.g.maplocalleader = " "

vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.mouse = "a"
vim.opt.mousemodel = "extend"
vim.opt.equalalways = false
vim.opt.mousescroll = "ver:3,hor:6"
vim.opt.fillchars = {
    vert = "│",
    horiz = "─",
    eob = " ",
}
vim.opt.termguicolors = true
vim.opt.cursorline = true
vim.opt.expandtab = true
vim.opt.shiftwidth = 4
vim.opt.tabstop = 4
vim.opt.softtabstop = 4
vim.opt.smartindent = true
vim.opt.wrap = false
vim.opt.signcolumn = "yes"
vim.opt.splitright = true
vim.opt.splitbelow = true
vim.opt.updatetime = 100
vim.opt.timeoutlen = 300
vim.opt.clipboard = "unnamedplus"
vim.opt.undofile = true
vim.opt.scrolloff = 8
vim.opt.completeopt = "menu,menuone,noselect,noinsert"
vim.opt.laststatus = 3 -- Global statusline
vim.opt.cmdheight = 0 -- Remove empty gap row below status bar
vim.opt.showmode = false

-- Instant syntax & filetype detection
vim.cmd("syntax on")
vim.cmd("filetype plugin indent on")

-- 2. Add CPBuddy to runtimepath
local script_dir = debug.getinfo(1, "S").source:sub(2):match("(.*[/\\])")
local cpbuddy_root = vim.fn.fnamemodify(script_dir .. "..", ":p")
vim.opt.rtp:prepend(cpbuddy_root)

-- 3. Built-in Native LSP Configuration (clangd, pyright, rust-analyzer, gopls)
local function setup_native_lsp()
    -- C / C++ LSP (clangd)
    vim.api.nvim_create_autocmd("FileType", {
        pattern = { "c", "cpp" },
        callback = function(ev)
            if vim.fn.executable("clangd") == 1 then
                vim.lsp.start({
                    name = "clangd",
                    cmd = { "clangd", "--clang-tidy", "--header-insertion=never", "--completion-style=detailed", "--offset-encoding=utf-16" },
                    root_dir = vim.fs.root(ev.buf, { ".git", ".cpbuddy", "compile_commands.json" }) or vim.fn.expand("%:p:h"),
                })
            end
        end,
    })

    -- Python LSP (pyright or pylsp)
    vim.api.nvim_create_autocmd("FileType", {
        pattern = { "python" },
        callback = function(ev)
            if vim.fn.executable("pyright-langserver") == 1 then
                vim.lsp.start({
                    name = "pyright",
                    cmd = { "pyright-langserver", "--stdio" },
                    root_dir = vim.fs.root(ev.buf, { ".git", ".cpbuddy" }) or vim.fn.expand("%:p:h"),
                })
            elseif vim.fn.executable("pyright") == 1 then
                vim.lsp.start({
                    name = "pyright",
                    cmd = { "pyright", "--stdio" },
                    root_dir = vim.fs.root(ev.buf, { ".git", ".cpbuddy" }) or vim.fn.expand("%:p:h"),
                })
            elseif vim.fn.executable("pylsp") == 1 then
                vim.lsp.start({
                    name = "pylsp",
                    cmd = { "pylsp" },
                    root_dir = vim.fs.root(ev.buf, { ".git", ".cpbuddy" }) or vim.fn.expand("%:p:h"),
                })
            end
        end,
    })

    -- Rust LSP (rust-analyzer)
    vim.api.nvim_create_autocmd("FileType", {
        pattern = { "rust" },
        callback = function(ev)
            if vim.fn.executable("rust-analyzer") == 1 then
                vim.lsp.start({
                    name = "rust_analyzer",
                    cmd = { "rust-analyzer" },
                    root_dir = vim.fs.root(ev.buf, { "Cargo.toml", ".git", ".cpbuddy" }) or vim.fn.expand("%:p:h"),
                })
            end
        end,
    })

    -- Go LSP (gopls)
    vim.api.nvim_create_autocmd("FileType", {
        pattern = { "go" },
        callback = function(ev)
            if vim.fn.executable("gopls") == 1 then
                vim.lsp.start({
                    name = "gopls",
                    cmd = { "gopls" },
                    root_dir = vim.fs.root(ev.buf, { "go.mod", ".git", ".cpbuddy" }) or vim.fn.expand("%:p:h"),
                })
            end
        end,
    })

    -- LSP Attach Handlers & Keymaps
    vim.api.nvim_create_autocmd("LspAttach", {
        callback = function(ev)
            local bufnr = ev.buf
            vim.bo[bufnr].omnifunc = "v:lua.vim.lsp.omnifunc"

            local map = function(keys, func, desc)
                vim.keymap.set("n", keys, func, { buffer = bufnr, desc = "LSP: " .. desc })
            end
            map("gd", vim.lsp.buf.definition, "Go to Definition")
            map("gr", vim.lsp.buf.references, "Go to References")
            map("K", vim.lsp.buf.hover, "Hover Documentation")
            map("<leader>crn", vim.lsp.buf.rename, "Rename Symbol")
            map("<leader>ca", vim.lsp.buf.code_action, "Code Action")
            map("[d", vim.diagnostic.goto_prev, "Previous Diagnostic")
            map("]d", vim.diagnostic.goto_next, "Next Diagnostic")
        end,
    })

    -- Diagnostic Configuration (Real-time update in insert mode)
    vim.diagnostic.config({
        virtual_text = {
            prefix = "● ",
            spacing = 2,
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
end
setup_native_lsp()

-- 6. Custom Vibrant Global Statusline
function _G.CPBuddyStatusline()
    local mode = vim.api.nvim_get_mode().mode
    local mode_names = {
        n = "NORMAL",
        i = "INSERT",
        v = "VISUAL",
        V = "V-LINE",
        ["\22"] = "V-BLOCK",
        c = "COMMAND",
        t = "TERMINAL",
    }
    local mode_str = mode_names[mode] or mode:upper()
    
    local ok_cp, cp = pcall(require, "cpbuddy")
    local cp_info = ""
    if ok_cp and cp.contest then
        local contest_status = cp.contest.get_status()
        if contest_status ~= "" then
            cp_info = " │ " .. contest_status
        else
            cp_info = " │ 🏆 CPBuddy"
        end
    end

    local ok_utils, utils = pcall(require, "cpbuddy.utils")
    local difficulty_str = ""
    if ok_utils and utils.get_problem_difficulty then
        local diff = utils.get_problem_difficulty(0)
        if diff ~= "" then
            difficulty_str = " │ " .. diff
        end
    end

    local ok_notify, notify = pcall(require, "cpbuddy.notify")
    local notification_str = ""
    if ok_notify and notify.get_status_notification then
        notification_str = notify.get_status_notification()
    end

    local middle_item = difficulty_str
    if notification_str ~= "" then
        middle_item = notification_str
    end

    local filetype = vim.bo.filetype
    if filetype == "" then filetype = "cpbuddy" end
    local current_time = os.date("%H:%M")

    return string.format("  %%#CPBuddyTitle# %s %%*%%#CPBuddyLabel#%s%s %%*%%=%%#CPBuddyInfo# %s │ %%l:%%c │ 🕒 %s  ",
        mode_str, cp_info, middle_item, filetype:upper(), current_time)
end

vim.opt.statusline = "%!v:lua.CPBuddyStatusline()"

-- 7. Initialize CPBuddy
local cpbuddy = require("cpbuddy")
cpbuddy.setup({
    workspace_root = "/home/ayu/Dev/cp",
    default_language = "cpp",
    layout = {
        mode = "sublime",
        code_width_ratio = 0.70,
    },
    router = {
        auto_start = true,
        port = 27121,
    },
})

-- 8. Global Keybindings
local function map(mode, lhs, rhs, desc)
    vim.keymap.set(mode, lhs, rhs, { noremap = true, silent = true, desc = desc })
end

map("n", "<C-s>", "<cmd>w<cr>", "Save File")
map("n", "<leader>w", "<cmd>w<cr>", "Save File")
map("n", "<leader>q", "<cmd>q<cr>", "Quit Window")
map("n", "<leader>Q", "<cmd>qa!<cr>", "Force Quit All")

-- Window Navigation
map("n", "<C-h>", "<C-w>h", "Navigate Left")
map("n", "<C-j>", "<C-w>j", "Navigate Down")
map("n", "<C-k>", "<C-w>k", "Navigate Up")
map("n", "<C-l>", "<C-w>l", "Navigate Right")

-- 9. Open Home Dashboard or Problem 4-Split Layout on startup
vim.api.nvim_create_autocmd({ "VimEnter", "UIEnter" }, {
    callback = function()
        vim.schedule(function()
            if vim.fn.argc() == 0 and vim.api.nvim_buf_get_name(0) == "" and vim.bo.filetype ~= "cpbuddy_home" then
                cpbuddy.home.open()
            elseif vim.fn.argc() > 0 then
                local filepath = vim.fn.argv(0)
                if filepath and filepath ~= "" then
                    local abs_path = vim.fn.fnamemodify(filepath, ":p")
                    if vim.fn.filereadable(abs_path) == 1 then
                        local info = cpbuddy.utils.get_problem_info(abs_path)
                        if info and info.filepath then
                            cpbuddy.layout.setup_layout(info.filepath, 1)
                        end
                    end
                end
            end
        end)
    end,
})
