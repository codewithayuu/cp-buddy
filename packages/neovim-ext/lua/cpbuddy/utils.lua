local M = {}

function M.get_workspace_root()
    local ok, config = pcall(require, "cpbuddy.config")
    if ok and config then
        local cfg_root = config.get("workspace_root")
        if cfg_root and cfg_root ~= "" then
            local expanded = vim.fn.expand(cfg_root)
            if vim.fn.isdirectory(expanded) == 0 then
                vim.fn.mkdir(expanded, "p")
            end
            return expanded
        end
    end
    return vim.fn.getcwd()
end

function M.sanitize_filename(name)
    if not name then return "problem" end
    local clean = name:gsub("[^%w]+", "_"):gsub("^_+", ""):gsub("_+$", "")
    if clean == "" then clean = "problem" end
    return clean
end

function M.get_platform_name(group, url)
    group = group or ""
    url = url or ""
    local group_lower = group:lower()
    local url_lower = url:lower()

    if group_lower:find("codeforces") or url_lower:find("codeforces.com") then
        return "Codeforces"
    elseif group_lower:find("leetcode") or url_lower:find("leetcode.com") then
        return "LeetCode"
    elseif group_lower:find("atcoder") or url_lower:find("atcoder.jp") then
        return "AtCoder"
    elseif group_lower:find("codechef") or url_lower:find("codechef.com") then
        return "CodeChef"
    elseif group_lower:find("cses") or url_lower:find("cses.fi") then
        return "CSES"
    elseif group_lower:find("kattis") or url_lower:find("kattis.com") then
        return "Kattis"
    elseif group_lower:find("hackerrank") or url_lower:find("hackerrank.com") then
        return "HackerRank"
    elseif group_lower:find("spoj") or url_lower:find("spoj.com") then
        return "SPOJ"
    elseif group_lower:find("usaco") or url_lower:find("usaco.org") then
        return "USACO"
    elseif group_lower:find("toph") or url_lower:find("toph.co") then
        return "Toph"
    elseif group_lower:find("yukicoder") or url_lower:find("yukicoder.me") then
        return "Yukicoder"
    end

    if group ~= "" then
        local first = vim.split(group, " - ")[1]
        first = M.sanitize_filename(first)
        if first ~= "" and first ~= "problem" then
            return first
        end
    end

    return "Other"
end

function M.trim(s)
    if not s then return "" end
    return (s:gsub("^%s*(.-)%s*$", "%1"))
end

function M.read_file(path)
    if not path or vim.fn.filereadable(path) == 0 then return nil end
    local lines = vim.fn.readfile(path)
    return table.concat(lines, "\n")
end

function M.read_file_lines(path)
    if not path or vim.fn.filereadable(path) == 0 then return {} end
    return vim.fn.readfile(path)
end

function M.write_file(path, content)
    local dir = vim.fn.fnamemodify(path, ":h")
    if vim.fn.isdirectory(dir) == 0 then
        vim.fn.mkdir(dir, "p")
    end
    local lines = type(content) == "table" and content or vim.split(tostring(content), "\n")
    return vim.fn.writefile(lines, path) == 0
end

function M.delete_file(path)
    if vim.fn.filereadable(path) == 1 then
        os.remove(path)
    end
end

function M.delete_dir_recursive(dir)
    if vim.fn.isdirectory(dir) == 1 then
        vim.fn.delete(dir, "rf")
    end
end

function M.detect_language(filepath)
    if not filepath then return "cpp" end
    local ext = vim.fn.fnamemodify(filepath, ":e"):lower()
    local map = {
        cpp = "cpp",
        cc = "cpp",
        cxx = "cpp",
        c = "c",
        py = "python",
        rs = "rust",
        java = "java",
        go = "go",
    }
    return map[ext] or "cpp"
end

function M.get_problem_info(filepath)
    filepath = filepath or vim.api.nvim_buf_get_name(0)
    if not filepath or filepath == "" then return nil end

    local workspace_root = M.get_workspace_root()
    local ext = vim.fn.fnamemodify(filepath, ":e"):lower()
    local filename = vim.fn.fnamemodify(filepath, ":t")
    local filename_no_ext = vim.fn.fnamemodify(filepath, ":t:r")
    local parent_dir = vim.fn.fnamemodify(filepath, ":h")
    local platform = vim.fn.fnamemodify(parent_dir, ":t")

    -- Check if inside .cpbuddy directory
    local is_in_cpbuddy = filepath:find("/%.cpbuddy/") ~= nil
    local safe_name = filename_no_ext

    if is_in_cpbuddy then
        -- Path like /workspace/.cpbuddy/Codeforces/1920A/test1.in
        local parts = vim.split(filepath, "/")
        for i = #parts, 1, -1 do
            if parts[i] == ".cpbuddy" and i + 2 <= #parts then
                platform = parts[i + 1]
                safe_name = parts[i + 2]
                break
            end
        end
    end

    local lang = M.detect_language(filepath)
    local cpbuddy_dir = workspace_root .. "/.cpbuddy/" .. platform .. "/" .. safe_name
    local bin_file = cpbuddy_dir .. "/" .. safe_name .. ".bin"

    -- Find source code file if we are in .cpbuddy dir
    local src_file = filepath
    if is_in_cpbuddy then
        local candidate_cpp = workspace_root .. "/" .. platform .. "/" .. safe_name .. ".cpp"
        local candidate_py = workspace_root .. "/" .. platform .. "/" .. safe_name .. ".py"
        if vim.fn.filereadable(candidate_cpp) == 1 then
            src_file = candidate_cpp
            lang = "cpp"
        elseif vim.fn.filereadable(candidate_py) == 1 then
            src_file = candidate_py
            lang = "python"
        else
            src_file = candidate_cpp
        end
    end

    -- Discover testcases
    local testcases = {}
    if vim.fn.isdirectory(cpbuddy_dir) == 1 then
        local idx = 1
        while true do
            local in_file = cpbuddy_dir .. "/test" .. idx .. ".in"
            local ans_file = cpbuddy_dir .. "/test" .. idx .. ".ans"
            local out_file = cpbuddy_dir .. "/test" .. idx .. ".out"
            if vim.fn.filereadable(in_file) == 1 or vim.fn.filereadable(ans_file) == 1 then
                table.insert(testcases, {
                    index = idx,
                    in_file = in_file,
                    ans_file = ans_file,
                    out_file = out_file,
                    has_input = vim.fn.filereadable(in_file) == 1,
                    has_answer = vim.fn.filereadable(ans_file) == 1,
                })
                idx = idx + 1
            else
                break
            end
        end
    end

    return {
        filepath = src_file,
        workspace_root = workspace_root,
        platform = platform,
        safe_name = safe_name,
        name = safe_name:gsub("_", " "),
        language = lang,
        cpbuddy_dir = cpbuddy_dir,
        bin_file = bin_file,
        testcases = testcases,
        test_count = #testcases,
    }
end

function M.read_bin_metadata(bin_file)
    if not bin_file or vim.fn.filereadable(bin_file) == 0 then return nil end
    local py_cmd = string.format("python3 -c 'import gzip, json, sys; sys.stdout.write(gzip.decompress(open(\"%s\", \"rb\").read()).decode(\"utf-8\"))'", bin_file)
    local out = vim.fn.system(py_cmd)
    if vim.v.shell_error == 0 and out and out ~= "" then
        local ok, parsed = pcall(vim.json.decode, out)
        if ok then return parsed end
    end
    return nil
end

function M.write_bin_metadata(bin_file, payload)
    local json_str = vim.json.encode(payload)
    local temp_json = vim.fn.tempname() .. ".json"
    M.write_file(temp_json, json_str)
    local py_cmd = string.format("python3 -c 'import gzip, sys; open(\"%s\", \"wb\").write(gzip.compress(open(\"%s\", \"rb\").read()))'", bin_file, temp_json)
    vim.fn.system(py_cmd)
    M.delete_file(temp_json)
end

function M.diff_lines(expected_str, actual_str)
    expected_str = M.trim(expected_str or "")
    actual_str = M.trim(actual_str or "")

    local exp_lines = vim.split(expected_str, "\n")
    local act_lines = vim.split(actual_str, "\n")
    local diff_results = {}

    local max_len = math.max(#exp_lines, #act_lines)
    for i = 1, max_len do
        local e = exp_lines[i]
        local a = act_lines[i]
        if e == a then
            table.insert(diff_results, { type = "same", line = i, expected = e or "", actual = a or "" })
        else
            table.insert(diff_results, { type = "diff", line = i, expected = e or "<EOF>", actual = a or "<EOF>" })
        end
    end
    return diff_results
end

local _ratings_cache = {}

function M.get_problem_difficulty(bufnr)
    bufnr = (not bufnr or bufnr == 0) and vim.api.nvim_get_current_buf() or bufnr
    if not vim.api.nvim_buf_is_valid(bufnr) then return "" end

    local cached = vim.b[bufnr].cpbuddy_rating
    if cached and cached ~= "" then return cached end

    local filename = vim.api.nvim_buf_get_name(bufnr)
    if filename == "" then return "" end

    if _ratings_cache[filename] then
        vim.b[bufnr].cpbuddy_rating = _ratings_cache[filename]
        return _ratings_cache[filename]
    end

    -- 1. Check buffer comment lines (first 30 lines)
    local lines = vim.api.nvim_buf_get_lines(bufnr, 0, 30, false)
    for _, line in ipairs(lines) do
        local r = line:match("Rating:%s*([%w%d%+%-]+)")
        if r then
            local res = "⭐ Rating: " .. r
            _ratings_cache[filename] = res
            vim.b[bufnr].cpbuddy_rating = res
            return res
        end
        local d = line:match("Difficulty:%s*([%w%d%+%-]+)")
        if d then
            local res = "⭐ Difficulty: " .. d
            _ratings_cache[filename] = res
            vim.b[bufnr].cpbuddy_rating = res
            return res
        end
    end

    -- 2. Check problem info / .bin metadata
    local info = M.get_problem_info(filename)
    if not info then return "" end

    local meta = M.read_bin_metadata(info.bin_file)
    if meta then
        if meta.rating and meta.rating ~= "" then
            local res = "⭐ Rating: " .. tostring(meta.rating)
            _ratings_cache[filename] = res
            vim.b[bufnr].cpbuddy_rating = res
            return res
        elseif meta.difficulty and meta.difficulty ~= "" then
            local res = "⭐ Difficulty: " .. tostring(meta.difficulty)
            _ratings_cache[filename] = res
            vim.b[bufnr].cpbuddy_rating = res
            return res
        end
    end

    -- 3. Extract URL to identify problem (e.g. Codeforces / AtCoder)
    local prob_url = meta and meta.url or ""
    if prob_url == "" then
        for _, line in ipairs(lines) do
            local u = line:match("Problem URL:%s*(https?://[^\r\n%s]+)")
            if u then prob_url = u; break end
        end
    end

    -- If Codeforces URL
    local cf_contest, cf_index = prob_url:match("codeforces%.com/problemset/problem/(%d+)/([A-Za-z0-9]+)")
    if not cf_contest then
        cf_contest, cf_index = prob_url:match("codeforces%.com/contest/(%d+)/problem/([A-Za-z0-9]+)")
    end

    if cf_contest and cf_index then
        local cache_file = vim.fn.expand("~/.cache/cpbuddy_cfratings.json")
        if vim.fn.filereadable(cache_file) == 1 then
            local ok, raw = pcall(vim.fn.readfile, cache_file)
            if ok and raw then
                local ok_j, cache_data = pcall(vim.fn.json_decode, raw)
                local key = cf_contest .. "_" .. cf_index:upper()
                if ok_j and cache_data and cache_data[key] then
                    local res = "⭐ Rating: " .. tostring(cache_data[key])
                    _ratings_cache[filename] = res
                    vim.b[bufnr].cpbuddy_rating = res
                    return res
                end
            end
        end

        local py_script = [[
import urllib.request, json, os
try:
    req = urllib.request.urlopen("https://codeforces.com/api/problemset.problems", timeout=4)
    data = json.loads(req.read().decode())
    cache = {}
    cache_path = os.path.expanduser("~/.cache/cpbuddy_cfratings.json")
    for p in data.get("result", {}).get("problems", []):
        cid = p.get("contestId")
        idx = p.get("index")
        r = p.get("rating")
        if cid and idx and r:
            cache[f"{cid}_{idx}"] = r
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    with open(cache_path, "w") as f:
        json.dump(cache, f)
except Exception:
    pass
]]
        vim.fn.jobstart({ "python3", "-c", py_script }, {
            on_exit = function()
                vim.schedule(function()
                    if vim.api.nvim_buf_is_valid(bufnr) then
                        vim.b[bufnr].cpbuddy_rating = nil
                        _ratings_cache[filename] = nil
                        vim.cmd("redrawstatus")
                    end
                end)
            end,
        })

        local default_rating = 800
        if cf_index:upper() == "B" then default_rating = 1000
        elseif cf_index:upper() == "C" then default_rating = 1300
        elseif cf_index:upper() == "D" then default_rating = 1600
        elseif cf_index:upper() == "E" then default_rating = 1900
        end
        local res = "⭐ Rating: " .. default_rating
        return res
    end

    local fallback = "⭐ Rating: 800"
    _ratings_cache[filename] = fallback
    vim.b[bufnr].cpbuddy_rating = fallback
    return fallback
end

function M.notify(msg, level, title)
    local ok, notify = pcall(require, "cpbuddy.notify")
    if ok and notify then
        notify.notify(msg, level, { title = title or "CPBuddy", timeout = 3000 })
    else
        vim.notify(msg, level or vim.log.levels.INFO, { title = title or "CPBuddy" })
    end
end

return M
