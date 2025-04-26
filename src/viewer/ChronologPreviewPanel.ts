import * as vscode from "vscode";
import * as path from "path";
import { Uri } from "vscode";
import { ChronologParser } from "../parser/ChronologParser";

/**
 * WebView を管理するクラス
 */
export class ChronologPreviewPanel {
  public static currentPanel: ChronologPreviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _document?: vscode.TextDocument;

  public static createOrShow(extensionUri: vscode.Uri, document?: vscode.TextDocument) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    // パネルが既に存在する場合は再利用
    if (ChronologPreviewPanel.currentPanel) {
      ChronologPreviewPanel.currentPanel._panel.reveal(column);
      if (document) {
        ChronologPreviewPanel.currentPanel.update(document);
      }
      return;
    }

    // 新しいパネルを作成
    const panel = vscode.window.createWebviewPanel(
      "chronologPreview",
      "Chronolog Preview",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [Uri.joinPath(extensionUri, "media")],
      },
    );

    ChronologPreviewPanel.currentPanel = new ChronologPreviewPanel(panel, extensionUri, document);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, document?: vscode.TextDocument) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._document = document;

    // パネルを初期化
    this._update();

    // パネルが破棄されたときのイベントハンドラ
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // パネルが表示されたときに更新
    this._panel.onDidChangeViewState(
      (e) => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables,
    );

    // Webview内のメッセージを処理
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables,
    );
  }

  public update(document: vscode.TextDocument) {
    this._document = document;
    this._update();
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = this._document
      ? `Chronolog Preview: ${path.basename(this._document.fileName)}`
      : "Chronolog Preview";

    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chronolog Preview</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 0;
      margin: 0;
      color: var(--vscode-editor-foreground);
      background-color: var(--vscode-editor-background);
    }
    .timeline {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .memo {
      border-left: 2px solid var(--vscode-activityBar-activeBorder);
      padding-left: 12px;
      margin-bottom: 20px;
      position: relative;
    }
    .memo::before {
      content: '';
      background: var(--vscode-activityBar-activeBorder);
      width: 12px;
      height: 12px;
      border-radius: 50%;
      position: absolute;
      left: -7px;
      top: 0;
    }
    .memo-header {
      margin-bottom: 8px;
      border-bottom: 1px solid var(--vscode-editorWidget-border);
      padding-bottom: 4px;
    }
    .memo-topic {
      font-weight: bold;
      color: var(--vscode-symbolIcon-classForeground);
    }
    .memo-time {
      color: var(--vscode-descriptionForeground);
      font-size: 0.9em;
    }
    .memo-links a {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      display: block;
      margin-top: 4px;
    }
    .memo-content {
      white-space: pre-wrap;
      line-height: 1.5;
    }
    .memo-graph {
      margin-top: 10px;
      font-style: italic;
      color: var(--vscode-editorHint-foreground);
    }
    .no-content {
      text-align: center;
      margin-top: 50px;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  <div class="timeline">`;

    if (this._document) {
      const text = this._document.getText();
      const memos = ChronologParser.parse(text);

      if (memos.length > 0) {
        for (const memo of memos) {
          html += `
    <div class="memo">
      <div class="memo-header">`;

          if (memo.metadata.topic) {
            html += `
        <div class="memo-topic">${this._escapeHtml(memo.metadata.topic)}</div>`;
          }

          if (memo.metadata.time) {
            html += `
        <div class="memo-time">${this._escapeHtml(memo.metadata.time)}</div>`;
          }

          if (memo.metadata.links && memo.metadata.links.length > 0) {
            html += `
        <div class="memo-links">`;
            for (const link of memo.metadata.links) {
              html += `
          <a href="${this._escapeHtml(link.replace(/\[([^\]]+)\]\(([^)]+)\)/, "$2"))}">${this._escapeHtml(link.replace(/\[([^\]]+)\]\(([^)]+)\)/, "$1"))}</a>`;
            }
            html += `
        </div>`;
          }

          html += `
      </div>
      <div class="memo-content">${this._escapeHtml(memo.content)}</div>`;

          if (memo.graphConnections && memo.graphConnections.length > 0) {
            html += `
      <div class="memo-graph">`;
            for (const conn of memo.graphConnections) {
              html += `
        <div>[${this._escapeHtml(conn.source)}] → [${this._escapeHtml(conn.target)}]${conn.label ? ": " + this._escapeHtml(conn.label) : ""}</div>`;
            }
            html += `
      </div>`;
          }

          html += `
    </div>`;
        }
      } else {
        html += `
    <div class="no-content">
      <p>有効なChronologコンテンツが見つかりません。</p>
      <p>メモを作成するには、メタデータ (@topic:, @time: など) を記述し、その後にコンテンツを記述してください。</p>
    </div>`;
      }
    } else {
      html += `
    <div class="no-content">
      <p>.clogファイルを開いて、そのプレビューを表示します。</p>
    </div>`;
    }

    html += `
  </div>
</body>
</html>`;

    return html;
  }

  private _escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  public dispose() {
    ChronologPreviewPanel.currentPanel = undefined;

    // パネル破棄
    this._panel.dispose();

    // リソース解放
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
