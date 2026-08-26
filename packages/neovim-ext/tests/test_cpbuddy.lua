-- Headless automated test script for CPBuddy Neovim extension
local cpbuddy = require("cpbuddy")

print("[TEST] 1. Initializing CPBuddy setup...")
cpbuddy.setup({
    default_language = "cpp",
    router = {
        auto_start = false, -- Don't spawn router during unit test
    },
})
print("[PASS] Setup completed successfully.")

print("[TEST] 2. Verifying snippet library...")
assert(#cpbuddy.snippets.library >= 10, "Snippet library should have at least 10 templates")
print(string.format("[PASS] Snippet library verified (%d templates loaded).", #cpbuddy.snippets.library))

print("[TEST] 3. Simulating Problem Parsing from Competitive Companion...")
local sample_payload = {
    problems = {
        {
            name = "Test Problem A",
            group = "Codeforces - Educational Round",
            url = "https://codeforces.com/contest/9999/problem/A",
            timeLimit = 2000,
            memoryLimit = 256,
            tests = {
                {
                    input = "3\n1 2\n3 4\n5 5\n",
                    output = "3\n7\n10\n",
                },
                {
                    input = "1\n10 20\n",
                    output = "30\n",
                },
            },
        }
    }
}

cpbuddy.layout.create_problem_view(sample_payload)

local workspace_root = cpbuddy.utils.get_workspace_root()
local expected_src = workspace_root .. "/Codeforces/Test_Problem_A.cpp"
local expected_bin = workspace_root .. "/.cpbuddy/Codeforces/Test_Problem_A/Test_Problem_A.bin"
local expected_in1 = workspace_root .. "/.cpbuddy/Codeforces/Test_Problem_A/test1.in"
local expected_ans1 = workspace_root .. "/.cpbuddy/Codeforces/Test_Problem_A/test1.ans"

assert(vim.fn.filereadable(expected_src) == 1, "Source file was not created: " .. expected_src)
assert(vim.fn.filereadable(expected_in1) == 1, "test1.in was not created")
assert(vim.fn.filereadable(expected_ans1) == 1, "test1.ans was not created")
assert(vim.fn.filereadable(expected_bin) == 1, ".bin metadata file was not created")
print("[PASS] Problem files, tests, and .bin metadata generated correctly.")

print("[TEST] 4. Writing working solution into source file...")
local sol_code = [[
#include <iostream>
using namespace std;
int main() {
    int t;
    if (cin >> t) {
        while (t--) {
            int a, b;
            cin >> a >> b;
            cout << (a + b) << "\n";
        }
    }
    return 0;
}
]]
cpbuddy.utils.write_file(expected_src, sol_code)

print("[TEST] 5. Running testcases against solution...")
vim.cmd("edit " .. expected_src)

local test_completed = false
cpbuddy.runner.run_current_problem({
    on_complete = function(res)
        print(string.format("[TEST RESULT] Status: %s | Tests: %d | Passed: %d", res.status, res.total_tests or 0, res.passed_count or 0))
        assert(res.status == "AC", "Expected AC verdict for working solution")
        assert(res.passed_count == 2, "Expected 2 passed testcases")
        test_completed = true
    end
})

-- Wait for async test completion in loop
local max_wait = 50 -- 5 seconds
local waited = 0
while not test_completed and waited < max_wait do
    vim.wait(100)
    waited = waited + 1
end

assert(test_completed, "Test run timed out!")
print("[PASS] All testcases ran and PASSED with [AC] verdict!")

print("[TEST] 6. Verifying testcase addition and deletion...")
local initial_count = vim.g.cpbuddy_test_count
cpbuddy.testcase_manager.add_testcase()
assert(vim.g.cpbuddy_test_count == initial_count + 1, "Test count should increment")

cpbuddy.testcase_manager.delete_testcase(initial_count + 1)
assert(vim.g.cpbuddy_test_count == initial_count, "Test count should decrement after delete")
print("[PASS] Testcase manager add/delete verified.")

print("[TEST] 7. Verifying Contest Mode...")
cpbuddy.contest.start(60)
assert(cpbuddy.contest.is_active == true, "Contest timer should be active")
local status = cpbuddy.contest.get_status()
assert(status:find("⏱️") ~= nil, "Contest status should contain timer icon")
cpbuddy.contest.stop()
print("[PASS] Contest timer verified.")

-- Clean up test files
cpbuddy.utils.delete_file(expected_src)
cpbuddy.utils.delete_dir_recursive(workspace_root .. "/.cpbuddy/Codeforces/Test_Problem_A")
print("[PASS] Test cleanup completed.")

print("\n✨ ALL 7 AUTOMATED CPBUDDY TESTS PASSED SUCCESSFULLY! ✨\n")
