local M = {}
local utils = require("cpbuddy.utils")
local config = require("cpbuddy.config")

function M.submit_current()
    local info = utils.get_problem_info()
    if not info or not info.filepath then
        utils.notify("No active problem detected to submit.", vim.log.levels.WARN)
        return
    end

    -- Save file first
    vim.cmd("silent! wa")

    local code_content = utils.read_file(info.filepath)
    if not code_content or code_content == "" then
        utils.notify("Source code file is empty.", vim.log.levels.WARN)
        return
    end

    -- 1. Extract problem URL
    local problem_url = ""
    local bin_meta = utils.read_bin_metadata(info.bin_file)
    if bin_meta and bin_meta.url and bin_meta.url ~= "" then
        problem_url = bin_meta.url
    end

    if problem_url == "" then
        -- Try reading from source comment header
        for _, line in ipairs(vim.split(code_content, "\n")) do
            local url_match = line:match("Problem URL:%s*(https?://%S+)") or line:match("URL:%s*(https?://%S+)")
            if url_match then
                problem_url = url_match
                break
            end
        end
    end

    if problem_url == "" then
        utils.notify("Could not find Problem URL in metadata or file header.", vim.log.levels.ERROR)
        return
    end

    local router_cfg = config.get("router")
    local submit_endpoint = string.format("http://%s:%d/api/submit", router_cfg.host or "127.0.0.1", router_cfg.port or 27121)

    local payload = {
        url = problem_url,
        sourceCode = code_content,
    }
    local payload_json = vim.json.encode(payload)

    utils.notify("Submitting solution to: " .. problem_url, vim.log.levels.INFO)

    -- Async POST via curl
    local curl_cmd = {
        "curl", "-s", "-X", "POST",
        "-H", "Content-Type: application/json",
        "-d", payload_json,
        submit_endpoint
    }

    vim.fn.jobstart(curl_cmd, {
        stdout_buffered = true,
        on_stdout = function(_, data)
            if data and #data > 0 and data[1] ~= "" then
                local ok, res = pcall(vim.json.decode, table.concat(data, ""))
                if ok and res.status == "ok" then
                    utils.notify("🚀 Submitted to browser extension successfully! Check your browser.", vim.log.levels.INFO)
                else
                    local msg = (ok and res.message) or "Browser extension not connected or submission rejected."
                    utils.notify("Submission notice: " .. msg, vim.log.levels.WARN)
                end
            end
        end,
        on_stderr = function(_, err)
            if err and #err > 0 and err[1] ~= "" then
                utils.notify("Submission error: " .. table.concat(err, " "), vim.log.levels.ERROR)
            end
        end,
    })
end

return M
