local M = {}
local utils = require("cpbuddy.utils")
local layout = require("cpbuddy.layout")

M.timer_handle = nil
M.total_seconds = 0
M.remaining_seconds = 0
M.is_active = false

function M.start(duration_min)
    duration_min = duration_min or 120
    M.total_seconds = duration_min * 60
    M.remaining_seconds = M.total_seconds
    M.is_active = true

    if M.timer_handle then
        pcall(function() M.timer_handle:stop(); M.timer_handle:close() end)
    end

    M.timer_handle = vim.loop.new_timer()
    M.timer_handle:start(1000, 1000, vim.schedule_wrap(function()
        if not M.is_active then return end
        M.remaining_seconds = M.remaining_seconds - 1

        if M.remaining_seconds <= 0 then
            M.stop()
            utils.notify("🚨 CONTEST TIME IS UP! Time to wrap up submissions.", vim.log.levels.WARN)
        elseif M.remaining_seconds == 30 * 60 then
            utils.notify("⏱️ 30 minutes remaining in contest!", vim.log.levels.WARN)
        elseif M.remaining_seconds == 10 * 60 then
            utils.notify("⏱️ 10 minutes remaining in contest!", vim.log.levels.WARN)
        elseif M.remaining_seconds == 5 * 60 then
            utils.notify("⏱️ 5 minutes remaining in contest!", vim.log.levels.ERROR)
        end
    end))

    utils.notify(string.format("⏱️ Contest Timer started: %d minutes", duration_min), vim.log.levels.INFO)
end

function M.stop()
    M.is_active = false
    if M.timer_handle then
        pcall(function() M.timer_handle:stop(); M.timer_handle:close() end)
        M.timer_handle = nil
    end
end

function M.toggle()
    if M.is_active then
        M.stop()
        utils.notify("Contest timer paused.", vim.log.levels.INFO)
    else
        if M.remaining_seconds > 0 then
            M.is_active = true
            utils.notify("Contest timer resumed.", vim.log.levels.INFO)
        else
            M.start(120)
        end
    end
end

function M.get_status()
    if not M.is_active and M.remaining_seconds == 0 then
        return ""
    end
    local h = math.floor(M.remaining_seconds / 3600)
    local m = math.floor((M.remaining_seconds % 3600) / 60)
    local s = M.remaining_seconds % 60
    return string.format("⏱️ %02d:%02d:%02d", h, m, s)
end

function M.open_problem_switcher()
    local workspace_root = utils.get_workspace_root()
    local cur_info = utils.get_problem_info()
    local platform = cur_info and cur_info.platform or "Codeforces"

    local platform_dir = workspace_root .. "/" .. platform
    if vim.fn.isdirectory(platform_dir) == 0 then
        utils.notify("No problem folder found for platform: " .. platform, vim.log.levels.WARN)
        return
    end

    local files = vim.fn.glob(platform_dir .. "/*.*", false, true)
    local problems = {}
    for _, f in ipairs(files) do
        local ext = vim.fn.fnamemodify(f, ":e")
        if ext == "cpp" or ext == "py" or ext == "rs" or ext == "java" or ext == "c" then
            local fname = vim.fn.fnamemodify(f, ":t:r")
            table.insert(problems, { name = fname, path = f })
        end
    end

    if #problems == 0 then
        utils.notify("No problem source files found in " .. platform_dir, vim.log.levels.WARN)
        return
    end

    local items = {}
    for _, p in ipairs(problems) do
        table.insert(items, string.format("🏆 %s (%s)", p.name, vim.fn.fnamemodify(p.path, ":t")))
    end

    vim.ui.select(items, {
        prompt = "🎯 Switch Contest Problem (" .. platform .. "):",
    }, function(choice, idx)
        if choice and idx and problems[idx] then
            local selected = problems[idx]
            layout.setup_layout(selected.path, 1)
            utils.notify("Switched to problem: " .. selected.name, vim.log.levels.INFO)
        end
    end)
end

return M
