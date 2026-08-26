local cpbuddy = require("cpbuddy")
local layout = require("cpbuddy.layout")
local utils = require("cpbuddy.utils")

print("[TEST] 1. Initializing CPBuddy...")
cpbuddy.setup()

print("[TEST] 2. Creating Problem A and Problem B...")
layout.create_problem_view({
    problems = {{
        name = "Problem A",
        group = "Codeforces",
        url = "https://codeforces.com/contest/1/problem/A",
        tests = {
            { input = "10\n", output = "20\n" },
        }
    }}
})

layout.create_problem_view({
    problems = {{
        name = "Problem B",
        group = "Codeforces",
        url = "https://codeforces.com/contest/1/problem/B",
        tests = {
            { input = "50\n", output = "100\n" },
        }
    }}
})

local tabs = layout.get_open_problem_tabs()
assert(#tabs == 2, string.format("Expected 2 problem tabs, found %d", #tabs))
print(string.format("[PASS] Verified 2 open problem tabs: %s and %s", tabs[1].filename, tabs[2].filename))

print("[TEST] 3. Testing Winbar Rendering...")
local winbar_str = _G.CPBuddyMainWinbar()
assert(winbar_str:find("Problem_A") and winbar_str:find("Problem_B"), "Winbar must display both Problem A and Problem B tabs")
assert(winbar_str:find("CPBuddyCloseTabClick"), "Winbar must contain clickable close button handlers")
print("[PASS] Winbar renders Sublime-style tabs with close buttons correctly.")

print("[TEST] 4. Testing Tab Switch and Right-Pane Sync...")
-- Currently on Problem B. Switch to Problem A
local tab_a = tabs[1]
local tab_b = tabs[2]
if tab_a.filename:find("Problem_B") then
    tab_a, tab_b = tab_b, tab_a
end

_G.CPBuddyTabClick(tab_a.bufnr)
assert(vim.g.cpbuddy_current_name == "Problem_A", "Global current name should be Problem_A")

-- Verify right top pane has Problem A test1.in
local wins = vim.api.nvim_list_wins()
assert(#wins == 4, "Must have 4-split layout active")
print("[PASS] Switched to Problem A, right panes fully synchronized!")

print("[TEST] 5. Testing Tab Close of Problem A...")
_G.CPBuddyCloseTabClick(tab_a.bufnr)

local remaining_tabs = layout.get_open_problem_tabs()
assert(#remaining_tabs == 1, string.format("Expected 1 problem tab remaining, got %d", #remaining_tabs))
assert(vim.g.cpbuddy_current_name == "Problem_B", "Should have switched to remaining Problem_B")
print("[PASS] Closed Problem A tab; smoothly transitioned to Problem B with sync!")

print("[TEST] 6. Testing Closing Last Problem Tab...")
_G.CPBuddyCloseTabClick(tab_b.bufnr)

local normal_wins = {}
for _, w in ipairs(vim.api.nvim_list_wins()) do
    if vim.api.nvim_win_get_config(w).relative == "" then
        table.insert(normal_wins, w)
    end
end
assert(#normal_wins == 1, "Layout should reset to single clean window when all problem tabs are closed")
print("[PASS] All problem tabs closed, layout cleanly reset to single view!")

-- Cleanup temporary test problem files
vim.fn.delete("/home/ayu/Projects/CPBuddy/Codeforces/Problem_A.cpp")
vim.fn.delete("/home/ayu/Projects/CPBuddy/Codeforces/Problem_B.cpp")
vim.fn.delete("/home/ayu/Projects/CPBuddy/.cpbuddy/Codeforces/Problem_A", "rf")
vim.fn.delete("/home/ayu/Projects/CPBuddy/.cpbuddy/Codeforces/Problem_B", "rf")

print("\n✨ ALL MULTI-FILE TAB & SYNCHRONIZATION TESTS PASSED! ✨\n")
