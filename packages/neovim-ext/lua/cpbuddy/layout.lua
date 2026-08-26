local M = {}
local config = require("cpbuddy.config")
local utils = require("cpbuddy.utils")

M.active_layout = false
M.current_test_idx = 1

function M.get_open_problem_tabs()
    local tabs = {}
    local seen = {}
    for _, b in ipairs(vim.api.nvim_list_bufs()) do
        if vim.api.nvim_buf_is_valid(b) and vim.bo[b].buflisted then
            local name = vim.api.nvim_buf_get_name(b)
            if name ~= "" and not name:find("CPBuddy_Results")
               and not name:find("%.in$") and not name:find("%.ans$") and not name:find("%.out$") then
                local base = vim.fn.fnamemodify(name, ":t")
                if not seen[name] then
                    seen[name] = true
                    table.insert(tabs, {
                        bufnr = b,
                        filepath = name,
                        filename = base,
                        modified = vim.bo[b].modified,
                    })
                end
            end
        end
    end
    return tabs
end

function M.render_main_winbar(bufnr)
    bufnr = bufnr or vim.api.nvim_get_current_buf()
    local open_tabs = M.get_open_problem_tabs()
    if #open_tabs == 0 then
        local cur_name = vim.api.nvim_buf_get_name(bufnr)
        local base = vim.fn.fnamemodify(cur_name, ":t")
        if base == "" then base = "[No Name]" end
        return "%#CPBuddyActiveTab#  " .. base .. "  %*"
    end

    local parts = {}
    for _, tab in ipairs(open_tabs) do
        local is_active = (tab.bufnr == bufnr)
        local mod_icon = tab.modified and " ●" or ""
        local tab_hl = is_active and "%#CPBuddyActiveTab#" or "%#CPBuddyInactiveTab#"
        local close_hl = is_active and "%#CPBuddyTabClose#" or "%#CPBuddyTabCloseInactive#"
        
        -- Correct Neovim clickable item syntax: %<minwid>@<func_name>@ <text> %X
        local tab_str = string.format(
            "%s%%%d@v:lua.CPBuddyTabClick@  %s%s %%X%s%%%d@v:lua.CPBuddyCloseTabClick@✕ %%X",
            tab_hl, tab.bufnr, tab.filename, mod_icon,
            close_hl, tab.bufnr
        )
        table.insert(parts, tab_str)
    end
    
    return table.concat(parts, "%#WinBar# ") .. "%*"
end

function _G.CPBuddyMainWinbar()
    return M.render_main_winbar(vim.api.nvim_get_current_buf())
end

function _G.CPBuddyTabClick(minwid, clicks, button, modifier)
    local bufnr = (type(minwid) == "number" and minwid > 0) and minwid or vim.api.nvim_get_current_buf()
    if not vim.api.nvim_buf_is_valid(bufnr) then return end
    M.switch_to_problem_tab(bufnr)
end

function _G.CPBuddyCloseTabClick(minwid, clicks, button, modifier)
    local bufnr = (type(minwid) == "number" and minwid > 0) and minwid or vim.api.nvim_get_current_buf()
    if not vim.api.nvim_buf_is_valid(bufnr) then return end
    M.close_problem_tab(bufnr)
end

function M.switch_to_problem_tab(bufnr)
    if not vim.api.nvim_buf_is_valid(bufnr) then return end
    local filename = vim.api.nvim_buf_get_name(bufnr)
    local info = utils.get_problem_info(filename)
    if not info then
        vim.api.nvim_set_current_buf(bufnr)
        return
    end

    vim.g.cpbuddy_current_file = info.filepath
    vim.g.cpbuddy_current_dir = info.cpbuddy_dir
    vim.g.cpbuddy_current_name = info.safe_name
    vim.g.cpbuddy_current_platform = info.platform
    vim.g.cpbuddy_test_count = info.test_count

    M.current_test_idx = 1
    M.setup_layout(info.filepath, 1)
end

function M.close_problem_tab(bufnr)
    bufnr = bufnr or vim.api.nvim_get_current_buf()
    if not vim.api.nvim_buf_is_valid(bufnr) then return end

    local open_tabs = M.get_open_problem_tabs()
    local remaining = {}
    local next_tab = nil

    for idx, tab in ipairs(open_tabs) do
        if tab.bufnr == bufnr then
            if open_tabs[idx + 1] then
                next_tab = open_tabs[idx + 1]
            elseif open_tabs[idx - 1] then
                next_tab = open_tabs[idx - 1]
            end
        else
            table.insert(remaining, tab)
        end
    end

    pcall(vim.api.nvim_buf_delete, bufnr, { force = true })

    if #remaining == 0 then
        vim.cmd("silent! only")
        vim.cmd("silent! enew")
        pcall(function() vim.wo.winbar = "" end)
        M.active_layout = false
        utils.notify("All problem tabs closed.", vim.log.levels.INFO)
    elseif next_tab and vim.api.nvim_buf_is_valid(next_tab.bufnr) then
        M.switch_to_problem_tab(next_tab.bufnr)
    else
        local first = remaining[1]
        if first and vim.api.nvim_buf_is_valid(first.bufnr) then
            M.switch_to_problem_tab(first.bufnr)
        end
    end
end

function M.next_problem_tab()
    local open_tabs = M.get_open_problem_tabs()
    if #open_tabs <= 1 then return end
    local cur_buf = vim.api.nvim_get_current_buf()
    for i, tab in ipairs(open_tabs) do
        if tab.bufnr == cur_buf then
            local next_idx = i + 1
            if next_idx > #open_tabs then next_idx = 1 end
            M.switch_to_problem_tab(open_tabs[next_idx].bufnr)
            return
        end
    end
    M.switch_to_problem_tab(open_tabs[1].bufnr)
end

function M.prev_problem_tab()
    local open_tabs = M.get_open_problem_tabs()
    if #open_tabs <= 1 then return end
    local cur_buf = vim.api.nvim_get_current_buf()
    for i, tab in ipairs(open_tabs) do
        if tab.bufnr == cur_buf then
            local prev_idx = i - 1
            if prev_idx < 1 then prev_idx = #open_tabs end
            M.switch_to_problem_tab(open_tabs[prev_idx].bufnr)
            return
        end
    end
    M.switch_to_problem_tab(open_tabs[#open_tabs].bufnr)
end

function M.create_problem_view(payload)
    local problems = payload.problems or {}
    if #problems == 0 then return end
    local problem = problems[1]
    
    local workspace_root = utils.get_workspace_root()
    local platform = utils.get_platform_name(problem.group, problem.url)
    
    local name = problem.name or "Unknown Problem"
    local safe_name = utils.sanitize_filename(name)
    
    local lang_key = config.get("default_language") or "cpp"
    local lang_conf = config.get("languages")[lang_key] or config.defaults.languages.cpp
    local ext = lang_conf.extension or "cpp"
    
    local platform_dir = workspace_root .. "/" .. platform
    vim.fn.mkdir(platform_dir, "p")
    
    local src_file = platform_dir .. "/" .. safe_name .. "." .. ext
    
    -- Populate template if file doesn't already exist
    if vim.fn.filereadable(src_file) == 0 then
        local template_path = workspace_root .. "/template." .. ext
        local template_content = lang_conf.template or ""
        
        if vim.fn.filereadable(template_path) == 1 then
            local lines = vim.fn.readfile(template_path)
            template_content = table.concat(lines, "\n")
        end
        
        local date_str = os.date("%Y-%m-%d %H:%M:%S")
        template_content = template_content:gsub("%${title}", name)
        template_content = template_content:gsub("%${url}", problem.url or "")
        template_content = template_content:gsub("%${timeLimit}", tostring(problem.timeLimit or 2000))
        template_content = template_content:gsub("%${memoryLimit}", tostring(problem.memoryLimit or 256))
        template_content = template_content:gsub("%${date}", date_str)
        
        utils.write_file(src_file, template_content)
    end
    
    -- Create .cpbuddy directory for testcases & metadata
    local cpbuddy_dir = workspace_root .. "/.cpbuddy/" .. platform .. "/" .. safe_name
    vim.fn.mkdir(cpbuddy_dir, "p")
    
    local testcase_files = {}
    local testcases_dict = {}
    local testcase_order = {}
    
    for i, test in ipairs(problem.tests or {}) do
        local in_file = cpbuddy_dir .. "/test" .. i .. ".in"
        local ans_file = cpbuddy_dir .. "/test" .. i .. ".ans"
        
        local in_data = test.input or ""
        local ans_data = test.output or ""
        
        utils.write_file(in_file, in_data)
        utils.write_file(ans_file, ans_data)
        
        local test_id = "test_" .. i
        table.insert(testcase_order, test_id)
        testcases_dict[test_id] = {
            stdin = { data = in_data },
            answer = { data = ans_data },
            isExpand = true,
            isDisabled = false,
            result = nil,
        }
        
        table.insert(testcase_files, {
            index = i,
            in_file = in_file,
            ans_file = ans_file,
        })
    end
    
    -- Save .bin gzipped payload compatible with VS Code / Sublime extensions
    local payload_bin = {
        version = "1.0.0",
        name = name,
        url = problem.url or "",
        timeLimit = problem.timeLimit or 2000,
        memoryLimit = problem.memoryLimit or 256,
        testcases = testcases_dict,
        testcaseOrder = testcase_order,
        src = {
            path = src_file,
            hash = "",
        },
    }
    local bin_file = cpbuddy_dir .. "/" .. safe_name .. ".bin"
    utils.write_bin_metadata(bin_file, payload_bin)
    
    -- Save state in vim.g
    vim.g.cpbuddy_current_file = src_file
    vim.g.cpbuddy_current_dir = cpbuddy_dir
    vim.g.cpbuddy_current_name = safe_name
    vim.g.cpbuddy_current_platform = platform
    vim.g.cpbuddy_test_count = #testcase_files
    
    M.current_test_idx = 1
    M.setup_layout(src_file, 1)
    
    utils.notify(string.format("Parsed '%s' (%d tests) from %s", name, #testcase_files, platform), vim.log.levels.INFO)
end

function M.setup_layout(src_file, test_idx)
    test_idx = test_idx or M.current_test_idx or 1
    M.current_test_idx = test_idx

    local info = utils.get_problem_info(src_file)
    if not info then return end

    src_file = info.filepath
    local cpbuddy_dir = info.cpbuddy_dir
    local safe_name = info.safe_name
    local in_file = cpbuddy_dir .. "/test" .. test_idx .. ".in"
    local ans_file = cpbuddy_dir .. "/test" .. test_idx .. ".ans"

    pcall(function() vim.opt.shortmess:append("A") end)

    -- 1. Close extra splits, keep single main window
    vim.cmd("silent! only")
    
    -- 2. Open source file in Left Pane
    local cur_name = vim.api.nvim_buf_get_name(0)
    if cur_name ~= src_file then
        vim.cmd("silent! edit " .. vim.fn.fnameescape(src_file))
    end
    local main_win = vim.api.nvim_get_current_win()
    vim.wo[main_win].number = true
    vim.wo[main_win].relativenumber = true
    vim.wo[main_win].winbar = "%!v:lua.CPBuddyMainWinbar()"
    
    -- 3. Vertical split to create Right column (Sublime Text layout)
    vim.cmd("silent! vsplit")
    local right_top_win = vim.api.nvim_get_current_win()
    
    -- Configure Right-Top Window: Input
    if vim.fn.filereadable(in_file) == 1 then
        vim.cmd("silent! edit " .. vim.fn.fnameescape(in_file))
    else
        vim.cmd("silent! enew")
        vim.bo.buftype = "nofile"
        vim.api.nvim_buf_set_lines(0, 0, -1, false, { "" })
    end
    vim.wo[right_top_win].number = true
    vim.wo[right_top_win].relativenumber = false
    vim.wo[right_top_win].wrap = false
    if (info.test_count or 1) > 1 then
        vim.wo[right_top_win].winbar = string.format("%%#CPBuddyMuted# input (sample %d/%d)", test_idx, info.test_count)
    else
        vim.wo[right_top_win].winbar = "%#CPBuddyMuted# input"
    end
    
    -- 4. Split horizontally for Middle-Right: Expected Output / Answer
    vim.cmd("silent! split")
    local right_mid_win = vim.api.nvim_get_current_win()
    if vim.fn.filereadable(ans_file) == 1 then
        vim.cmd("silent! edit " .. vim.fn.fnameescape(ans_file))
    else
        vim.cmd("silent! enew")
        vim.bo.buftype = "nofile"
        vim.api.nvim_buf_set_lines(0, 0, -1, false, { "" })
    end
    vim.wo[right_mid_win].number = true
    vim.wo[right_mid_win].relativenumber = false
    vim.wo[right_mid_win].wrap = false
    vim.wo[right_mid_win].winbar = "%#CPBuddyMuted# expected"
    
    -- 5. Split horizontally for Bottom-Right: CPBuddy Results
    vim.cmd("silent! split")
    local right_bot_win = vim.api.nvim_get_current_win()
    
    local results_buf = M.get_or_create_results_buffer(safe_name)
    vim.api.nvim_win_set_buf(right_bot_win, results_buf)
    vim.wo[right_bot_win].number = true
    vim.wo[right_bot_win].relativenumber = false
    vim.wo[right_bot_win].wrap = false
    vim.wo[right_bot_win].winbar = "%#CPBuddyMuted# output"
    
    -- 6. Adjust Split Proportions (Sublime Style: Left 70% width, Right panes equal 33% height)
    local total_cols = vim.o.columns
    local total_lines = vim.o.lines
    local code_width = math.floor(total_cols * (config.get("layout").code_width_ratio or 0.68))
    
    vim.api.nvim_win_set_width(main_win, code_width)
    
    local h_top = math.floor(total_lines * (config.get("layout").input_height_ratio or 0.30))
    local h_mid = math.floor(total_lines * (config.get("layout").answer_height_ratio or 0.30))
    
    pcall(vim.api.nvim_win_set_height, right_top_win, h_top)
    pcall(vim.api.nvim_win_set_height, right_mid_win, h_mid)
    
    -- 7. Focus back on main solution source editor
    vim.api.nvim_set_current_win(main_win)
    M.active_layout = true
end

function M.get_or_create_results_buffer(safe_name)
    local buf_name = "CPBuddy_Results" .. (safe_name and (":" .. safe_name) or "")
    for _, b in ipairs(vim.api.nvim_list_bufs()) do
        if vim.api.nvim_buf_is_valid(b) and vim.api.nvim_buf_get_name(b):find("CPBuddy_Results") then
            return b
        end
    end
    local buf = vim.api.nvim_create_buf(false, true)
    vim.api.nvim_buf_set_name(buf, buf_name)
    vim.bo[buf].buftype = "nofile"
    vim.bo[buf].bufhidden = "hide"
    vim.bo[buf].swapfile = false
    vim.bo[buf].filetype = "cpbuddy_results"
    vim.api.nvim_buf_set_lines(buf, 0, -1, false, {
        "No Output........",
        "",
    })
    return buf
end

function M.toggle_layout()
    local wins = vim.api.nvim_list_wins()
    if #wins > 1 then
        vim.cmd("silent! only")
        M.active_layout = false
        utils.notify("Sublime Layout: Focused single view", vim.log.levels.INFO)
    else
        local info = utils.get_problem_info()
        if info then
            M.setup_layout(info.filepath, M.current_test_idx or 1)
            utils.notify("Sublime Layout: 4-Split activated", vim.log.levels.INFO)
        else
            utils.notify("No active CP problem found in current buffer.", vim.log.levels.WARN)
        end
    end
end

function M.switch_testcase(idx)
    local info = utils.get_problem_info()
    if not info then return end
    local max_tests = math.max(1, info.test_count)
    if idx < 1 then idx = 1 end
    if idx > max_tests then idx = max_tests end
    
    M.current_test_idx = idx
    if M.active_layout then
        M.setup_layout(info.filepath, idx)
    end
    utils.notify(string.format("Viewing Testcase #%d of %d", idx, max_tests), vim.log.levels.INFO)
end

function M.next_testcase()
    local info = utils.get_problem_info()
    if not info then return end
    local next_idx = (M.current_test_idx or 1) + 1
    if next_idx > math.max(1, info.test_count) then next_idx = 1 end
    M.switch_testcase(next_idx)
end

function M.prev_testcase()
    local info = utils.get_problem_info()
    if not info then return end
    local prev_idx = (M.current_test_idx or 1) - 1
    if prev_idx < 1 then prev_idx = math.max(1, info.test_count) end
    M.switch_testcase(prev_idx)
end

function M.setup_autocmds()
    local group = vim.api.nvim_create_augroup("CPBuddyLayoutAutoSync", { clear = true })
    
    -- Sync layout when switching active buffers
    vim.api.nvim_create_autocmd({ "BufEnter" }, {
        group = group,
        callback = function(ev)
            if not config.get("layout").auto_sync_on_switch then return end
            if not M.active_layout then return end
            
            local filename = vim.api.nvim_buf_get_name(ev.buf)
            if filename == "" or filename:find("CPBuddy_Results") then return end
            if filename:find("%.in$") or filename:find("%.ans$") or filename:find("%.out$") then return end
            
            local info = utils.get_problem_info(filename)
            if info and info.filepath and info.safe_name ~= vim.g.cpbuddy_current_name then
                vim.g.cpbuddy_current_file = info.filepath
                vim.g.cpbuddy_current_dir = info.cpbuddy_dir
                vim.g.cpbuddy_current_name = info.safe_name
                vim.g.cpbuddy_current_platform = info.platform
                vim.g.cpbuddy_test_count = info.test_count
                
                local cur_win = vim.api.nvim_get_current_win()
                M.setup_layout(info.filepath, 1)
                pcall(vim.api.nvim_set_current_win, cur_win)
            end
        end
    })

    -- Redraw statusline and winbar on modified changes
    vim.api.nvim_create_autocmd({ "BufModifiedSet", "BufWritePost" }, {
        group = group,
        callback = function()
            pcall(vim.cmd, "redrawstatus")
            pcall(vim.cmd, "redrawtabline")
        end
    })
end

return M
