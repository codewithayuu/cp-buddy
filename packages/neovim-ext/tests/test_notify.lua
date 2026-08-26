local cpbuddy = require("cpbuddy")
local notify = require("cpbuddy.notify")
local utils = require("cpbuddy.utils")

print("[TEST] 1. Initializing CPBuddy setup...")
cpbuddy.setup()

print("[TEST] 2. Triggering in-status-bar notification...")
utils.notify("Parsed 'A. Min Or Sum' (1 tests) from Codeforces", vim.log.levels.INFO, "Codeforces")

local notif_str = notify.get_status_notification()
assert(notif_str ~= "", "Notification statusline string should not be empty")
assert(notif_str:find("Min Or Sum"), "Notification should contain problem title")
assert(notif_str:find("CPBuddyDismissNotification"), "Notification should contain dismiss click handler")
print("[PASS] In-status-bar notification string formatted correctly: " .. notif_str)

local statusline = _G.CPBuddyStatusline()
print("[DEBUG] Rendered Statusline:")
print("  " .. statusline)
assert(statusline:find("Min Or Sum"), "Statusline must include active notification")

print("[TEST] 3. Testing manual dismissal via [✕]...")
_G.CPBuddyDismissNotification()
assert(notify.get_status_notification() == "", "Notification should be cleared after dismiss")
local statusline_after = _G.CPBuddyStatusline()
assert(not statusline_after:find("Min Or Sum"), "Statusline should no longer contain notification")
print("[PASS] Notification dismissed successfully, statusline restored.")

print("[TEST] 4. Testing 3-second auto-hide timer...")
utils.notify("Auto-dismiss status test", vim.log.levels.INFO)
assert(notify.get_status_notification() ~= "", "Notification should be active before timeout")

-- Wait for timeout
vim.wait(3200, function()
    return notify.get_status_notification() == ""
end, 100)

assert(notify.get_status_notification() == "", "Notification should auto-dismiss after timeout")
print("[PASS] Status bar notification auto-dismissed after 3 seconds.")

print("\n✨ ALL IN-STATUS-BAR NOTIFICATION TESTS PASSED! ✨")
