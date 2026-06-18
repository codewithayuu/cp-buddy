local M = {}

function M.create_problem_view(payload)
    local problems = payload.problems or {}
    if #problems == 0 then return end
    local problem = problems[1]
    
    local workspace_root = vim.fn.getcwd()
    
    local group = problem.group or "Unknown Platform"
    local platform = vim.split(group, " - ")[1] or "Unknown"
    local name = problem.name or "Unknown Problem"
    local safe_name = name:gsub("[^%w]+", "_"):gsub("^_", ""):gsub("_$", "")
    
    local platform_dir = workspace_root .. "/" .. platform
    vim.fn.mkdir(platform_dir, "p")
    
    local cpp_file = platform_dir .. "/" .. safe_name .. ".cpp"
    if vim.fn.filereadable(cpp_file) == 0 then
        local header = "// Problem Name: " .. name .. "\n// Problem URL: " .. (problem.url or "") .. "\n\n"
        local template_path = workspace_root .. "/template.cpp"
        local final_content = header .. "#include <iostream>\n\nusing namespace std;\n\nint main() {\n    return 0;\n}\n"
        
        if vim.fn.filereadable(template_path) == 1 then
            local lines = vim.fn.readfile(template_path)
            local content = table.concat(lines, "\n")
            content = content:gsub("${title}", name)
            content = content:gsub("${timeLimit}", tostring(problem.timeLimit or 0))
            content = content:gsub("${memoryLimit}", tostring(problem.memoryLimit or 0))
            content = content:gsub("${url}", problem.url or "")
            final_content = header .. content
        end
        
        vim.fn.writefile(vim.split(final_content, "\n"), cpp_file)
    end
    
    local cpbuddy_dir = workspace_root .. "/.cpbuddy/" .. platform .. "/" .. safe_name
    vim.fn.mkdir(cpbuddy_dir, "p")
    
    local testcase_files = {}
    for i, test in ipairs(problem.tests or {}) do
        local in_file = cpbuddy_dir .. "/test" .. i .. ".in"
        local ans_file = cpbuddy_dir .. "/test" .. i .. ".ans"
        vim.fn.writefile(vim.split(test.input or "", "\n"), in_file)
        vim.fn.writefile(vim.split(test.output or "", "\n"), ans_file)
        table.insert(testcase_files, {in_file = in_file, ans_file = ans_file})
    end
    
    -- Save state for runner
    vim.g.cpbuddy_current_cpp = cpp_file
    vim.g.cpbuddy_current_dir = cpbuddy_dir
    vim.g.cpbuddy_test_count = #testcase_files
    
    M.setup_layout(cpp_file, testcase_files[1])
end

function M.setup_layout(cpp_file, first_test)
    -- Close all other windows
    vim.cmd("only")
    
    -- Open CPP file
    vim.cmd("edit " .. cpp_file)
    
    -- Split right (Vertical Split)
    vim.cmd("vsplit")
    vim.cmd("wincmd l") -- Move to right window
    
    -- Top Right: Input
    if first_test and first_test.in_file then
        vim.cmd("edit " .. first_test.in_file)
    else
        vim.cmd("enew")
        vim.cmd("setlocal buftype=nofile")
        vim.api.nvim_buf_set_lines(0, 0, -1, false, {"No input provided"})
    end
    
    -- Middle Right: Expected Output
    vim.cmd("split")
    vim.cmd("wincmd j")
    if first_test and first_test.ans_file then
        vim.cmd("edit " .. first_test.ans_file)
    else
        vim.cmd("enew")
        vim.cmd("setlocal buftype=nofile")
        vim.api.nvim_buf_set_lines(0, 0, -1, false, {"No expected output"})
    end
    
    -- Bottom Right: Actual Output
    vim.cmd("split")
    vim.cmd("wincmd j")
    vim.cmd("enew")
    vim.cmd("setlocal buftype=nofile")
    vim.api.nvim_buf_set_name(0, "CPBuddy_Results")
    vim.api.nvim_buf_set_lines(0, 0, -1, false, {"Results will appear here. Press F5 to run."})
    
    -- Adjust Sizes
    vim.cmd("wincmd h") -- Back to CPP file (Left)
    vim.cmd("vertical resize " .. math.floor(vim.o.columns * 0.5))
    
    vim.cmd("wincmd l") -- Move to Input (Top Right)
    vim.cmd("resize " .. math.floor(vim.o.lines * 0.3))
    
    vim.cmd("wincmd j") -- Move to Expected (Middle Right)
    vim.cmd("resize " .. math.floor(vim.o.lines * 0.3))
    
    vim.cmd("wincmd h") -- Return cursor to main CPP file
end

return M
