-- Headless test script for Python solutions and diff calculation
local cpbuddy = require("cpbuddy")

print("[TEST] 1. Initializing CPBuddy for Python problem test...")
cpbuddy.setup({
    default_language = "python",
    router = { auto_start = false },
})

local sample_py_payload = {
    problems = {
        {
            name = "Python Multiplier",
            group = "AtCoder - Beginner Contest",
            url = "https://atcoder.jp/contests/abc999/tasks/abc999_a",
            timeLimit = 2000,
            memoryLimit = 256,
            tests = {
                { input = "5 6\n", output = "30\n" },
                { input = "10 20\n", output = "200\n" },
            },
        }
    }
}

cpbuddy.layout.create_problem_view(sample_py_payload)
local workspace_root = cpbuddy.utils.get_workspace_root()
local py_src = workspace_root .. "/AtCoder/Python_Multiplier.py"

print("[TEST] 2. Writing Python solution...")
local py_code = [[
import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    a = int(lines[0])
    b = int(lines[1])
    print(a * b)

if __name__ == "__main__":
    main()
]]
cpbuddy.utils.write_file(py_src, py_code)

print("[TEST] 3. Running Python testcases...")
vim.cmd("edit " .. py_src)

local test_done = false
cpbuddy.runner.run_current_problem({
    on_complete = function(res)
        print(string.format("[TEST RESULT] Status: %s | Tests: %d | Passed: %d", res.status, res.total_tests or 0, res.passed_count or 0))
        assert(res.status == "AC", "Python execution should pass with AC")
        assert(res.passed_count == 2, "Both Python testcases should pass")
        test_done = true
    end
})

local max_wait = 50
local waited = 0
while not test_done and waited < max_wait do
    vim.wait(100)
    waited = waited + 1
end

assert(test_done, "Python test timed out!")
print("[PASS] Python testcase execution PASSED with [AC]!")

print("[TEST] 4. Verifying diff generator logic...")
local diffs = cpbuddy.utils.diff_lines("30\n200\n", "30\n199\n")
assert(#diffs == 2, "Expected 2 lines diff")
assert(diffs[1].type == "same", "Line 1 should be same")
assert(diffs[2].type == "diff", "Line 2 should be diff")
print("[PASS] Diff logic verified.")

-- Cleanup
cpbuddy.utils.delete_file(py_src)
cpbuddy.utils.delete_dir_recursive(workspace_root .. "/.cpbuddy/AtCoder/Python_Multiplier")
print("[PASS] Python test cleanup completed.")

print("\n✨ ALL PYTHON & DIFF TESTS PASSED! ✨\n")
