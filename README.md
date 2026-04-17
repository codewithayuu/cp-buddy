<div align="center">

<!-- Logo -->
<h1>🏆 CPBuddy</h1>

<p align="center">
  <b>The Ultimate Competitive Programming Assistant for VS Code</b>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=AyushSharma.cpbuddy">
    <img src="https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="VS Code Extension">
  </a>
  <a href="https://chrome.google.com/webstore/detail/cpbuddy-submit">
    <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Extension">
  </a>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/cpbuddy/">
    <img src="https://img.shields.io/badge/Firefox-Add--on-FF7139?style=for-the-badge&logo=firefox-browser&logoColor=white" alt="Firefox Add-on">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React">
</p>

<!-- Animated Divider -->
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">

</div>

## 🚀 What is CPBuddy?

**CPBuddy** is a next-generation VS Code extension that transforms your editor into a powerful competitive programming IDE. Parse problems from any online judge, run test cases instantly, and submit solutions directly from VS Code — all in one seamless workflow.

<!-- Screenshot placeholder - add your own screenshot here -->
<!-- <div align="center">
<img src="./docs/screenshot.png" alt="CPBuddy Screenshot" width="800">
</div> -->

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Core Features
- ⚡ **Instant Problem Parsing** via Competitive Companion
- 🧪 **Run Test Cases** with live output comparison
- 📤 **One-Click Submission** to Codeforces, Kattis, AtCoder
- 🎨 **Modern Webview UI** with dark/light theme support
- 🔁 **Real-time Sync** via WebSocket (no more polling!)

</td>
<td width="50%">

### 🛠️ Advanced Tools
- 🔍 **Diff Viewer** - Side-by-side expected vs received
- 🎲 **Stress Testing** - Brute force vs optimized comparison
- 📋 **Test Case Import/Export** - JSON, text, clipboard
- 📝 **Code Templates** - Custom snippets per language
- 📊 **Submission Tracking** - Live verdict monitoring

</td>
</tr>
</table>

## 📦 Installation

### VS Code Extension

<div align="center">

<a href="https://marketplace.visualstudio.com/items?itemName=DivyanshuAgrawal.competitive-programming-helper">
<img src="https://img.shields.io/badge/Install%20CPBuddy-VS%20Code%20Marketplace-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white" width="400">
</a>

</div>

```bash
# Or install via command line
code --install-extension AyushSharma.cpbuddy
```

### Browser Extensions (Required for Submission)

<div align="center">
<table>
<tr>
<td align="center" width="50%">

<a href="https://chrome.google.com/webstore/detail/cpbuddy-submit">
<img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg" width="64" height="64" alt="Chrome Logo">
<br><br>
<img src="https://img.shields.io/badge/Get%20CPBuddy-Chrome%20Web%20Store-4285F4?style=flat-square&logo=google-chrome&logoColor=white" width="200">
</a>

</td>
<td align="center" width="50%">

<a href="https://addons.mozilla.org/en-US/firefox/addon/cpbuddy/">
<img src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" width="64" height="64" alt="Firefox Logo">
<br><br>
<img src="https://img.shields.io/badge/Get%20CPBuddy-Firefox%20Add--ons-FF7139?style=flat-square&logo=firefox-browser&logoColor=white" width="200">
</a>

</td>
</tr>
</table>
</div>

### Competitive Companion (Required for Problem Parsing)

<a href="https://github.com/jmerle/competitive-companion">
<img src="https://img.shields.io/badge/Install-Competitive%20Companion-2C3E50?style=flat-square&logo=github&logoColor=white" width="250">
</a>

## 🎬 Quick Start

```
1. Install VS Code extension + Browser extension + Competitive Companion
2. Open a problem on Codeforces/AtCoder/Kattis
3. Click the Competitive Companion icon in your browser
4. The problem opens in VS Code with test cases
5. Write your solution and click ▶️ Run All
6. Click 📤 Submit when ready!
```

## 🖥️ Supported Platforms

<div align="center">

| Platform | Parse | Run | Submit | Verdict |
|:--------:|:-----:|:---:|:------:|:-------:|
| <img src="https://sta.codeforces.com/s/139/images/codeforces-logo-with-telegram.png" width="20"> Codeforces | ✅ | ✅ | ✅ | ✅ |
| <img src="https://open.kattis.com/images/favicon-32x32.png" width="20"> Kattis | ✅ | ✅ | ✅ | ⚠️ |
| <img src="https://img.atcoder.jp/assets/atcoder.png" width="20"> AtCoder | ✅ | ✅ | 🚧 | 🚧 |
| <img src="https://leetcode.com/favicon.ico" width="20"> LeetCode | ✅ | ✅ | 🚧 | 🚧 |
| <img src="https://cses.fi/favicon.ico" width="20"> CSES | ✅ | ✅ | 🚧 | 🚧 |

</div>

## 🛠️ Supported Languages

<div align="center">

| Language | Compile | Run | Debug Flags |
|:--------:|:-------:|:---:|:-----------:|
| C++ | ✅ | ✅ | `-DDEBUG -DCPH -DONLINE_JUDGE` |
| C | ✅ | ✅ | `-DDEBUG -DCPH -DONLINE_JUDGE` |
| Python | 🚀 | ✅ | N/A |
| Java | ✅ | ✅ | `-DDEBUG -DCPH -DONLINE_JUDGE` |
| Rust | ✅ | ✅ | N/A |
| Go | ✅ | ✅ | N/A |
| JavaScript | 🚀 | ✅ | N/A |
| TypeScript | 🚀 | ✅ | N/A |
| Ruby | 🚀 | ✅ | N/A |
| Haskell | ✅ | ✅ | N/A |
| C# | ✅ | ✅ | `/p:DefineConstants` |
| Cangjie | ✅ | ✅ | N/A |

</div>

> 🚀 = Interpreted (no compilation needed)

## 📂 Project Structure

```
cp-buddy/
├── 📁 cpbuddy/                      # VS Code Extension
│   ├── 📁 src/
│   │   ├── 📁 services/             # Core services
│   │   │   ├── WebSocketService.ts   # Real-time browser comm
│   │   │   ├── SubmissionService.ts # Multi-platform submit
│   │   │   ├── TemplateService.ts   # Code snippets
│   │   │   ├── StressTestService.ts # Brute vs optimized
│   │   │   ├── DiffViewService.ts   # Output comparison
│   │   │   ├── TestIOService.ts     # Import/export
│   │   │   ├── EventBus.ts          # Event system
│   │   │   └── Logger.ts            # VS Code output channel
│   │   ├── 📁 webview/frontend/
│   │   │   └── 📁 components/       # React UI components
│   │   ├── languageConfig.ts        # Data-driven languages
│   │   └── validation/schemas.ts   # Zod validation
│   └── package.json
│
└── 📁 cpbuddy-browser/              # Browser Extension
    ├── 📁 src/
    │   ├── handleSubmit.ts          # Submission handler
    │   ├── injectedScript.ts        # DOM manipulation
    │   └── backgroundScript.ts      # WebSocket client
    └── manifest.json
```

## 🎨 Architecture

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│   VS Code       │ ◄─────────────────► │  Browser Ext     │
│   Extension     │    (Port 27122)     │  (Chrome/Firefox)│
│                 │                     │                  │
│  ┌───────────┐ │                     │  ┌────────────┐  │
│  │ WebSocket │ │                     │  │  Content   │  │
│  │  Service  │ │                     │  │   Script   │  │
│  └───────────┘ │                     │  └────────────┘  │
│       ▲        │                     │         │        │
│       │        │                     │         ▼        │
│  ┌───────────┐ │                     │  ┌────────────┐  │
│  │  Problem  │ │                     │  │   DOM      │  │
│  │  Manager  │ │                     │  │ Injection  │  │
│  └───────────┘ │                     │  └────────────┘  │
└─────────────────┘                     └──────────────────┘
         │                                       │
         ▼                                       ▼
┌─────────────────┐                     ┌──────────────────┐
│  HTTP Server    │ ◄────────────────── │  Codeforces/     │
│  (Port 27121)   │   Competitive      │  Kattis/AtCoder  │
│                 │   Companion        │                  │
└─────────────────┘                     └──────────────────┘
```

## 🔧 Configuration

### VS Code Settings

```json
{
  "cph.general.defaultLanguage": "cpp",
  "cph.general.timeOut": 3000,
  "cph.language.cpp.Command": "g++",
  "cph.language.cpp.Args": "-std=c++17 -O2",
  "cph.language.python.Command": "python3"
}
```

### Custom Templates

Create your own code templates with variables:

```cpp
// ${PROBLEM_NAME} - ${PROBLEM_URL}
// ${DATE}

#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int t;
    cin >> t;
    while (t--) {
        // Your code here
    }
    
    return 0;
}
```

## 🧪 Development

### Prerequisites

- Node.js 18+
- VS Code 1.85+
- Chrome/Edge (for browser extension testing)

### Setup

```bash
# Clone repository
git clone https://github.com/codewithayuu/cp-buddy.git
cd cp-buddy

# Install dependencies
npm install

# Build VS Code extension
npm run compile

# Build browser extension
cd ../cp-buddy-submit && npm run build

# Run tests
npm test
```

### Debug Mode

```bash
# Open VS Code in debug mode
code --extensionDevelopmentPath=${PWD}/cp-buddy
```

## 📊 Roadmap

- [x] WebSocket communication
- [x] Stress testing
- [x] Diff viewer
- [x] Test import/export
- [x] Code templates
- [ ] Contest mode with timer
- [ ] Interactive problems
- [ ] AI-powered hints
- [ ] Statistics dashboard

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

<div align="center">

<a href="https://github.com/codewithayuu/cp-buddy/issues">
<img src="https://img.shields.io/badge/Report%20Issue-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" width="180">
</a>

<a href="https://github.com/codewithayuu/cp-buddy/pulls">
<img src="https://img.shields.io/badge/Submit%20PR-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" width="180">
</a>

</div>

##  License

This project is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0).

<div align="center">
<img src="https://img.shields.io/badge/License-AGPL%203.0-blue.svg?style=for-the-badge" width="150">
</div>

## 🙏 Acknowledgments

- [Competitive Companion](https://github.com/jmerle/competitive-companion) - Problem parsing
- [VS Code](https://code.visualstudio.com/) - Amazing editor platform
- [React](https://react.dev/) - UI framework
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - Real-time communication

---

<div align="center">

**Made with ❤️ by iambatman**

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=AyushSharma.cpbuddy">VS Code</a> •
  <a href="https://chrome.google.com/webstore/detail/cpbuddy-submit">Chrome</a> •
  <a href="https://addons.mozilla.org/en-US/firefox/addon/cpbuddy/">Firefox</a> •
  <a href="https://github.com/codewithayuu/cp-buddy">GitHub</a>
</p>

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer">

</div>

