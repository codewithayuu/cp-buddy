-- Monokai True Dark (Pure AMOLED) Colorscheme for CPBuddy
-- 100% 1-to-1 match with /home/ayu/Projects/sub-theme/monokai-true-dark/

local M = {}

function M.setup()
    vim.cmd("hi clear")
    if vim.fn.exists("syntax_on") == 1 then
        vim.cmd("syntax reset")
    end

    vim.o.termguicolors = true
    vim.g.colors_name = "monokai_true_dark"

    local c = {
        black       = "#000000",
        bg          = "#000000",
        fg          = "#cccccc",
        white       = "#cccccc",
        gray        = "#696d70",
        red         = "#e62a19",
        green       = "#2be98a",
        yellow      = "#e6db74",
        blue        = "#49e0fd",
        magenta     = "#f92672",
        purple      = "#ae81ff",
        orange      = "#fd971f",
        lime        = "#b0ec38",
        line_hl     = "#1c1c1c",
        selection   = "#3a3a3a",
        sel_active  = "#4a4a4a",
        dark_gray   = "#181818",
        border_gray = "#282828",
        popup_bg    = "#101010",
        popup_sel   = "#252525",
    }

    local hl = function(group, opts)
        vim.api.nvim_set_hl(0, group, opts)
    end

    -- Core Editor Highlighting (AMOLED Pure Black)
    hl("Normal", { fg = c.fg, bg = c.bg })
    hl("NormalNC", { fg = c.fg, bg = c.bg })
    hl("NormalFloat", { fg = c.fg, bg = c.popup_bg })
    hl("FloatBorder", { fg = c.gray, bg = c.popup_bg })
    hl("ColorColumn", { bg = c.line_hl })
    hl("Cursor", { fg = c.bg, bg = c.fg })
    hl("CursorLine", { bg = c.line_hl })
    hl("CursorColumn", { bg = c.line_hl })
    hl("CursorLineNr", { fg = c.yellow, bold = true, bg = c.bg })
    hl("LineNr", { fg = c.gray, bg = c.bg })
    hl("SignColumn", { bg = c.bg })
    hl("VertSplit", { fg = c.border_gray, bg = c.bg })
    hl("WinSeparator", { fg = c.border_gray, bg = c.bg })
    hl("EndOfBuffer", { fg = c.bg, bg = c.bg })

    -- Selections & Search
    hl("Visual", { bg = c.selection })
    hl("VisualNOS", { bg = c.selection })
    hl("Search", { fg = c.bg, bg = c.yellow })
    hl("IncSearch", { fg = c.bg, bg = c.orange })
    hl("CurSearch", { fg = c.bg, bg = c.magenta })

    -- Syntax Highlighting (Monokai True Dark Exact Palette)
    hl("Comment", { fg = c.gray, italic = true })
    hl("String", { fg = c.yellow })
    hl("Character", { fg = c.yellow })
    hl("Number", { fg = c.purple })
    hl("Boolean", { fg = c.purple, bold = true })
    hl("Float", { fg = c.purple })
    
    hl("Identifier", { fg = c.orange })
    hl("Function", { fg = c.lime, bold = true })
    hl("Statement", { fg = c.magenta, bold = true })
    hl("Conditional", { fg = c.magenta, bold = true })
    hl("Repeat", { fg = c.magenta, bold = true })
    hl("Label", { fg = c.magenta })
    hl("Operator", { fg = c.magenta })
    hl("Keyword", { fg = c.magenta, bold = true })
    hl("Exception", { fg = c.magenta, bold = true })

    hl("PreProc", { fg = c.magenta, bold = true })
    hl("Include", { fg = c.magenta, bold = true })
    hl("Define", { fg = c.magenta, bold = true })
    hl("Macro", { fg = c.magenta, bold = true })
    hl("PreCondit", { fg = c.magenta, bold = true })

    hl("Type", { fg = c.green, bold = true })
    hl("StorageClass", { fg = c.blue })
    hl("Structure", { fg = c.blue, bold = true })
    hl("Typedef", { fg = c.green })
    hl("Special", { fg = c.purple })
    hl("SpecialChar", { fg = c.red })
    hl("Tag", { fg = c.magenta })
    hl("Delimiter", { fg = c.fg })
    hl("SpecialComment", { fg = c.gray, italic = true })
    hl("Debug", { fg = c.orange })
    hl("Underlined", { underline = true })
    hl("Error", { fg = c.red, bold = true })
    hl("Todo", { fg = c.yellow, bold = true, italic = true })

    -- Treesitter & LSP Highlights
    hl("@comment", { fg = c.gray, italic = true })
    hl("@string", { fg = c.yellow })
    hl("@number", { fg = c.purple })
    hl("@boolean", { fg = c.purple, bold = true })
    hl("@type", { fg = c.green, bold = true })
    hl("@type.builtin", { fg = c.green, bold = true })
    hl("@type.definition", { fg = c.green, bold = true })
    hl("@function", { fg = c.lime, bold = true })
    hl("@function.call", { fg = c.lime })
    hl("@function.builtin", { fg = c.lime })
    hl("@function.macro", { fg = c.lime })
    hl("@method", { fg = c.lime })
    hl("@method.call", { fg = c.lime })
    hl("@constructor", { fg = c.green, bold = true })
    hl("@variable", { fg = c.fg })
    hl("@variable.builtin", { fg = c.red, italic = true })
    hl("@variable.parameter", { fg = c.orange, italic = true })
    hl("@variable.member", { fg = c.orange })
    hl("@property", { fg = c.orange })
    hl("@field", { fg = c.orange })
    hl("@keyword", { fg = c.magenta, bold = true })
    hl("@keyword.function", { fg = c.blue, italic = true })
    hl("@keyword.operator", { fg = c.magenta })
    hl("@keyword.return", { fg = c.magenta, bold = true })
    hl("@keyword.import", { fg = c.magenta, bold = true })
    hl("@operator", { fg = c.magenta })
    hl("@punctuation.bracket", { fg = c.fg })
    hl("@punctuation.delimiter", { fg = c.fg })
    hl("@punctuation.special", { fg = c.magenta })
    hl("@constant", { fg = c.purple })
    hl("@constant.builtin", { fg = c.purple, bold = true })
    hl("@constant.macro", { fg = c.purple })
    hl("@namespace", { fg = c.blue })
    hl("@include", { fg = c.magenta, bold = true })

    -- Sublime Text Completion Menu (Pmenu)
    hl("Pmenu", { fg = c.fg, bg = c.popup_bg })
    hl("PmenuSel", { fg = "#ffffff", bg = c.magenta, bold = true })
    hl("PmenuSbar", { bg = c.dark_gray })
    hl("PmenuThumb", { bg = c.gray })
    hl("PmenuKind", { fg = c.lime, bg = c.popup_bg })
    hl("PmenuKindSel", { fg = "#ffffff", bg = c.magenta, bold = true })
    hl("PmenuExtra", { fg = c.gray, bg = c.popup_bg })
    hl("PmenuExtraSel", { fg = "#ffffff", bg = c.magenta })

    -- WinBar (Sublime Minimal Tab / Filename Bar)
    hl("WinBar", { fg = c.gray, bg = c.bg })
    hl("WinBarNC", { fg = c.dark_gray, bg = c.bg })

    -- StatusLine
    hl("StatusLine", { fg = c.fg, bg = c.dark_gray })
    hl("StatusLineNC", { fg = c.gray, bg = c.bg })

    -- Diffs & Git
    hl("DiffAdd", { fg = c.green, bg = "#0d2818" })
    hl("DiffChange", { fg = c.yellow, bg = "#28240d" })
    hl("DiffDelete", { fg = c.magenta, bg = "#2d0a14" })
    hl("DiffText", { fg = c.blue, bg = "#0d202d", bold = true })

    -- Diagnostics & Instant Error Highlighting
    hl("DiagnosticError", { fg = c.magenta, bold = true })
    hl("DiagnosticWarn", { fg = c.orange, bold = true })
    hl("DiagnosticInfo", { fg = c.blue })
    hl("DiagnosticHint", { fg = c.lime })
    hl("DiagnosticVirtualTextError", { fg = c.magenta, bg = "#250810", italic = true })
    hl("DiagnosticVirtualTextWarn", { fg = c.orange, bg = "#251808", italic = true })
    hl("DiagnosticVirtualTextInfo", { fg = c.blue, bg = "#081b25", italic = true })
    hl("DiagnosticVirtualTextHint", { fg = c.lime, bg = "#0d2510", italic = true })
    hl("DiagnosticUnderlineError", { undercurl = true, sp = c.magenta })
    hl("DiagnosticUnderlineWarn", { undercurl = true, sp = c.orange })
    hl("DiagnosticUnderlineInfo", { undercurl = true, sp = c.blue })
    hl("DiagnosticUnderlineHint", { undercurl = true, sp = c.lime })

    -- CPBuddy Specific Highlight Groups
    hl("CPBuddySuccess", { fg = c.green, bold = true })
    hl("CPBuddyFail", { fg = c.magenta, bold = true })
    hl("CPBuddyHeader", { fg = c.yellow, bold = true })
    hl("CPBuddyMuted", { fg = c.gray })
    hl("CPBuddyActiveTab", { fg = "#ffffff", bg = "#252830", bold = true })
    hl("CPBuddyInactiveTab", { fg = "#7e8494", bg = "#14161a" })
    hl("CPBuddyTabClose", { fg = "#ff6188", bg = "#252830", bold = true })
    hl("CPBuddyTabCloseInactive", { fg = "#5c6370", bg = "#14161a" })
    hl("CPBuddyNotificationSuccess", { fg = c.green, bg = c.dark_gray, bold = true })
    hl("CPBuddyNotificationError", { fg = c.magenta, bg = c.dark_gray, bold = true })
    hl("CPBuddyNotificationWarn", { fg = c.orange, bg = c.dark_gray, bold = true })
    hl("CPBuddyNotificationClose", { fg = c.magenta, bg = c.dark_gray, bold = true })
end

return M
