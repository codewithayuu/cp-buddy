# Contributing to CPBuddy

Thanks for stopping by. CPBuddy started as a small project to make competitive programming easier inside VS Code, and it's grown a lot since then. If you want to help, here's how.

## What we need help with

**Make the core features more robust.** The extension works, but there's always room to improve test case handling, submission flow, error messages, edge cases, and performance. If you find something flaky or slow, dig in.

**Add support for more competitive programming platforms.** Right now we support Codeforces, AtCoder, Luogu, Hydro, LeetCode, HackerRank, and CSES for submissions, and parsing works for those plus Kattis. There are a lot more platforms out there. If you use one that isn't supported, adding it helps everyone.

**Sublime Text and Neovim support.** The extension was built for VS Code, but there's a rough Sublime Text package already in the repo. It needs work. Neovim support doesn't exist yet. If you use either editor and want CPBuddy there, that would be a big deal.

## How to contribute

- Open an issue first if you're planning something bigger than a bug fix. Saves everyone time.
- Fork the repo, make your changes, and open a pull request.
- Keep it simple. Don't over-engineer. If a 10-line change works, don't make it 50.
- The project uses TypeScript, React, and pnpm workspaces. Stick to those.

## Code style

- Biome handles formatting. Run `pnpm format` before committing.
- No trailing commas where they aren't needed. Keep it readable.
- Tests are appreciated but not required for every change.

## Questions

Open a discussion or issue on GitHub. We don't bite.
