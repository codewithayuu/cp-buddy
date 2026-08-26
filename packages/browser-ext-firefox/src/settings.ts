import { storage } from 'wxt/utils/storage';

export const enableAmoledTheme = storage.defineItem<boolean>('local:enableAmoledTheme', {
  fallback: false,
});

export const enableLeetcodeAmoledTheme = storage.defineItem<boolean>('local:enableLeetcodeAmoledTheme', {
  fallback: true,
});

export const enableLeetcodeFastIO = storage.defineItem<boolean>('local:enableLeetcodeFastIO', {
  fallback: true,
});

export const enableProblemTimer = storage.defineItem<boolean>('local:enableProblemTimer', {
  fallback: false,
});

export const hideTopicTags = storage.defineItem<boolean>('local:hideTopicTags', {
  fallback: false,
});

export const showUserHoverCard = storage.defineItem<boolean>('local:showUserHoverCard', {
  fallback: false,
});

export const showContestDate = storage.defineItem<boolean>('local:showContestDate', {
  fallback: false,
});

export const enableSpoof = storage.defineItem<boolean>('local:enableSpoof', {
  fallback: false,
});

export const enableLiveVerdict = storage.defineItem<boolean>('local:enableLiveVerdict', {
  fallback: false,
});

export const showLiveSolves = storage.defineItem<boolean>('local:showLiveSolves', {
  fallback: false,
});

export const spoofTarget = storage.defineItem<string>('local:spoofTarget', {
  fallback: 'tourist',
});

export const spoofAlias = storage.defineItem<string>('local:spoofAlias', {
  fallback: 'moasis',
});

export const customLogoData = storage.defineItem<string>('local:customLogoData', {
  fallback: '', // Base64 encoded string
});

export const customLogoType = storage.defineItem<string>('local:customLogoType', {
  fallback: '', // e.g. 'image' or 'video'
});

export const openLinksInNewTab = storage.defineItem<boolean>('local:openLinksInNewTab', {
  fallback: false,
});

export const problemRatingsData = storage.defineItem<Record<string, { rating: number, time: string }>>('local:problemRatingsData', {
  fallback: {},
});

export const enableClock = storage.defineItem<boolean>('local:enableClock', {
  fallback: true,
});

export const enableCPBuddySubmit = storage.defineItem<boolean>('local:enableCPBuddySubmit', {
  fallback: true,
});

export const showProfileAnalytics = storage.defineItem<boolean>('local:showProfileAnalytics', {
  fallback: true,
});

// God Mode Profile Spoofing
export const enableGodMode = storage.defineItem<boolean>('local:enableGodMode', {
  fallback: false,
});

export const godModeTarget = storage.defineItem<string>('local:godModeTarget', {
  fallback: '',
});

export const godModeRating = storage.defineItem<number>('local:godModeRating', {
  fallback: 3000,
});

export const godModeMaxRating = storage.defineItem<number>('local:godModeMaxRating', {
  fallback: 3200,
});

export const godModeProblems = storage.defineItem<number>('local:godModeProblems', {
  fallback: 2000,
});

export const godModeStreak = storage.defineItem<number>('local:godModeStreak', {
  fallback: 365,
});

export const godModeRegistered = storage.defineItem<string>('local:godModeRegistered', {
  fallback: '10 years',
});

export const godModeContests = storage.defineItem<number>('local:godModeContests', {
  fallback: 100,
});
