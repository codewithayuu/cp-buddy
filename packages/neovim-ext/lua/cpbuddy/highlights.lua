local M = {}

function M.setup()
    local highlights = {
        -- Verdict status highlights
        CPBuddyPassed = { fg = "#50fa7b", bold = true },
        CPBuddyFailed = { fg = "#ff5555", bold = true },
        CPBuddyTLE = { fg = "#ffb86c", bold = true },
        CPBuddyRTE = { fg = "#bd93f9", bold = true },
        CPBuddyCE = { fg = "#ff5555", underline = true, bold = true },
        CPBuddyRunning = { fg = "#8be9fd", italic = true },

        -- Badges / Status Chips
        CPBuddyBadgePassed = { fg = "#282a36", bg = "#50fa7b", bold = true },
        CPBuddyBadgeFailed = { fg = "#ffffff", bg = "#ff5555", bold = true },
        CPBuddyBadgeTLE = { fg = "#282a36", bg = "#ffb86c", bold = true },
        CPBuddyBadgeRTE = { fg = "#ffffff", bg = "#bd93f9", bold = true },
        CPBuddyBadgeRunning = { fg = "#282a36", bg = "#8be9fd", bold = true },

        -- Diff Colors
        CPBuddyDiffAdd = { fg = "#50fa7b", bg = "#1e3a29" },
        CPBuddyDiffDelete = { fg = "#ff5555", bg = "#3d1e24" },
        CPBuddyDiffChange = { fg = "#ffb86c", bg = "#3d351e" },

        -- UI Elements
        CPBuddyTitle = { fg = "#bd93f9", bold = true },
        CPBuddySubtitle = { fg = "#8be9fd", bold = true },
        CPBuddyHeader = { fg = "#f1fa8c", bold = true },
        CPBuddyBorder = { fg = "#6272a4" },
        CPBuddyMuted = { fg = "#6272a4" },
        CPBuddyActiveTab = { fg = "#f8f8f2", bg = "#44475a", bold = true },
        CPBuddyInactiveTab = { fg = "#6272a4", bg = "#282a36" },
        CPBuddyKey = { fg = "#ff79c6", bold = true },
        CPBuddyValue = { fg = "#f8f8f2" },
        CPBuddyTime = { fg = "#8be9fd" },
        CPBuddyMemory = { fg = "#f1fa8c" },
        CPBuddyDivider = { fg = "#44475a" },
    }

    for name, hl in pairs(highlights) do
        hl.default = true
        vim.api.nvim_set_hl(0, name, hl)
    end
end

return M
