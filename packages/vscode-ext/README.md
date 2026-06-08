# CPBuddy VS Code Extension

> Quickly compile, run and judge competitive programming problems in VSCode.
> Automatically download testcases, or write & test your own problems.

This is the next generation of the
[Competitive Programming Helper](https://github.com/agrawal-d/cph).

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=AyushJha.cpbuddy">
    <img src="https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="VS Code Extension">
  </a>
  <a href="https://github.com/codewithayuu/cp-buddy">
    <img src="https://img.shields.io/badge/GitHub-Repo-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
</p>

## Screenshots

<p align="center">
  <img src="https://raw.githubusercontent.com/codewithayuu/cp-buddy/main/screenshots/Screenshot_20260608_191114.png" alt="CPBuddy Sidebar" width="600">
  <br><br>
  <img src="https://raw.githubusercontent.com/codewithayuu/cp-buddy/main/screenshots/Screenshot_20260608_191129.png" alt="CPBuddy Test Cases" width="600">
  <br><br>
  <img src="https://raw.githubusercontent.com/codewithayuu/cp-buddy/main/screenshots/Screenshot_20260608_191138.png" alt="CPBuddy Webview" width="600">
</p>

## Installation

### VS Code Extension

<a href="https://marketplace.visualstudio.com/items?itemName=AyushJha.cpbuddy">
  <img src="https://img.shields.io/badge/Install%20from%20VS%20Code%20Marketplace-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white" width="400">
</a>

Or install via command line:

```bash
code --install-extension AyushJha.cpbuddy
```

### Browser Extensions (Required for Submission)

CPBuddy Submit lets you submit solutions directly from VS Code to online judges.

| Chrome | Firefox |
|--------|---------|
| <a href="https://chrome.google.com/webstore/detail/cpbuddy-submit"><img src="https://img.shields.io/badge/Get%20CPBuddy-Chrome%20Web%20Store-4285F4?style=flat-square&logo=google-chrome&logoColor=white" width="200"></a> | <a href="https://addons.mozilla.org/en-US/firefox/addon/cpbuddy/"><img src="https://img.shields.io/badge/Get%20CPBuddy-Firefox%20Add--ons-FF7139?style=flat-square&logo=firefox-browser&logoColor=white" width="200"></a> |

### Competitive Companion (Required for Problem Parsing)

Install the [Competitive Companion](https://github.com/jmerle/competitive-companion) browser extension to parse problems from any online judge with one click.

## Quick Start

1. Install the VS Code extension, browser extension, and Competitive Companion
2. Open a problem on Codeforces / AtCoder / Kattis
3. Click the Competitive Companion icon in your browser
4. The problem opens in VS Code with test cases loaded
5. Write your solution and click ▶️ Run All
6. Click 📤 Submit when ready

## Features

- Automatic compilation with display for compilation errors
- Intelligent judge with support for signals, timeouts and runtime errors
- Works with Competitive Companion
- Works locally for your own problems
- Stress testing (brute force vs optimized comparison)
- Diff viewer (side-by-side expected vs received)
- Test case import / export (JSON, text, clipboard)
- Code templates with custom snippets per language
- Real-time sync via WebSocket
- Submission tracking with live verdict monitoring
- Dark / light theme support
- Support for several languages

## Comparison with CPH

| Feature                 | CPH                      | CPBuddy                   |
| ----------------------- | ------------------------ | ------------------------ |
| Automatic Compilation   | ✅                       | ✅                       |
| Intelligent Judge       | ✅                       | ✅                       |
| Competitive Companion   | ✅                       | ✅                       |
| Local Problem Support   | ✅                       | ✅                       |
| Language Support        | C/C++ and 8 others       | 12 languages             |
| Auto-submit Integration | Codeforces and Kattis    | 7+ platforms             |
| Load Local Testcases    | ❌                       | ✅                       |
| Supported Result        | Only 3                   | AC and 10 others         |
| Store Result and Time   | ❌                       | ✅                       |
| Cache compiled program  | ❌                       | ✅                       |
| SPJ and interactive     | ❌                       | ✅                       |
| Stress Test             | ❌                       | ✅                       |

## License

This project is licensed under the [GNU Affero General Public License v3.0](https://github.com/codewithayuu/cp-buddy/blob/main/LICENSE).

## Known Issues

See [GitHub Issues](https://github.com/codewithayuu/cp-buddy/issues).

## Change Log

See [CHANGELOG.md](https://github.com/codewithayuu/cp-buddy/blob/main/CHANGELOG.md).
