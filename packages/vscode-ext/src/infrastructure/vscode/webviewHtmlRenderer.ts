import { inject, injectable } from 'tsyringe';
import { ColorThemeKind, env, Uri, type Webview, window } from 'vscode';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class WebviewHtmlRenderer {
  public constructor(
    @inject(TOKENS.extensionPath) private readonly extPath: string,
    @inject(TOKENS.version) private readonly version: string,
  ) {}

  public render(webview: Webview): string {
    const getUri = (filename: string) =>
      webview.asWebviewUri(Uri.joinPath(Uri.file(this.extPath), filename));

    const colorTheme = window.activeColorTheme.kind;
    const config = {
      version: this.version,
      isDark: colorTheme === ColorThemeKind.Dark || colorTheme === ColorThemeKind.HighContrast,
      partyUri: getUri('res/party.gif').toString(),
      language: env.language,
    };

    return `<!DOCTYPE html><html>
<head><link rel="stylesheet" href="${getUri('dist/styles.css')}"></head>
<body>
  <div id="root"></div>
  <script type="application/json" id="cpbuddy-config">
    ${JSON.stringify(config)}
  </script>
  <script>
    window.vscode = acquireVsCodeApi();
    const configEl = document.getElementById('cpbuddy-config');
    if (!configEl) console.error('Config element not found');
    try {
      const config = JSON.parse(configEl.textContent || '{}');
      Object.assign(window, config);
    } catch (e) {
      console.error('Failed to parse config', e);
    }
  </script>
  <script src="${getUri('dist/frontend.js')}"></script>
</body>
</html>`;
  }
}
