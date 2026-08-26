local M = {}
local config = require("cpbuddy.config")
local utils = require("cpbuddy.utils")

M.router_job_id = nil
M.is_polling = false
M.poll_job_id = nil

function M.find_router_script()
    local this_dir = debug.getinfo(1, "S").source:sub(2):match("(.*[/\\])")
    local candidates = {
        this_dir .. "../../../local-router/dist/router.cjs",
        this_dir .. "../../local-router/dist/router.cjs",
        this_dir .. "../router/router.cjs",
        vim.fn.expand("~/.local/share/nvim/lazy/cpbuddy.nvim/packages/local-router/dist/router.cjs"),
    }

    for _, path in ipairs(candidates) do
        local full_path = vim.fn.fnamemodify(path, ":p")
        if vim.fn.filereadable(full_path) == 1 then
            return full_path
        end
    end
    return nil
end

function M.start()
    local cfg = config.get("router")
    if not cfg.auto_start then return end

    if M.router_job_id ~= nil then return end

    local router_script = M.find_router_script()
    if not router_script then
        -- If router script is not found, we can still poll an existing router on port 27121
        return
    end

    local log_file = vim.fn.expand("~/.cpbuddy-neovim-router.log")
    local port_str = tostring(cfg.port or 27121)

    M.router_job_id = vim.fn.jobstart({ "node", router_script, "-p", port_str, "-l", log_file }, {
        detach = false,
        on_exit = function()
            M.router_job_id = nil
        end,
    })

    -- Register clean exit
    vim.api.nvim_create_autocmd("VimLeavePre", {
        callback = function()
            M.stop()
        end,
    })
end

function M.stop()
    M.is_polling = false
    if M.poll_job_id then
        pcall(vim.fn.jobstop, M.poll_job_id)
        M.poll_job_id = nil
    end
    if M.router_job_id then
        pcall(vim.fn.jobstop, M.router_job_id)
        M.router_job_id = nil
    end
end

function M.poll()
    if M.is_polling then return end
    M.is_polling = true
    M.do_poll()
end

function M.do_poll()
    if not M.is_polling then return end

    local cfg = config.get("router")
    local poll_endpoint = string.format("http://%s:%d/api/poll", cfg.host or "127.0.0.1", cfg.port or 27121)

    M.poll_job_id = vim.fn.jobstart({ "curl", "-s", "--max-time", "35", poll_endpoint }, {
        stdout_buffered = true,
        on_stdout = function(_, data)
            if data and #data > 0 then
                local raw = table.concat(data, "")
                if raw ~= "" then
                    local ok, parsed = pcall(vim.json.decode, raw)
                    if ok and parsed and parsed.status == "event" then
                        if parsed.event == "batchAvailable" then
                            vim.schedule(function()
                                require("cpbuddy.layout").create_problem_view(parsed.payload)
                            end)
                        elseif parsed.event == "readingBatch" then
                            vim.schedule(function()
                                local p = parsed.payload or {}
                                utils.notify(string.format("Parsing batch (%d/%d problems)...", p.count or 0, p.size or 0), vim.log.levels.INFO)
                            end)
                        end
                    end
                end
            end
        end,
        on_exit = function()
            M.poll_job_id = nil
            if M.is_polling then
                vim.defer_fn(M.do_poll, config.get("router").poll_interval or 1000)
            end
        end,
    })
end

function M.status()
    local cfg = config.get("router")
    local is_daemon_running = M.router_job_id ~= nil
    local is_poll_active = M.is_polling
    utils.notify(string.format("Router Status:\n• Port: %d\n• Daemon: %s\n• Polling: %s",
        cfg.port or 27121,
        is_daemon_running and "Running" or "External / Inactive",
        is_poll_active and "Active" or "Stopped"
    ), vim.log.levels.INFO)
end

return M
