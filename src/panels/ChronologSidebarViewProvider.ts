import * as vscode from "vscode";
import { Logger } from "../services/logger";

export class ChronologSidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "chronolog-sidebar-view";
  private logger: typeof Logger;

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
    });
  }

  private getHtml(): string {
    this.logger.info("ChronologSidebarViewProvider: getHtml called");
    // シンプルなボタンUI
    return /* html */ `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8" />
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
        </style>
      </head>
      <body>
        <button id="openHomeBtn">Open Chronolog Home</button>
        <script>
          document.getElementById('openHomeBtn').addEventListener('click', () => {
            window.acquireVsCodeApi().postMessage({ command: 'openHome' });
          });
        </script>
      </body>
      </html>
    `;
  }
}
