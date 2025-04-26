// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import { Uri } from "vscode";

// ChronoLog メモの構造を定義
interface ChronoLogMemo {
  metadata: {
    topic?: string;
    time?: string;
    links?: string[];
    [key: string]: any;
  };
  content: string;
  id?: string;
  graphConnections?: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
}

// ChronoLog パーサークラス
class ChronoLogParser {
  /**
   * .clog ファイルをパースしてメモの配列を返す
   */
  static parse(text: string): ChronoLogMemo[] {
    // 改行で分割して配列に
    const lines = text.split("\n");
    const memos: ChronoLogMemo[] = [];

    let currentMemo: ChronoLogMemo = this.createEmptyMemo();
    let isCollectingContent = false;
    let lastTopic: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // メモの区切りを検出
      if ((line.trim() === "" && i > 0 && lines[i - 1].trim() === "") || line.trim() === "---") {
        if (currentMemo.content.trim() !== "" || Object.keys(currentMemo.metadata).length > 0) {
          memos.push(currentMemo);
          currentMemo = this.createEmptyMemo();
          // トピックを継承
          if (lastTopic) {
            currentMemo.metadata.topic = lastTopic;
          }
        }
        isCollectingContent = false;
        continue;
      }

      // コメント行はスキップ
      if (line.startsWith("#")) {
        continue;
      }

      // メタデータ行の処理
      if (line.startsWith("@")) {
        isCollectingContent = true;
        const metaMatch = line.match(/@(\w+):\s*(.*)/);
        if (metaMatch) {
          const [, key, value] = metaMatch;

          if (key === "link") {
            if (!currentMemo.metadata.links) {
              currentMemo.metadata.links = [];
            }
            currentMemo.metadata.links.push(value.trim());
          } else {
            currentMemo.metadata[key] = value.trim();
            // トピックは継承のために記憶
            if (key === "topic") {
              lastTopic = value.trim();
            }
          }
        }
        continue;
      }

      // 内容の収集
      if (isCollectingContent || line.trim() !== "") {
        isCollectingContent = true;

        // ID の抽出
        const idMatch = line.match(/@id:\s*(\S+)/);
        if (idMatch) {
          currentMemo.id = idMatch[1];
          // ID部分を除去したものを追加
          currentMemo.content += line.replace(/@id:\s*\S+/, "").trim() + "\n";
        } else {
          currentMemo.content += line + "\n";
        }

        // グラフ接続の検出
        const graphMatch = line.match(/\[([^\]]+)\]\s*->\s*\[([^\]]+)\](?::\s*(.+))?/);
        if (graphMatch) {
          if (!currentMemo.graphConnections) {
            currentMemo.graphConnections = [];
          }

          currentMemo.graphConnections.push({
            source: graphMatch[1],
            target: graphMatch[2],
            label: graphMatch[3] ? graphMatch[3].trim() : undefined,
          });
        }
      }
    }

    // 最後のメモを追加
    if (currentMemo.content.trim() !== "" || Object.keys(currentMemo.metadata).length > 0) {
      memos.push(currentMemo);
    }

    return memos;
  }

  /**
   * 空のメモオブジェクトを作成
   */
  private static createEmptyMemo(): ChronoLogMemo {
    return {
      metadata: {},
      content: "",
    };
  }
}

/**
 * WebView を管理するクラス
 */
class ChronoLogPreviewPanel {
  public static currentPanel: ChronoLogPreviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _document?: vscode.TextDocument;

  public static createOrShow(extensionUri: vscode.Uri, document?: vscode.TextDocument) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    // パネルが既に存在する場合は再利用
    if (ChronoLogPreviewPanel.currentPanel) {
      ChronoLogPreviewPanel.currentPanel._panel.reveal(column);
      if (document) {
        ChronoLogPreviewPanel.currentPanel.update(document);
      }
      return;
    }

    // 新しいパネルを作成
    const panel = vscode.window.createWebviewPanel(
      "chronoLogPreview",
      "ChronoLog Preview",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [Uri.joinPath(extensionUri, "media")],
      },
    );

    ChronoLogPreviewPanel.currentPanel = new ChronoLogPreviewPanel(panel, extensionUri, document);
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
      ? `ChronoLog Preview: ${path.basename(this._document.fileName)}`
      : "ChronoLog Preview";

    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChronoLog Preview</title>
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
      const memos = ChronoLogParser.parse(text);

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
      <p>有効なChronoLogコンテンツが見つかりません。</p>
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
    ChronoLogPreviewPanel.currentPanel = undefined;

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

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("ChronoLog extension is now active!");

  // Register a language for .clog files (基本的なシンタックスハイライト)
  vscode.languages.registerDocumentSemanticTokensProvider(
    { language: "chronolog", scheme: "file" },
    new (class implements vscode.DocumentSemanticTokensProvider {
      async provideDocumentSemanticTokens(document: vscode.TextDocument): Promise<vscode.SemanticTokens> {
        // 将来的にはきちんとしたトークン解析を実装する
        return new vscode.SemanticTokens(new Uint32Array(0));
      }
    })(),
    new vscode.SemanticTokensLegend(["comment", "keyword", "string", "parameter"], ["definition"]),
  );

  // .clogファイルタイプの関連付け
  vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
    if (document.fileName.endsWith(".clog")) {
      vscode.languages.setTextDocumentLanguage(document, "chronolog");
    }
  });

  // プレビューコマンドの登録
  const previewCommand = vscode.commands.registerCommand("chronolog.preview", () => {
    const activeEditor = vscode.window.activeTextEditor;

    if (activeEditor && activeEditor.document.fileName.endsWith(".clog")) {
      ChronoLogPreviewPanel.createOrShow(context.extensionUri, activeEditor.document);
    } else {
      vscode.window.showInformationMessage(
        "ChronoLog: アクティブな .clog ファイルをプレビューするには、.clog ファイルを開いてください。",
      );
    }
  });

  // ファイル保存時の処理 (プレビューの更新)
  vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
    if (document.fileName.endsWith(".clog") && ChronoLogPreviewPanel.currentPanel) {
      ChronoLogPreviewPanel.currentPanel.update(document);
    }
  });

  context.subscriptions.push(previewCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
