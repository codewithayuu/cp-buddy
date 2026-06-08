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

def poll_router():
    global is_stopping
    while not is_stopping:
        try:
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
        sublime.message_dialog("CPBuddy: Received problem batch!")
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
        group = problem.get("group", "Unknown Platform")
        platform = group.split(" - ")[0].strip()
        name = problem.get("name", "Unknown Problem").strip()
        safe_name = "".join(c for c in name if c.isalnum() or c in " ._-")
        
        # 3. Create directory structure for the source file
        problem_dir = os.path.join(workspace_root, platform, safe_name)
        os.makedirs(problem_dir, exist_ok=True)
        
        cpp_file = os.path.join(problem_dir, "{}.cpp".format(safe_name))
        if not os.path.exists(cpp_file):
            template = "// Problem Name: {}\\n// Problem URL: {}\\n\\n#include <iostream>\\n\\nusing namespace std;\\n\\nint main() {{\\n    return 0;\\n}}\\n".format(name, problem.get("url", ""))
            with open(cpp_file, "w", encoding="utf-8") as f:
                f.write(template)

        # 4. Generate VS Code compatible JSON payload
        testcases = {}
        testcase_order = []
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
        cpbuddy_dir = os.path.join(workspace_root, ".cpbuddy", platform, safe_name)
        os.makedirs(cpbuddy_dir, exist_ok=True)
        bin_file = os.path.join(cpbuddy_dir, "{}.bin".format(safe_name))
        
        json_str = json.dumps(payload_json)
        with open(bin_file, "wb") as f:
            f.write(gzip.compress(json_str.encode("utf-8")))

        # 6. Open the file in Sublime Text
        window.open_file(cpp_file)
    except Exception as e:
        print("CPBuddy: Error rendering problem:", e)
        sublime.message_dialog("CPBuddy Error: " + str(e))

class CpbuddyStartRouterCommand(sublime_plugin.WindowCommand):
    def run(self):
        start_router()

class CpbuddyTestcasesCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        sublime.message_dialog("CPBuddy: Running testcases...")

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
