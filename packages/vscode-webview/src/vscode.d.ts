declare const vscode: {
  postMessage<T>(msg: T): Thenable<void>;
};

declare const version: string;
declare const isDark: boolean;
declare const partyUri: string;
declare const language: string;

interface Window {
  easterEgg?: boolean;
}
