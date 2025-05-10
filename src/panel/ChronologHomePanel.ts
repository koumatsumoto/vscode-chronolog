import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Chronolog メモ入力用Webviewパネル（ChronologHomePanelにリネーム）
 */
export class ChronologHomePanel {
  public static currentPanel: ChronologHomePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  // @ts-ignore: _extensionUriは将来的に使用する可能性があるため残しています
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    // 既存パネルがあれば再利用
    if (ChronologHomePanel.currentPanel) {
      ChronologHomePanel.currentPanel._panel.reveal(column);
      return;
    }

    // 新規パネル作成
    const panel = vscode.window.createWebviewPanel("chronologHome", "Chronolog Home", column || vscode.ViewColumn.One, {
      enableScripts: true,
    });

    ChronologHomePanel.currentPanel = new ChronologHomePanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // 初期HTML描画
    this._update();
    // メモ一覧はWebview側からリクエストが来たタイミングで送信する

    // パネル破棄時
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Webviewからのメッセージ受信
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
          case "requestMemoList":
            console.log("[ChronologHomePanel] requestMemoList received from Webview");
            this._sendMemoListToWebview();
            return;
          case "saveMemo":
            {
              const text: string = message.text;
              console.log("[ChronologHomePanel] saveMemo received. text:", text);
              // ワークスペースルート取得
              const workspaceFolders = vscode.workspace.workspaceFolders;
              const [firstWorkspace] = workspaceFolders ?? [];
              let rootPath: string | undefined = undefined;
              if (firstWorkspace) {
                rootPath = firstWorkspace.uri.fsPath;
              }
              if (!rootPath) {
                vscode.window.showErrorMessage("ワークスペースが開かれていません。");
                console.log("[ChronologHomePanel] No workspace root found");
                return;
              }
              const memoDir = path.join(rootPath, ".clog", "memo");
              // 日時文字列生成
              const now = new Date();
              const pad = (n: number) => n.toString().padStart(2, "0");
              const dateStr =
                now.getFullYear().toString() +
                pad(now.getMonth() + 1) +
                pad(now.getDate()) +
                "T" +
                pad(now.getHours()) +
                pad(now.getMinutes()) +
                pad(now.getSeconds());
              const fileName = dateStr + ".clog";
              const filePath = path.join(memoDir, fileName);
              try {
                fs.writeFileSync(filePath, text, { encoding: "utf8" });
                vscode.window.showInformationMessage(`メモを保存しました: ${fileName}`);
                console.log("[ChronologHomePanel] Memo saved:", filePath);
                this._panel.dispose();
              } catch (err) {
                vscode.window.showErrorMessage("メモの保存に失敗しました: " + err);
                console.log("[ChronologHomePanel] Memo save failed:", err);
              }
            }
            return;
        }
      },
      null,
      this._disposables,
    );
  }

  /**
   * .clog/memo配下のメモファイル一覧を取得しWebviewに送信
   */
  private _sendMemoListToWebview() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const [firstWorkspace] = workspaceFolders ?? [];
    let rootPath: string | undefined = undefined;
    if (firstWorkspace) {
      rootPath = firstWorkspace.uri.fsPath;
    }
    if (!rootPath) {
      console.log("[ChronologHomePanel] _sendMemoListToWebview: No workspace root found");
      this._panel.webview.postMessage({ command: "memoList", data: [] });
      return;
    }
    const memoDir = path.join(rootPath, ".clog", "memo");
    let files: string[] = [];
    try {
      files = fs
        .readdirSync(memoDir)
        .filter((f) => f.endsWith(".clog"))
        .map((f) => ({
          file: f,
          fullPath: path.join(memoDir, f),
          mtime: fs.statSync(path.join(memoDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, 10)
        .map((f) => f.file);
      console.log("[ChronologHomePanel] _sendMemoListToWebview: found files", files);
    } catch (e) {
      // ディレクトリがない場合など
      files = [];
      console.log("[ChronologHomePanel] _sendMemoListToWebview: error reading memoDir", e);
    }
    // ファイル内容を取得
    const memoList = files.map((file) => {
      const filePath = path.join(memoDir, file);
      let content = "";
      try {
        content = fs.readFileSync(filePath, { encoding: "utf8" });
      } catch (e) {
        console.log("[ChronologHomePanel] _sendMemoListToWebview: error reading file", filePath, e);
      }
      return {
        fileName: file,
        date: file.replace(".clog", ""),
        content,
      };
    });
    console.log("[ChronologHomePanel] _sendMemoListToWebview: sending memoList", memoList);
    this._panel.webview.postMessage({ command: "memoList", data: memoList });
  }

  private _update() {
    this._panel.title = "Chronolog Home";
    this._panel.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview() {
    // 2分割レイアウト＋過去メモ一覧カード表示
    return `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Chronolog Home</title>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 0; height: 100vh; box-sizing: border-box; background: #f8f8fa; }
          .container { display: flex; flex-direction: column; height: 100vh; }
          .input-area { flex: 0 0 50%; padding: 20px; background: #fff; box-shadow: 0 2px 4px #0001; z-index: 1; }
          .memo-list-area { flex: 1 1 50%; overflow-y: auto; padding: 16px 20px 20px 20px; background: #f4f6fa; }
          textarea { width: 100%; height: 120px; font-size: 1em; }
          button { margin-top: 10px; font-size: 1em; }
          .memo-card {
            background: #fff;
            box-shadow: 0 2px 8px #0002;
            border-radius: 8px;
            margin-bottom: 16px;
            padding: 12px 16px;
            width: 100%;
            min-height: 64px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
          }
          .memo-date { font-size: 0.9em; color: #888; margin-bottom: 2px; }
          .memo-title { font-weight: bold; font-size: 1.05em; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .memo-body { font-size: 1em; color: #333; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
          .memo-list-empty { color: #aaa; text-align: center; margin-top: 32px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="input-area">
            <textarea id="memoInput" placeholder="メモ内容を入力..."></textarea><br>
            <button id="submitBtn" disabled>保存</button>
          </div>
          <div class="memo-list-area" id="memoListArea">
            <div class="memo-list-empty" id="memoListEmpty">過去のメモはありません</div>
          </div>
        </div>
        <script>
          const textarea = document.getElementById('memoInput');
          const button = document.getElementById('submitBtn');
          const memoListArea = document.getElementById('memoListArea');
          const memoListEmpty = document.getElementById('memoListEmpty');
          // VSCode API bridge
          window.vscodeApi = acquireVsCodeApi();

          // 初回ロード時にメモ一覧を要求
          console.log("[Webview] postMessage: requestMemoList");
          window.vscodeApi.postMessage({ command: 'requestMemoList' });

          textarea.addEventListener('input', () => {
            button.disabled = textarea.value.trim().length === 0;
          });
          button.addEventListener('click', () => {
            const text = textarea.value.trim();
            if (text.length > 0) {
              console.log("[Webview] postMessage: saveMemo", text);
              window.vscodeApi.postMessage({ command: 'saveMemo', text });
            }
          });

          // メモ一覧描画
          window.addEventListener('message', event => {
            const msg = event.data;
            if (msg.command === 'memoList') {
              console.log("[Webview] received memoList", msg.data);
              renderMemoList(msg.data);
            }
          });

          function renderMemoList(memos) {
            memoListArea.innerHTML = '';
            if (!memos || memos.length === 0) {
              memoListEmpty.style.display = '';
              return;
            }
            memoListEmpty.style.display = 'none';
            for (const memo of memos) {
              const card = document.createElement('div');
              card.className = 'memo-card';
              // タイトル抽出（1行目をタイトル、2行目以降を本文とする）
              let title = '';
              let body = '';
              if (memo.content) {
                const lines = memo.content.split(/\\r?\\n/);
                title = lines[0] || '';
                body = lines.slice(1).join(' ').trim();
              }
              // 日時表示
              const dateStr = formatDate(memo.date);
              card.innerHTML = \`
                <div class="memo-date">\${dateStr}</div>
                <div class="memo-title">\${title}</div>
                <div class="memo-body">\${body}</div>
              \`;
              memoListArea.appendChild(card);
            }
          }

          function formatDate(dateStr) {
            // 例: 20250510T105514 → 2025/05/10 10:55:14
            if (!dateStr) return '';
            const m = dateStr.match(/(\\d{4})(\\d{2})(\\d{2})T(\\d{2})(\\d{2})(\\d{2})/);
            if (!m) return dateStr;
            return \`\${m[1]}/\${m[2]}/\${m[3]} \${m[4]}:\${m[5]}:\${m[6]}\`;
          }
        </script>
      </body>
      </html>
    `;
  }

  public dispose() {
    ChronologHomePanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
