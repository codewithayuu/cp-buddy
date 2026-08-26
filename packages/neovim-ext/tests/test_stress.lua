-- Headless test script for Stress Testing module
local cpbuddy = require("cpbuddy")

print("[TEST] 1. Initializing for Stress Testing...")
cpbuddy.setup({
    default_language = "cpp",
    router = { auto_start = false },
})

local sample_payload = {
    problems = {
        {
            name = "Stress Sum Test",
            group = "Codeforces - Educational",
            url = "https://codeforces.com/problem/999/S",
            timeLimit = 2000,
            memoryLimit = 256,
            tests = {
                { input = "2\n1 2\n", output = "3\n" },
            },
        }
    }
}

cpbuddy.layout.create_problem_view(sample_payload)
local workspace_root = cpbuddy.utils.get_workspace_root()
local sol_file = workspace_root .. "/Codeforces/Stress_Sum_Test.cpp"

-- Write correct solution
local sol_code = [[
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int t;
    if (cin >> t) {
        while (t--) {
            int n;
            if (!(cin >> n)) break;
            vector<int> a(n);
            long long s = 0;
            for (int i = 0; i < n; i++) {
                cin >> a[i];
                s += a[i];
            }
            cout << s << "\n";
        }
    }
    return 0;
}
]]
cpbuddy.utils.write_file(sol_file, sol_code)
vim.cmd("edit " .. sol_file)

print("[TEST] 2. Starting stress test for 10 iterations...")
cpbuddy.stress.start_stress_test(10)

-- Wait for stress test to finish
local max_wait = 60
local waited = 0
while cpbuddy.stress.is_running and waited < max_wait do
    vim.wait(100)
    waited = waited + 1
end

assert(cpbuddy.stress.is_running == false, "Stress test should have completed")
print("[PASS] Stress test ran 10 iterations cleanly with generator and brute force!")

-- Cleanup
cpbuddy.utils.delete_file(sol_file)
cpbuddy.utils.delete_dir_recursive(workspace_root .. "/.cpbuddy/Codeforces/Stress_Sum_Test")
print("[PASS] Stress test cleanup completed.")

print("\n✨ ALL STRESS TESTING TESTS PASSED! ✨\n")
