local M = {}

M.defaults = {
    -- Default workspace directory for problem sources and testcases
    workspace_root = "/home/ayu/Dev/cp",

    -- Default language used for templates and problem generation
    default_language = "cpp",
    
    -- Languages configuration
    languages = {
        cpp = {
            extension = "cpp",
            compile_cmd = "g++",
            compile_args = { "-std=c++23", "-O2", "-Wall", "-DDEBUG", "-DONLINE_JUDGE" },
            run_cmd = "./{exec}",
            is_compiled = true,
            template = [[
// Problem Name: ${title}
// Problem URL: ${url}
// Time Limit: ${timeLimit} ms
// Memory Limit: ${memoryLimit} MB
// Date: ${date}

#include <bits/stdc++.h>
using namespace std;

#define FAST_IO ios_base::sync_with_stdio(false); cin.tie(NULL);
#define ll long long
#define all(v) (v).begin(), (v).end()

void solve() {
    // Your solution here
}

int main() {
    FAST_IO;
    int t = 1;
    cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}
]],
        },
        c = {
            extension = "c",
            compile_cmd = "gcc",
            compile_args = { "-O2", "-Wall", "-DDEBUG" },
            run_cmd = "./{exec}",
            is_compiled = true,
            template = [[
// Problem: ${title}
// URL: ${url}

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void solve(void) {
    // Your code here
}

int main(void) {
    int t = 1;
    if (scanf("%d", &t) == 1) {
        while (t--) {
            solve();
        }
    }
    return 0;
}
]],
        },
        python = {
            extension = "py",
            run_cmd = "python3",
            run_args = { "{src}" },
            is_compiled = false,
            template = [[
# Problem: ${title}
# URL: ${url}

import sys

def solve():
    # Your code here
    pass

def main():
    input = sys.stdin.read
    data = input().split()
    if not data:
        return
    # Read testcases
    t = int(data[0])
    for _ in range(t):
        solve()

if __name__ == "__main__":
    main()
]],
        },
        rust = {
            extension = "rs",
            compile_cmd = "rustc",
            compile_args = { "-O", "-o", "{exec}", "{src}" },
            run_cmd = "./{exec}",
            is_compiled = true,
            template = [[
// Problem: ${title}
// URL: ${url}

use std::io::{self, BufRead};

fn solve() {
    // Your code here
}

fn main() {
    let stdin = io::stdin();
    let mut lines = stdin.lock().lines();
    if let Some(Ok(first_line)) = lines.next() {
        let t: usize = first_line.trim().parse().unwrap_or(1);
        for _ in 0..t {
            solve();
        }
    }
}
]],
        },
        java = {
            extension = "java",
            compile_cmd = "javac",
            compile_args = { "{src}" },
            run_cmd = "java",
            run_args = { "-cp", "{dir}", "{className}" },
            is_compiled = true,
            template = [[
// Problem: ${title}
// URL: ${url}

import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = null;
        
        String line = br.readLine();
        if (line == null) return;
        int t = Integer.parseInt(line.trim());
        while (t-- > 0) {
            solve(br);
        }
    }
    
    static void solve(BufferedReader br) throws Exception {
        // Your code here
    }
}
]],
        },
        go = {
            extension = "go",
            compile_cmd = "go",
            compile_args = { "build", "-o", "{exec}", "{src}" },
            run_cmd = "./{exec}",
            is_compiled = true,
            template = [[
// Problem: ${title}
// URL: ${url}

package main

import (
	"bufio"
	"fmt"
	"os"
)

func solve(reader *bufio.Reader, writer *bufio.Writer) {
	// Your code here
}

func main() {
	reader := bufio.NewReader(os.Stdin)
	writer := bufio.NewWriter(os.Stdout)
	defer writer.Flush()

	var t int
	if _, err := fmt.Fscan(reader, &t); err == nil {
		for i := 0; i < t; i++ {
			solve(reader, writer)
		}
	}
}
]],
        },
    },

    -- Router Settings
    router = {
        auto_start = true,
        host = "127.0.0.1",
        port = 27121,
        poll_interval = 1000,
    },

    -- Layout Settings (Sublime Text 4-Split or Floating)
    layout = {
        mode = "sublime", -- "sublime", "floating", or "split_bottom"
        code_width_ratio = 0.70,
        input_height_ratio = 0.30,
        answer_height_ratio = 0.30,
        auto_sync_on_switch = true,
        results_buffer_name = "CPBuddy_Results",
    },

    -- Test Runner Options
    runner = {
        default_time_limit_ms = 2000,
        auto_save = true,
        diff_mode = "side_by_side", -- "side_by_side", "inline", "unified"
        show_memory = true,
        max_output_display_chars = 10000,
    },

    -- Stress Testing Defaults
    stress = {
        default_iterations = 100,
        timeout_ms = 3000,
        gen_name = "gen",
        brute_name = "brute",
    },

    -- Contest Timer & Switcher
    contest = {
        default_duration_min = 120,
        statusline_indicator = true,
    },

    -- UI Icons & Symbols
    icons = {
        passed = "✔",
        failed = "✖",
        tle = "⏳",
        rte = "💥",
        running = "🔄",
        compile_err = "🚨",
        testcase = "🧪",
        problem = "🏆",
        stress = "⚔️",
        submit = "🚀",
        timer = "⏱️",
        snippet = "📦",
    },

    -- Default Keymaps
    keymaps = {
        run = "<F5>",
        run_leader = "<leader>cr",
        dashboard = "<leader>ct",
        add_test = "<leader>ca",
        delete_problem = "<leader>cd",
        submit = "<leader>cs",
        stress_test = "<leader>cst",
        snippets = "<leader>cp",
        contest = "<leader>cc",
        toggle_layout = "<leader>cl",
    },
}

M.options = vim.deepcopy(M.defaults)

function M.setup(opts)
    if opts then
        M.options = vim.tbl_deep_extend("force", M.defaults, opts)
    else
        M.options = vim.deepcopy(M.defaults)
    end
end

function M.get(key)
    return M.options[key]
end

return M
