#!/usr/bin/env python3
import os
import glob
import re
import xml.etree.ElementTree as ET

SNIPPET_DIRS = [
    "/home/ayu/.config/sublime-text/Packages/User/CP-Templates",
    "/home/ayu/.config/sublime-text/Packages/User/MySnippets",
    "/home/ayu/.config/sublime-text/Packages/CPBuddy/snippets",
]

def clean_snippet_code(content):
    if not content:
        return ""
    # Strip CDATA if present as text
    content = content.replace("<![CDATA[", "").replace("]]>", "")
    # Clean Sublime placeholder syntax like ${1:default} -> default or ${1} -> ""
    # But preserve template syntax like template <typename T>
    content = re.sub(r'\$\{(\d+):([^}]+)\}', r'\2', content)
    content = re.sub(r'\$\{\d+\}', '', content)
    content = re.sub(r'\$\d+', '', content)
    return content.strip()

def parse_sublime_snippet(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            raw = f.read()

        content_match = re.search(r'<content><!\[CDATA\[([\s\S]*?)\]\]></content>', raw)
        if not content_match:
            content_match = re.search(r'<content>([\s\S]*?)</content>', raw)
        
        content = content_match.group(1) if content_match else ""
        
        trigger_match = re.search(r'<tabTrigger>([\s\S]*?)</tabTrigger>', raw)
        trigger = trigger_match.group(1).strip() if trigger_match else ""

        desc_match = re.search(r'<description>([\s\S]*?)</description>', raw)
        desc = desc_match.group(1).strip() if desc_match else ""

        if not trigger:
            base = os.path.splitext(os.path.basename(filepath))[0]
            trigger = base.lower().replace("-", "_").replace(" ", "_")

        if not desc:
            desc = os.path.splitext(os.path.basename(filepath))[0].replace("_", " ")

        cleaned_code = clean_snippet_code(content)
        if not cleaned_code:
            return None

        return {
            "trigger": trigger,
            "desc": desc,
            "code": cleaned_code,
            "file": os.path.basename(filepath)
        }
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return None

def main():
    snippets = []
    seen_triggers = set()

    for sdir in SNIPPET_DIRS:
        if not os.path.exists(sdir):
            continue
        for fpath in glob.glob(os.path.join(sdir, "*.sublime-snippet")):
            snip = parse_sublime_snippet(fpath)
            if snip and snip["code"]:
                snippets.append(snip)

    print(f"Loaded {len(snippets)} Sublime snippets.")

    out_lua = "/home/ayu/Projects/CPBuddy/packages/neovim-ext/lua/cpbuddy/sublime_snippets.lua"
    with open(out_lua, "w", encoding="utf-8") as f:
        f.write("-- Auto-imported Sublime Text CP Snippets Library\n")
        f.write("-- Generated from Sublime Text Packages (CP-Templates, MySnippets, CPBuddy)\n\n")
        f.write("local M = {}\n\n")
        f.write("M.snippets = {\n")
        for s in snippets:
            trigger = s["trigger"].replace("\\", "\\\\").replace('"', '\\"')
            desc = s["desc"].replace("\\", "\\\\").replace('"', '\\"')
            # Escape Lua multiline bracket string
            code = s["code"]
            f.write(f'    ["{trigger}"] = {{\n')
            f.write(f'        word = "{trigger}",\n')
            f.write(f'        menu = "⚡ [Snippet] {desc}",\n')
            f.write(f'        info = "{desc}",\n')
            f.write(f'        kind = "Snippet",\n')
            f.write(f'        code = [==[{code}]==],\n')
            f.write('    },\n')
            # Also register lowercase trigger if different
            if trigger.lower() != trigger:
                t_lower = trigger.lower()
                f.write(f'    ["{t_lower}"] = {{\n')
                f.write(f'        word = "{t_lower}",\n')
                f.write(f'        menu = "⚡ [Snippet] {desc}",\n')
                f.write(f'        info = "{desc}",\n')
                f.write(f'        kind = "Snippet",\n')
                f.write(f'        code = [==[{code}]==],\n')
                f.write('    },\n')
        f.write("}\n\n")
        f.write("return M\n")

    print(f"Wrote snippets to {out_lua}")

if __name__ == "__main__":
    main()
