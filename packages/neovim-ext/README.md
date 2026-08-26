# 🏆 CPBuddy for Neovim & TUI

<div align="center">

**The Ultimate Competitive Programming Environment for Neovim & Terminal**

[![Neovim](https://img.shields.io/badge/Neovim-0.9+-57A143?style=for-the-badge&logo=neovim&logoColor=white)](https://neovim.io)
[![Lua](https://img.shields.io/badge/Lua-5.1%20%2F%20LuaJIT-000080?style=for-the-badge&logo=lua&logoColor=white)](https://lua.org)
[![License](https://img.shields.io/badge/License-AGPL%203.0-blue?style=for-the-badge)](LICENSE)

</div>

---

## ✨ Features

- ⚡ **Instant Problem Parsing**: Seamlessly receives problems from Competitive Companion on port `27121`.
- 🧠 **Native LSP & Autocompletion**: Zero-delay language server integration (`clangd`, `pyright`, `rust-analyzer`, `gopls`) with `gd` (Go to Definition), `K` (Hover Docs), and `<Tab>` supertab autocompletion.
- 🎨 **Treesitter Syntax Highlighting**: Rich token parsing and vibrant syntax coloring inspired by `LazyVim` and `jdhao/nvim-config`.
- 📐 **Sublime Text 4-Split Layout**: Exact replication of the classic CP Sublime layout (Solution on left 70%, Input, Expected Output, and Live Results on right 30%).
- 🎛️ **Interactive Floating TUI Dashboard**: Centered modal with testcase tabs (`[1: AC] [2: WA] [+]`), live diff viewer, and instant shortcuts.
- 🚀 **Multi-Language Test Runner**: Supports C++20/C++23, Python, Rust, Java, Go, and C with microsecond timing and verdicts (`[AC]`, `[WA]`, `[TLE]`, `[RTE]`, `[CE]`).
- ⚔️ **Stress Testing Suite**: Auto-generates `gen` and `brute` templates, runs high-speed automated stress tests, and imports failing cases with 1-key.
- 📦 **CP Algorithm & Snippet Library**: Built-in library containing Segment Trees, DSU, Fenwick, Dijkstra, Dinic Flow, Modular Int, Binpow, Sieve, LCA, and more.
- ⏱️ **Contest Mode & Timer**: Live countdown timer with status notifications and instant problem switcher.
- 🌐 **One-Click Online Judge Submission**: Submit solutions to Codeforces, AtCoder, and Kattis via the CPBuddy browser extension.
- 🖥️ **Standalone TUI Executable**: Run `./bin/cpbuddy-tui` to launch a dedicated, standalone CP IDE without modifying your personal Neovim config!

---

## 📦 Installation

### Using Lazy.nvim (LazyVim compatible)

Add to `~/.config/nvim/lua/plugins/cpbuddy.lua`:

```lua
return {
    "codewithayuu/cp-buddy",
    dir = "~/Projects/CPBuddy/packages/neovim-ext", -- or github repo
    config = function()
        require("cpbuddy").setup({
            default_language = "cpp",
            layout = {
                mode = "sublime",
            },
        })
    end,
}
```

### Using packer.nvim

```lua
use({
    "codewithayuu/cp-buddy",
    config = function()
        require("cpbuddy").setup()
    end,
})
```

### Standalone TUI Mode (No config required)

```bash
# Launch directly from terminal
./packages/neovim-ext/bin/cpbuddy-tui
```

---

## ⌨️ Default Keybindings

| Keybinding | Action | Description |
|:---|:---|:---|
| `<F5>` or `<leader>cr` | `:CPBuddyRun` | Run testcases for active problem |
| `<leader>ct` | `:CPBuddyDashboard` | Open interactive floating TUI dashboard |
| `<leader>cl` | `:CPBuddyLayout` | Toggle Sublime Text 4-Split layout |
| `<leader>ca` | `:CPBuddyAddTest` | Add a custom testcase |
| `<leader>cd` | `:CPBuddyDeleteProblem` | Delete current problem and clean tests |
| `<leader>cs` | `:CPBuddySubmit` | Submit solution to online judge |
| `<leader>cst` | `:CPBuddyStressTest` | Run automated stress testing |
| `<leader>cp` | `:CPBuddySnippets` | Open CP Algorithm Snippet Library |
| `<leader>cc` | `:CPBuddyContest` | Contest problem switcher |
| `<Ctrl-ScrollWheelUp>` / `<Ctrl-+>` | Zoom In | Increase font size / GUI scale |
| `<Ctrl-ScrollWheelDown>` / `<Ctrl-->` | Zoom Out | Decrease font size / GUI scale |
| `<Ctrl-0>` | Reset Zoom | Reset font size to default |

---

## ⚙️ Configuration Options

```lua
require("cpbuddy").setup({
    default_language = "cpp", -- "cpp", "python", "rust", "java", "go", "c"

    layout = {
        mode = "sublime", -- "sublime" or "floating"
        code_width_ratio = 0.70,
        input_height_ratio = 0.30,
        answer_height_ratio = 0.30,
        auto_sync_on_switch = true,
    },

    runner = {
        default_time_limit_ms = 2000,
        auto_save = true,
    },

    stress = {
        default_iterations = 100,
    },

    router = {
        auto_start = true,
        port = 27121,
    },
})
```

---

## 📝 License

AGPL-3.0 © [Ayush Jha](https://github.com/codewithayuu)
