local M = {}

M.router_job_id = nil
M.is_polling = false

function M.start()
    if M.router_job_id ~= nil then return end
    
    local plugin_dir = debug.getinfo(1, "S").source:sub(2):match("(.*[/\\])")
    local router_script = plugin_dir .. "../../../local-router/dist/router.cjs"
    
    local log_file = vim.fn.expand("~/.cpbuddy-neovim-router.log")
    M.router_job_id = vim.fn.jobstart({"node", router_script, "-p", "27121", "-l", log_file}, {
        on_stdout = function(_, data) end,
        on_stderr = function(_, data) end,
    })
    print("CPBuddy: Router started in background")
end

function M.poll()
    if M.is_polling then return end
    M.is_polling = true
    M.do_poll()
end

function M.do_poll()
    if not M.is_polling then return end
    
    -- Async curl to poll the router
    vim.fn.jobstart({"curl", "-s", "http://127.0.0.1:27121/api/poll"}, {
        stdout_buffered = true,
        on_stdout = function(_, data)
            if data and data[1] and data[1] ~= "" then
                local ok, parsed = pcall(vim.json.decode, data[1])
                if ok and parsed.status == "event" and parsed.event == "batchAvailable" then
                    vim.schedule(function()
                        require("cpbuddy.layout").create_problem_view(parsed.payload)
                    end)
                end
            end
        end,
        on_exit = function()
            -- Poll again after 1 second
            vim.defer_fn(M.do_poll, 1000)
        end
    })
end

return M
