import * as vscode from "vscode";
import { Logger } from "../services/logger";

export class ChronologSidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "chronolog-sidebar-view";
  private logger: typeof Logger;

  private _view?: vscode.WebviewView;

  constructor(_context: vscode.ExtensionContext, logger: typeof Logger) {
    this.logger = logger;
    this.logger.info("ChronologSidebarViewProvider: constructor called");
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.logger.info("ChronologSidebarViewProvider: resolveWebviewView called");
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtml();
    this.logger.info("ChronologSidebarViewProvider: webview HTML set");

    // Webview からのメッセージ受信
    webviewView.webview.onDidReceiveMessage((message) => {
      this.logger.info(`ChronologSidebarViewProvider: received message from webview: ${JSON.stringify(message)}`);
      if (message.command === "openHome") {
        this.logger.info("ChronologSidebarViewProvider: executing chronolog.openHome command");
        vscode.commands.executeCommand("chronolog.openHome");
      }
      if (message.command === "deleteAllMemos") {
        this.logger.info("ChronologSidebarViewProvider: executing deleteAllMemos");
        vscode.commands.executeCommand("chronolog.deleteAllMemos");
      }
    });
  }

  public refresh() {
    if (this._view) {
      this._view.webview.html = this.getHtml();
      this.logger.info("ChronologSidebarViewProvider: webview refreshed");
    }
  }

  private getHtml(): string {
    this.logger.info("ChronologSidebarViewProvider: getHtml called");
    const timestamp = new Date().toLocaleString();
    // シンプルなボタンUI＋描画時刻
    return /* html */ `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
        <style>
          body {
            margin: 0;
            padding: 16px;
            font-family: var(--vscode-font-family);
            background: var(--vscode-sideBar-background);
            color: var(--vscode-sideBar-foreground);
          }
          button {
            width: 100%;
            padding: 12px;
            font-size: 1.1em;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background: var(--vscode-button-hoverBackground);
          }
          .timestamp {
            margin-top: 24px;
            font-size: 10px;
            color: #888;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <button id="openHomeBtn">Open Home</button>
        <button id="deleteAllBtn" style="margin-top: 12px; background: #d32f2f; color: var(--vscode-button-foreground);">
          Delete All Memos
        </button>
        <div class="timestamp">rendered: ${timestamp}</div>
        <script>
          document.getElementById('openHomeBtn').addEventListener('click', () => {
            window.acquireVsCodeApi().postMessage({ command: 'openHome' });
          });
          document.getElementById('deleteAllBtn').addEventListener('click', () => {
            window.acquireVsCodeApi().postMessage({ command: 'deleteAllMemos' });
          });
        </script>
      </body>
      </html>
    `;
  }
}
