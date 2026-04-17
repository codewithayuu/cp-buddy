export const submitterDomains = {
  codeforces: ['codeforces.com', 'm1.codeforces.com', 'm2.codeforces.com', 'm3.codeforces.com'],
  atcoder: ['atcoder.jp'],
  luogu: ['www.luogu.com.cn'],
  hydro: ['hydro.ac'],
} as const;

export const allDomains = Object.values(submitterDomains).flat();
