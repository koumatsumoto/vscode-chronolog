import { ChronologParser, ChronologMemo } from "../parser/ChronologParser";
import * as vscode from "vscode";

/**
 * ChronoLogプレビュー用のHTML生成機能を提供するユーティリティ
 */
export class HtmlGenerator {
  /**
   * Webview用のHTMLを生成する純粋関数
   * @param document 表示対象のドキュメント（省略可）
   * @returns 生成されたHTML
   */
  static generateHtml(document?: vscode.TextDocument): string {
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

    if (document) {
      const text = document.getText();
      const memos = ChronologParser.parse(text);

      if (memos.length > 0) {
        for (const memo of memos) {
          html += HtmlGenerator.renderMemo(memo);
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

  /**
   * 単一のメモをHTMLとしてレンダリング
   * @param memo レンダリング対象のメモ
   * @returns 生成されたHTML
   */
  private static renderMemo(memo: ChronologMemo): string {
    let memoHtml = `
    <div class="memo">
      <div class="memo-header">`;

    if (memo.metadata.topic) {
      memoHtml += `
        <div class="memo-topic">${HtmlGenerator.escapeHtml(memo.metadata.topic)}</div>`;
    }

    if (memo.metadata.time) {
      memoHtml += `
        <div class="memo-time">${HtmlGenerator.escapeHtml(memo.metadata.time)}</div>`;
    }

    if (memo.metadata.links && memo.metadata.links.length > 0) {
      memoHtml += `
        <div class="memo-links">`;
      for (const link of memo.metadata.links) {
        memoHtml += `
          <a href="${HtmlGenerator.escapeHtml(link.replace(/\[([^\]]+)\]\(([^)]+)\)/, "$2"))}">${HtmlGenerator.escapeHtml(link.replace(/\[([^\]]+)\]\(([^)]+)\)/, "$1"))}</a>`;
      }
      memoHtml += `
        </div>`;
    }

    memoHtml += `
      </div>
      <div class="memo-content">${HtmlGenerator.escapeHtml(memo.content)}</div>`;

    if (memo.graphConnections && memo.graphConnections.length > 0) {
      memoHtml += `
      <div class="memo-graph">`;
      for (const conn of memo.graphConnections) {
        memoHtml += `
        <div>[${HtmlGenerator.escapeHtml(conn.source)}] → [${HtmlGenerator.escapeHtml(conn.target)}]${conn.label ? ": " + HtmlGenerator.escapeHtml(conn.label) : ""}</div>`;
      }
      memoHtml += `
      </div>`;
    }

    memoHtml += `
    </div>`;

    return memoHtml;
  }

  /**
   * HTMLエスケープ処理
   * @param text エスケープ対象テキスト
   * @returns エスケープされたテキスト
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
