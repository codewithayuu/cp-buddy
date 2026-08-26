local M = {}
local utils = require("cpbuddy.utils")
local config = require("cpbuddy.config")

M.is_running = false
M.stop_requested = false

function M.start_stress_test(max_iterations)
    local info = utils.get_problem_info()
    if not info then
        utils.notify("No active problem detected for stress testing.", vim.log.levels.WARN)
        return
    end

    max_iterations = max_iterations or config.get("stress").default_iterations or 100
    local cpbuddy_dir = info.cpbuddy_dir
    local gen_src = cpbuddy_dir .. "/gen.cpp"
    local brute_src = cpbuddy_dir .. "/brute.cpp"

    -- 1. Create generator template if missing
    if vim.fn.filereadable(gen_src) == 0 then
        local gen_template = [[
#include <bits/stdc++.h>
using namespace std;

// Random number generator helper
mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
long long rand_range(long long l, long long r) {
    return uniform_int_distribution<long long>(l, r)(rng);
}

int main() {
    int t = 1;
    cout << t << "\n";
    int n = rand_range(1, 10);
    cout << n << "\n";
    for (int i = 0; i < n; i++) {
        cout << rand_range(1, 100) << (i + 1 == n ? "" : " ");
    }
    cout << "\n";
    return 0;
}
]]
        utils.write_file(gen_src, gen_template)
    end

    -- 2. Create brute force template if missing
    if vim.fn.filereadable(brute_src) == 0 then
        local brute_template = [[
#include <bits/stdc++.h>
using namespace std;

// Implement simple / naive / brute force solution
void solve() {
    int n;
    if (!(cin >> n)) return;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    
    // Naive logic
    long long sum = 0;
    for (int x : a) sum += x;
    cout << sum << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t = 1;
    if (cin >> t) {
        while (t--) solve();
    }
    return 0;
}
]]
        utils.write_file(brute_src, brute_template)
    end

    -- 3. Open Floating Stress UI
    local width = math.min(90, math.floor(vim.o.columns * 0.80))
    local height = math.min(25, math.floor(vim.o.lines * 0.75))
    local row = math.floor((vim.o.lines - height) / 2)
    local col = math.floor((vim.o.columns - width) / 2)

    local buf = vim.api.nvim_create_buf(false, true)
    vim.bo[buf].buftype = "nofile"
    vim.bo[buf].bufhidden = "wipe"

    local win = vim.api.nvim_open_win(buf, true, {
        relative = "editor",
        row = row,
        col = col,
        width = width,
        height = height,
        style = "minimal",
        border = "rounded",
        title = " ⚔️ CPBuddy Stress Tester: " .. info.name .. " ",
        title_pos = "center",
    })

    local function set_lines(lines)
        if vim.api.nvim_buf_is_valid(buf) then
            vim.bo[buf].modifiable = true
            vim.api.nvim_buf_set_lines(buf, 0, -1, false, lines)
            vim.bo[buf].modifiable = false
        end
    end

    set_lines({
        " ⚔️ Compiling generator, brute force, and solution...",
        " ──────────────────────────────────────────────────────────",
    })

    -- 4. Compile all 3 components
    local gen_exec = cpbuddy_dir .. "/gen_exec"
    local brute_exec = cpbuddy_dir .. "/brute_exec"
    local sol_exec = cpbuddy_dir .. "/sol_exec"

    local compile_all = string.format("g++ -O2 %s -o %s && g++ -O2 %s -o %s && g++ -O2 %s -o %s",
        vim.fn.shellescape(gen_src), vim.fn.shellescape(gen_exec),
        vim.fn.shellescape(brute_src), vim.fn.shellescape(brute_exec),
        vim.fn.shellescape(info.filepath), vim.fn.shellescape(sol_exec)
    )

    M.is_running = true
    M.stop_requested = false

    vim.fn.jobstart(compile_all, {
        on_exit = function(_, exit_code)
            if exit_code ~= 0 then
                M.is_running = false
                set_lines({
                    " 🚨 Compilation failed for generator, brute, or solution!",
                    " Please check files in: " .. cpbuddy_dir,
                    "",
                    " Press 'q' or <Esc> to close.",
                })
                return
            end

            -- 5. Start testing iterations
            local current_iter = 1
            local function run_iteration()
                if M.stop_requested or current_iter > max_iterations then
                    M.is_running = false
                    set_lines({
                        string.format(" 🎉 STRESS TEST PASSED (%d / %d iterations with no mismatches!)", current_iter - 1, max_iterations),
                        " ──────────────────────────────────────────────────────────",
                        " Generator: " .. gen_src,
                        " Brute:     " .. brute_src,
                        "",
                        " Press 'q' or <Esc> to close.",
                    })
                    return
                end

                set_lines({
                    string.format(" 🔄 Running stress test iteration %d / %d ...", current_iter, max_iterations),
                    " ──────────────────────────────────────────────────────────",
                    " Press 's' to stop | 'q' to close",
                })

                -- Run gen -> input
                local input_data = vim.fn.system(gen_exec)
                -- Run brute -> expected
                local brute_data = vim.fn.system(brute_exec, input_data)
                -- Run sol -> actual
                local sol_data = vim.fn.system(sol_exec, input_data)

                local clean_brute = utils.trim(brute_data):gsub("\r\n", "\n")
                local clean_sol = utils.trim(sol_data):gsub("\r\n", "\n")

                if clean_brute ~= clean_sol then
                    -- MISMATCH FOUND!
                    M.is_running = false
                    local fail_lines = {
                        string.format(" 💥 MISMATCH FOUND ON ITERATION #%d!", current_iter),
                        " ──────────────────────────────────────────────────────────",
                        " 📥 Failing Input:",
                    }
                    for _, l in ipairs(vim.split(input_data, "\n")) do table.insert(fail_lines, "   " .. l) end
                    table.insert(fail_lines, "")
                    table.insert(fail_lines, " 🎯 Expected (Brute Force):")
                    for _, l in ipairs(vim.split(brute_data, "\n")) do table.insert(fail_lines, "   " .. l) end
                    table.insert(fail_lines, "")
                    table.insert(fail_lines, " ❌ Received (Optimized Solution):")
                    for _, l in ipairs(vim.split(sol_data, "\n")) do table.insert(fail_lines, "   " .. l) end
                    table.insert(fail_lines, "")
                    table.insert(fail_lines, " [i] Import this failing case as a testcase | [q] Close")

                    set_lines(fail_lines)

                    -- Keymap to import failing testcase
                    vim.keymap.set("n", "i", function()
                        local new_idx = info.test_count + 1
                        utils.write_file(info.cpbuddy_dir .. "/test" .. new_idx .. ".in", input_data)
                        utils.write_file(info.cpbuddy_dir .. "/test" .. new_idx .. ".ans", brute_data)
                        vim.g.cpbuddy_test_count = new_idx
                        utils.notify("Imported failing case into Testcase #" .. new_idx, vim.log.levels.INFO)
                    end, { buffer = buf, nowait = true, silent = true })
                    return
                end

                current_iter = current_iter + 1
                vim.defer_fn(run_iteration, 5)
            end

            run_iteration()
        end
    })

    -- Map shortcuts inside stress buffer
    local function map(lhs, rhs)
        vim.keymap.set("n", lhs, rhs, { buffer = buf, nowait = true, silent = true })
    end
    map("s", function() M.stop_requested = true end)
    map("q", function()
        M.stop_requested = true
        if vim.api.nvim_win_is_valid(win) then vim.api.nvim_win_close(win, true) end
    end)
    map("<Esc>", function()
        M.stop_requested = true
        if vim.api.nvim_win_is_valid(win) then vim.api.nvim_win_close(win, true) end
    end)
end

return M
