import sublime
import sublime_plugin
import subprocess
import threading
import os
import json
import urllib.request
import urllib.error
import time
import gzip
import uuid

CPBUDDY_SNIPPETS = [
    {
        "name": "Binary Search",
        "description": "Standard binary search for an element in a sorted array",
        "code": """\
// ${1:target} is the element to find, ${2:n} is the size of the array ${3:arr}
int l = 0, r = ${2:n} - 1, ans = -1;
while (l <= r) {
    int mid = l + (r - l) / 2;
    if (${3:arr}[mid] == ${1:target}) {
        ans = mid;
        break; // found the element
    } else if (${3:arr}[mid] < ${1:target}) {
        l = mid + 1;
    } else {
        r = mid - 1;
    }
}
// ans is the index, or -1 if not found
$0"""
    },
    {
        "name": "Binary Search on Answer",
        "description": "Monotonic predicate binary search template",
        "code": """\
auto check = [&](long long mid) {
    // TODO: implement predicate logic for mid
    // return true if mid is a valid/possible answer
    $1
    return false;
};

long long l = ${2:0}, r = ${3:1e18}, ans = -1;
while (l <= r) {
    long long mid = l + (r - l) / 2;
    if (check(mid)) {
        ans = mid;
        // Adjust bounds depending on whether we want min or max answer
        ${4:l = mid + 1;} // (change to r = mid - 1 to find minimum)
    } else {
        ${5:r = mid - 1;} // (change to l = mid + 1 to find minimum)
    }
}
$0"""
    },
    {
        "name": "GCD (Greatest Common Divisor)",
        "description": "Calculate GCD of two numbers (Euclidean algorithm)",
        "code": """\
long long gcd(long long a, long long b) {
    while (b) {
        a %= b;
        swap(a, b);
    }
    return a;
}
$0"""
    },
    {
        "name": "Fast Exponentiation (Modular)",
        "description": "Calculate (a^b) % mod efficiently in O(log b)",
        "code": """\
long long binpow(long long a, long long b, long long mod = ${1:1e9+7}) {
    long long res = 1;
    a %= mod;
    while (b > 0) {
        if (b & 1)
            res = res * a % mod;
        a = a * a % mod;
        b >>= 1;
    }
    return res;
}
$0"""
    }
]

router_process = None
polling_thread = None
is_stopping = False

def start_router():
    global router_process
    if router_process is not None:
        return
    plugin_dir = os.path.dirname(os.path.realpath(__file__))
    router_script = os.path.join(plugin_dir, "router", "router.cjs")
    if not os.path.exists(router_script):
        print("CPBuddy: Router script not found at", router_script)
        # Attempt to run directly from workspace if in development mode
        workspace_router = os.path.join(plugin_dir, "..", "local-router", "dist", "router.cjs")
        if os.path.exists(workspace_router):
            router_script = workspace_router
        else:
            return
            
    try:
        log_file = os.path.expanduser("~/.cpbuddy-router.log")
        router_process = subprocess.Popen(["node", router_script, "-p", "27121", "-l", log_file], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("CPBuddy: Router started via Node.js")
    except Exception as e:
        print("CPBuddy: Failed to start router", e)

def check_deleted_problems():
    sublime.set_timeout(do_check_deleted_problems, 0)

def do_check_deleted_problems():
    window = sublime.active_window()
    if not window:
        return
    folders = window.folders()
    if not folders:
        return
        
    workspace_root = folders[0]
    cpbuddy_root = os.path.join(workspace_root, ".cpbuddy")
    if not os.path.exists(cpbuddy_root):
        return
        
    for platform in os.listdir(cpbuddy_root):
        platform_dir = os.path.join(cpbuddy_root, platform)
        if not os.path.isdir(platform_dir):
            continue
            
        for safe_name in os.listdir(platform_dir):
            problem_dir = os.path.join(platform_dir, safe_name)
            if not os.path.isdir(problem_dir):
                continue
                
            cpp_file = os.path.join(workspace_root, platform, safe_name + ".cpp")
            if not os.path.exists(cpp_file):
                import shutil
                try:
                    shutil.rmtree(problem_dir)
                    for v in window.views():
                        v_file = v.file_name()
                        if v_file and v_file.startswith(problem_dir):
                            v.set_scratch(True)
                            v.close()
                        elif v.name() == ("CPBuddy Results: " + safe_name):
                            v.set_scratch(True)
                            v.close()
                        elif v_file == cpp_file:
                            v.set_scratch(True)
                            v.close()
                except Exception as e:
                    pass

def poll_router():
    global is_stopping
    last_sync = 0
    while not is_stopping:
        try:
            curr = time.time()
            if curr - last_sync > 3:
                check_deleted_problems()
                last_sync = curr
                
            req = urllib.request.Request("http://127.0.0.1:27121/api/poll")
            with urllib.request.urlopen(req, timeout=35) as response:
                data = json.loads(response.read().decode())
                if data.get("status") == "event":
                    handle_event(data)
        except urllib.error.URLError as e:
            time.sleep(2)
        except Exception as e:
            time.sleep(2)

def handle_event(data):
    event = data.get("event")
    payload = data.get("payload")
    if event == "batchAvailable":
        sublime.set_timeout(lambda: create_problem_view(payload))

def create_problem_view(payload):
    try:
        problems = payload.get("problems", [])
        if not problems:
            return
        problem = problems[0]
        window = sublime.active_window()
        if not window:
            windows = sublime.windows()
            if windows:
                window = windows[0]
            else:
                print("CPBuddy: No active window to render problem")
                return
        # 1. Determine workspace root
        folders = window.folders()
        if not folders:
            sublime.message_dialog("CPBuddy: Please open a folder in Sublime Text first to save problems!")
            return
        workspace_root = folders[0]
        
        # 2. Extract Platform and Problem Name
        import re
        group = problem.get("group", "Unknown Platform")
        platform = group.split(" - ")[0].strip()
        name = problem.get("name", "Unknown Problem").strip()
        safe_name = re.sub(r'[^a-zA-Z0-9]+', '_', name).strip('_')
        
        # 3. Create directory structure for the source file
        platform_dir = os.path.join(workspace_root, platform)
        os.makedirs(platform_dir, exist_ok=True)
        
        cpp_file = os.path.join(platform_dir, "{}.cpp".format(safe_name))
        if not os.path.exists(cpp_file):
            header = "// Problem Name: {}\n// Problem URL: {}\n\n".format(name, problem.get("url", ""))
            template_path = os.path.join(workspace_root, "template.cpp")
            
            final_content = ""
            if os.path.exists(template_path):
                try:
                    with open(template_path, "r", encoding="utf-8") as tf:
                        template_content = tf.read()
                    
                    time_limit_ms = str(problem.get("timeLimit", 0))
                    memory_limit_mb = str(problem.get("memoryLimit", 0))
                    
                    template_content = template_content.replace("${title}", name)
                    template_content = template_content.replace("${timeLimit}", time_limit_ms)
                    template_content = template_content.replace("${memoryLimit}", memory_limit_mb)
                    template_content = template_content.replace("${url}", problem.get("url", ""))
                    
                    final_content = header + template_content
                except Exception as e:
                    final_content = header + "#include <iostream>\n\nusing namespace std;\n\nint main() {\n    return 0;\n}\n"
            else:
                final_content = header + "#include <iostream>\n\nusing namespace std;\n\nint main() {\n    return 0;\n}\n"
                
            with open(cpp_file, "w", encoding="utf-8") as f:
                f.write(final_content)

        # 4. Generate VS Code compatible JSON payload
        testcases = {}
        testcase_order = []
        
        cpbuddy_dir = os.path.join(workspace_root, ".cpbuddy", platform, safe_name)
        os.makedirs(cpbuddy_dir, exist_ok=True)
        
        for i, test in enumerate(problem.get("tests", [])):
            test_id = uuid.uuid4().hex
            testcase_order.append(test_id)
            testcases[test_id] = {
                "stdin": {"data": test.get("input", "")},
                "answer": {"data": test.get("output", "")},
                "isExpand": True,
                "isDisabled": False,
                "result": None
            }
            
            # Create physical files for Sublime Text local testing in .cpbuddy dir
            in_file_path = os.path.join(cpbuddy_dir, "test{}.in".format(i+1))
            ans_file_path = os.path.join(cpbuddy_dir, "test{}.ans".format(i+1))
            with open(in_file_path, "w", encoding="utf-8") as f:
                f.write(test.get("input", ""))
            with open(ans_file_path, "w", encoding="utf-8") as f:
                f.write(test.get("output", ""))

        payload_json = {
            "version": "1.0.0",
            "name": name,
            "url": problem.get("url", ""),
            "testcases": testcases,
            "testcaseOrder": testcase_order,
            "src": {
                "path": cpp_file,
                "hash": ""
            },
            "checker": None,
            "interactor": None,
            "stressTest": {
                "generator": None,
                "bruteForce": None,
                "cnt": 100,
                "state": "idle"
            },
            "timeElapsedMs": 0,
            "overrides": {
                "memoryLimitMb": None,
                "timeLimitMs": None
            }
        }
        
        # 5. Save the .bin file inside the central .cpbuddy folder
        bin_file = os.path.join(cpbuddy_dir, "{}.bin".format(safe_name))
        
        json_str = json.dumps(payload_json)
        with open(bin_file, "wb") as f:
            f.write(gzip.compress(json_str.encode("utf-8")))

        # 6. Apply Split-Pane Layout
        window.set_layout({
            "cols": [0.0, 0.7, 1.0],
            "rows": [0.0, 0.3, 0.6, 1.0],
            "cells": [
                [0, 0, 1, 3], # Group 0: Left (Code)
                [1, 0, 2, 1], # Group 1: Top-Right (Input)
                [1, 1, 2, 2], # Group 2: Middle-Right (Answer)
                [1, 2, 2, 3]  # Group 3: Bottom-Right (Results)
            ]
        })
        
        # Open Cpp file in group 0
        v_cpp = window.open_file(cpp_file)
        window.set_view_index(v_cpp, 0, 0)
        
        # Open first input in group 1
        v_in = window.open_file(os.path.join(cpbuddy_dir, "test1.in"))
        window.set_view_index(v_in, 1, 0)
        
        # Open first answer in group 2
        v_ans = window.open_file(os.path.join(cpbuddy_dir, "test1.ans"))
        window.set_view_index(v_ans, 2, 0)
        
        # Create or find Results view in group 3
        results_name = "CPBuddy Results: " + safe_name
        results_view = None
        for v in window.views():
            if v.name() == results_name:
                results_view = v
                break
        if not results_view:
            window.focus_group(3)
            results_view = window.new_file()
            results_view.set_name(results_name)
            results_view.set_scratch(True)
            results_view.assign_syntax("Packages/CPBuddy/CPBuddyOutput.sublime-syntax")
            results_view.run_command("append", {"characters": "No Output........\n"})
        window.set_view_index(results_view, 3, 0)
        
        # Focus back on code
        window.focus_group(0)
        window.focus_view(v_cpp)
    except Exception as e:
        print("CPBuddy: Error rendering problem:", e)
        sublime.message_dialog("CPBuddy Error: " + str(e))

class CpbuddyStartRouterCommand(sublime_plugin.WindowCommand):
    def run(self):
        start_router()

class CpbuddyTestcasesCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        window = self.view.window()
        if not window:
            return
        
        filepath = self.view.file_name()
        if not filepath or not filepath.endswith(".cpp"):
            sublime.message_dialog("CPBuddy: Please open a .cpp file to run testcases.")
            return
            
        self.view.run_command("save")
        
        # filepath is e.g. /path/to/workspace/Codeforces/A.cpp
        workspace_root = window.folders()[0] if window.folders() else os.path.dirname(os.path.dirname(filepath))
        platform = os.path.basename(os.path.dirname(filepath))
        filename = os.path.basename(filepath)
        safe_name = filename[:-4]
        
        cpbuddy_dir = os.path.join(workspace_root, ".cpbuddy", platform, safe_name)
        if not os.path.exists(cpbuddy_dir):
            sublime.message_dialog("CPBuddy: Test cases not found for this problem in .cpbuddy folder.")
            return
            
        binary_path = os.path.join(cpbuddy_dir, safe_name + "_exec")
        
        # Find or create CPBuddy Results view
        results_name = "CPBuddy Results: " + safe_name
        results_view = None
        for v in window.views():
            if v.name() == results_name:
                results_view = v
                break
                
        if not results_view:
            if window.num_groups() >= 4:
                window.focus_group(3)
            results_view = window.new_file()
            results_view.set_name(results_name)
            results_view.set_scratch(True)
            results_view.assign_syntax("Packages/CPBuddy/CPBuddyOutput.sublime-syntax")
            if window.num_groups() >= 4:
                window.set_view_index(results_view, 3, 0)
                window.focus_group(0) # return focus to main code
        
        # Clear previous results
        results_view.run_command("select_all")
        results_view.run_command("right_delete")
        
        def append_text(text):
            results_view.run_command("append", {"characters": text})
            results_view.show(results_view.size())
            
        def run_tests():
            try:
                # 1. Fetch proper timeLimit from .bin file
                bin_file = os.path.join(cpbuddy_dir, safe_name + ".bin")
                time_limit_ms = 2000
                if os.path.exists(bin_file):
                    try:
                        import gzip, json
                        with open(bin_file, "rb") as f:
                            data = json.loads(gzip.decompress(f.read()).decode("utf-8"))
                            time_limit_ms = data.get("timeLimit", 2000)
                    except:
                        pass
                
                raw_outputs = []
                summary_lines = []

                # Compile silently
                compile_proc = subprocess.Popen(
                    ["g++", "-O2", "-std=c++23", filepath, "-o", binary_path],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE
                )
                c_out, c_err = compile_proc.communicate()
                if compile_proc.returncode != 0:
                    append_text("Compilation Error: 🚨\n" + c_err.decode())
                    return
                
                # Find and run test cases
                test_idx = 1
                while True:
                    in_file = os.path.join(cpbuddy_dir, "test{}.in".format(test_idx))
                    ans_file = os.path.join(cpbuddy_dir, "test{}.ans".format(test_idx))
                    if not os.path.exists(in_file):
                        break
                        
                    try:
                        with open(in_file, "r") as f:
                            in_data = f.read()
                        
                        ans_data = ""
                        if os.path.exists(ans_file):
                            with open(ans_file, "r") as f:
                                ans_data = f.read().strip()
                            
                        start_time = time.time()
                        proc = subprocess.Popen(
                            [binary_path],
                            stdin=subprocess.PIPE,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE
                        )
                        
                        timeout_sec = time_limit_ms / 1000.0
                        out, err = proc.communicate(input=in_data.encode(), timeout=timeout_sec)
                        elapsed = (time.time() - start_time) * 1000
                        
                        out_str = out.decode().strip()
                        err_str = err.decode().strip()
                        
                        if out_str:
                            raw_outputs.append(out_str)
                        
                        if proc.returncode != 0:
                            summary_lines.append("Test {}: [RTE] 💥 Runtime Error (Exit code: {}) ({:.0f}ms)".format(test_idx, proc.returncode, elapsed))
                            if err_str:
                                summary_lines.append("  Stderr: " + err_str[:100].replace("\n", " "))
                        else:
                            if out_str == ans_data:
                                summary_lines.append("Test {}: [AC] 🎉 Accepted ({:.0f}ms)".format(test_idx, elapsed))
                            else:
                                summary_lines.append("Test {}: [WA] ❌ Wrong Answer ({:.0f}ms)".format(test_idx, elapsed))
                                summary_lines.append("  Expected: " + ans_data.replace("\n", " \\n ")[:80])
                                summary_lines.append("  Got:      " + out_str.replace("\n", " \\n ")[:80])
                    except subprocess.TimeoutExpired:
                        proc.kill()
                        summary_lines.append("Test {}: [TLE] ⏳ Time Limit Exceeded (>{}ms)".format(test_idx, time_limit_ms))
                    except Exception as e:
                        summary_lines.append("Test {}: Error running test: {}".format(test_idx, e))
                        
                    test_idx += 1
                    
                if test_idx == 1:
                    append_text("No test cases found in .cpbuddy folder.\n")
                else:
                    final_output = "\n".join(raw_outputs)
                    if final_output:
                        final_output += "\n\n"
                    final_output += "=== RESULTS ===\n"
                    final_output += "\n".join(summary_lines) + "\n"
                    append_text(final_output)
                    
            except Exception as e:
                append_text("CPBuddy Error: {}\n".format(e))
                
        threading.Thread(target=run_tests).start()

class CpbuddySubmitCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        window = self.view.window()
        if not window:
            return
            
        filepath = self.view.file_name()
        if not filepath or not filepath.endswith(".cpp"):
            sublime.message_dialog("CPBuddy: Please open a .cpp file to submit.")
            return
            
        self.view.run_command("save")
        
        workspace_root = window.folders()[0] if window.folders() else os.path.dirname(os.path.dirname(filepath))
        platform = os.path.basename(os.path.dirname(filepath))
        filename = os.path.basename(filepath)
        safe_name = filename[:-4]
        
        cpbuddy_dir = os.path.join(workspace_root, ".cpbuddy", platform, safe_name)
        bin_file = os.path.join(cpbuddy_dir, safe_name + ".bin")
        
        if not os.path.exists(bin_file):
            sublime.message_dialog("CPBuddy: No .bin file found. Cannot determine problem URL for submission.")
            return
            
        try:
            with open(bin_file, "rb") as f:
                data = json.loads(gzip.decompress(f.read()).decode("utf-8"))
                
            problem_url = data.get("url", "")
            if not problem_url:
                sublime.message_dialog("CPBuddy: Problem URL is empty.")
                return
                
            code_content = self.view.substr(sublime.Region(0, self.view.size()))
            
            payload = {
                "url": problem_url,
                "sourceCode": code_content
            }
            
            req = urllib.request.Request("http://127.0.0.1:27121/api/submit", method="POST")
            req.add_header("Content-Type", "application/json")
            data_bytes = json.dumps(payload).encode("utf-8")
            
            def do_submit():
                try:
                    with urllib.request.urlopen(req, data=data_bytes, timeout=10) as response:
                        res = json.loads(response.read().decode())
                        if res.get("status") == "ok":
                            sublime.status_message("CPBuddy: Code submitted to browser successfully!")
                        else:
                            sublime.message_dialog("CPBuddy Submission Error: " + res.get("message", "Unknown error"))
                except Exception as e:
                    sublime.message_dialog("CPBuddy Submission Error: Could not connect to router. Is the browser extension active? " + str(e))
                    
            threading.Thread(target=do_submit).start()
        except Exception as e:
            sublime.message_dialog("CPBuddy Error: " + str(e))

class CpbuddyDeleteProblemCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        window = self.view.window()
        if not window:
            return
            
        filepath = self.view.file_name()
        if not filepath or not filepath.endswith(".cpp"):
            sublime.message_dialog("CPBuddy: Please open a problem's .cpp file to delete it.")
            return
            
        if not sublime.ok_cancel_dialog("Are you sure you want to completely delete this problem and all its testcases?"):
            return
            
        workspace_root = window.folders()[0] if window.folders() else os.path.dirname(os.path.dirname(filepath))
        platform = os.path.basename(os.path.dirname(filepath))
        filename = os.path.basename(filepath)
        safe_name = filename[:-4]
        
        cpbuddy_dir = os.path.join(workspace_root, ".cpbuddy", platform, safe_name)
        
        # 1. Close related views
        for v in window.views():
            v_file = v.file_name()
            if not v_file:
                continue
            if v_file == filepath or (os.path.exists(cpbuddy_dir) and v_file.startswith(cpbuddy_dir)):
                v.set_scratch(True) # Prevent save prompt
                v.close()
                
        # 2. Delete files
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
            if os.path.exists(cpbuddy_dir):
                import shutil
                shutil.rmtree(cpbuddy_dir)
            sublime.status_message("CPBuddy: Deleted {} and all associated testcases.".format(filename))
        except Exception as e:
            sublime.error_message("CPBuddy Error deleting files: " + str(e))

class CpbuddyEventListener(sublime_plugin.EventListener):
    def on_close(self, view):
        window = sublime.active_window()
        if not window:
            return
            
        filepath = view.file_name()
        if not filepath or not filepath.endswith(".cpp"):
            return
            
        workspace_root = window.folders()[0] if window.folders() else os.path.dirname(os.path.dirname(filepath))
        platform = os.path.basename(os.path.dirname(filepath))
        filename = os.path.basename(filepath)
        safe_name = filename[:-4]
        
        cpbuddy_dir = os.path.join(workspace_root, ".cpbuddy", platform, safe_name)
        
        if os.path.exists(cpbuddy_dir):
            for v in window.views():
                v_file = v.file_name()
                if v_file and v_file.startswith(cpbuddy_dir):
                    v.set_scratch(True)
                    v.close()
                elif v.name() == ("CPBuddy Results: " + safe_name):
                    v.set_scratch(True)
                    v.close()

    def on_window_command(self, window, command_name, args):
        if command_name in ("delete_file", "side_bar_delete", "side_bar_trash"):
            files = []
            if args:
                files.extend(args.get("files", []))
                files.extend(args.get("paths", []))
                
            if files:
                # Defer execution to let the user confirm or cancel the delete dialog
                sublime.set_timeout_async(lambda: self.cleanup_deleted_files(window, files), 1000)
        return None

    def cleanup_deleted_files(self, window, files):
        for f in files:
            if f.endswith(".cpp"):
                # If it still exists, user probably canceled the delete dialog
                if os.path.exists(f):
                    continue
                    
                workspace_root = window.folders()[0] if window.folders() else os.path.dirname(os.path.dirname(f))
                platform = os.path.basename(os.path.dirname(f))
                filename = os.path.basename(f)
                safe_name = filename[:-4]
                
                cpbuddy_dir = os.path.join(workspace_root, ".cpbuddy", platform, safe_name)
                
                if os.path.exists(cpbuddy_dir):
                    import shutil
                    try:
                        shutil.rmtree(cpbuddy_dir)
                        # Close associated views
                        for v in window.views():
                            v_file = v.file_name()
                            if v_file and v_file.startswith(cpbuddy_dir):
                                v.set_scratch(True)
                                v.close()
                            elif v.name() == ("CPBuddy Results: " + safe_name):
                                v.set_scratch(True)
                                v.close()
                    except Exception as e:
                        print("CPBuddy: Error cleaning up deleted problem:", e)

    def on_activated_async(self, view):
        window = view.window()
        if not window:
            return
            
        if window.num_groups() < 4:
            return
            
        group, index = window.get_view_index(view)
        if group < 0 or group > 3:
            return
            
        filepath = view.file_name()
        safe_name = None
        platform = None
        workspace_root = window.folders()[0] if window.folders() else None
        
        if group == 0:
            if not filepath or not filepath.endswith(".cpp"):
                return
            if not workspace_root:
                workspace_root = os.path.dirname(os.path.dirname(filepath))
            platform = os.path.basename(os.path.dirname(filepath))
            safe_name = os.path.basename(filepath)[:-4]
            
        elif group == 1 or group == 2:
            if not filepath or not (filepath.endswith(".in") or filepath.endswith(".ans")):
                return
            parts = filepath.split(os.sep)
            if len(parts) >= 4 and parts[-4] == ".cpbuddy":
                platform = parts[-3]
                safe_name = parts[-2]
                if not workspace_root:
                    workspace_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(filepath))))
            else:
                return
                
        elif group == 3:
            name = view.name()
            if not name.startswith("CPBuddy Results: "):
                return
            safe_name = name[len("CPBuddy Results: "):]
            for v in window.views():
                v_file = v.file_name()
                if v_file and v_file.endswith(os.sep + safe_name + ".cpp"):
                    platform = os.path.basename(os.path.dirname(v_file))
                    if not workspace_root:
                        workspace_root = os.path.dirname(os.path.dirname(v_file))
                    break
            if not platform:
                return
                
        if not safe_name or not platform or not workspace_root:
            return

        cpbuddy_dir = os.path.join(workspace_root, ".cpbuddy", platform, safe_name)
        cpp_file = os.path.join(workspace_root, platform, safe_name + ".cpp")
        in_file = os.path.join(cpbuddy_dir, "test1.in")
        ans_file = os.path.join(cpbuddy_dir, "test1.ans")
        results_name = "CPBuddy Results: " + safe_name
        
        is_cpp_open = False
        for v in window.views():
            if v.file_name() == cpp_file:
                is_cpp_open = True
                break
                
        if not is_cpp_open and group != 0:
            view.set_scratch(True)
            view.close()
            return
            
        active_view_0 = window.active_view_in_group(0)
        active_view_1 = window.active_view_in_group(1)
        active_view_2 = window.active_view_in_group(2)
        active_view_3 = window.active_view_in_group(3)
        
        needs_focus_return = False
                
        if group != 1 and os.path.exists(in_file):
            if not active_view_1 or active_view_1.file_name() != in_file:
                v_in = window.open_file(in_file)
                window.set_view_index(v_in, 1, 0)
                needs_focus_return = True
                
        if group != 2 and os.path.exists(ans_file):
            if not active_view_2 or active_view_2.file_name() != ans_file:
                v_ans = window.open_file(ans_file)
                window.set_view_index(v_ans, 2, 0)
                needs_focus_return = True
                
        if group != 3:
            results_view = None
            for v in window.views():
                if v.name() == results_name:
                    results_view = v
                    break
                    
            if not results_view:
                window.focus_group(3)
                results_view = window.new_file()
                results_view.set_name(results_name)
                results_view.set_scratch(True)
                results_view.assign_syntax("Packages/CPBuddy/CPBuddyOutput.sublime-syntax")
                results_view.run_command("append", {"characters": "No Output........\n"})
                window.set_view_index(results_view, 3, 0)
                needs_focus_return = True
            else:
                if not active_view_3 or active_view_3.id() != results_view.id():
                    window.focus_view(results_view)
                    window.set_view_index(results_view, 3, 0)
                    needs_focus_return = True
                    
        if needs_focus_return:
            window.focus_view(view)



class CpbuddySnippetsCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        # The user wants the native inline autocomplete menu to open when pressing the shortcut
        self.view.run_command("auto_complete")

def plugin_loaded():
    global is_stopping, polling_thread
    print("CPBuddy Loaded!")
    is_stopping = False
    start_router()
    polling_thread = threading.Thread(target=poll_router, daemon=True)
    polling_thread.start()

def plugin_unloaded():
    global is_stopping, router_process
    print("CPBuddy Unloaded!")
    is_stopping = True
    if router_process:
        router_process.terminate()
        router_process = None
