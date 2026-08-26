-- In-Status-Bar Notification Manager for CPBuddy
-- Features:
-- 1. Shows clean notification directly inside the status bar
-- 2. Interactive [✕] button to dismiss immediately on click
-- 3. Auto-hides and restores normal status bar after 3 seconds
-- 4. Cleans the cmdline area and ensures zero gap below status bar (cmdheight=0)

local M = {}

M.current_notification = nil
M.timer = nil

function M.dismiss()
    if M.timer then
        pcall(function()
            if type(M.timer.stop) == "function" then M.timer:stop() end
            if type(M.timer.close) == "function" then M.timer:close() end
        end)
        M.timer = nil
    end

    M.current_notification = nil

    -- Trigger statusline redraw
    pcall(vim.cmd, "redrawstatus")
    pcall(vim.cmd, [[echo ""]])
end

function _G.CPBuddyDismissNotification(minwid, clicks, button, modifier)
    M.dismiss()
end

function M.notify(msg, level, opts)
    opts = opts or {}
    level = level or vim.log.levels.INFO
    local timeout = opts.timeout or 3000 -- 3 seconds auto-hide

    -- Cancel previous timer
    if M.timer then
        pcall(function()
            if type(M.timer.stop) == "function" then M.timer:stop() end
            if type(M.timer.close) == "function" then M.timer:close() end
        end)
        M.timer = nil
    end

    -- Flatten message to single line for status bar
    local clean_msg = tostring(msg):gsub("\n", " "):gsub("%s+", " ")
    if #clean_msg > 60 then
        clean_msg = clean_msg:sub(1, 57) .. "..."
    end

    local icon = "🏆"
    local hl_group = "CPBuddyNotificationSuccess"
    if level == vim.log.levels.ERROR then
        icon = "❌"
        hl_group = "CPBuddyNotificationError"
    elseif level == vim.log.levels.WARN then
        icon = "⚠️"
        hl_group = "CPBuddyNotificationWarn"
    elseif level == vim.log.levels.INFO then
        icon = "🏆"
        hl_group = "CPBuddyNotificationSuccess"
    end

    M.current_notification = {
        msg = clean_msg,
        icon = icon,
        hl_group = hl_group,
        level = level,
    }

    -- Auto-dismiss timer after 3 seconds (3000ms)
    M.timer = vim.defer_fn(function()
        M.dismiss()
    end, timeout)

    -- Force statusline redraw immediately and clear cmdline
    pcall(vim.cmd, "redrawstatus")
    pcall(vim.cmd, [[echo ""]])
end

function M.get_status_notification()
    if not M.current_notification then
        return ""
    end

    local n = M.current_notification
    -- Clickable ✕ to dismiss notification: %@v:lua.CPBuddyDismissNotification@ ✕ %X
    return string.format(
        "%%#%s# │ %s %s %%#CPBuddyNotificationClose#%%@v:lua.CPBuddyDismissNotification@ ✕ %%X%%*",
        n.hl_group, n.icon, n.msg
    )
end

return M
