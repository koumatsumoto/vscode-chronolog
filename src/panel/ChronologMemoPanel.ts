import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Chronolog メモ入力用Webviewパネル
 */
export class ChronologMemoPanel {
  public static currentPanel: ChronologMemoPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  // @ts-ignore: _extensionUriは将来的に使用する可能性があるため残しています
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    // 既存パネルがあれば再利用
    if (ChronologMemoPanel.currentPanel) {
      ChronologMemoPanel.currentPanel._panel.reveal(column);
      return;
    }

    // 新規パネル作成
    const panel = vscode.window.createWebviewPanel("chronologMemo", "Chronolog Memo", column || vscode.ViewColumn.One, {
      enableScripts: true,
    });

    ChronologMemoPanel.currentPanel = new ChronologMemoPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // 初期HTML描画
    this._update();

    // パネル破棄時
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Webviewからのメッセージ受信
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
          case "saveMemo":
            {
              const text: string = message.text;
              // ワークスペースルート取得
              const workspaceFolders = vscode.workspace.workspaceFolders;
              const [firstWorkspace] = workspaceFolders ?? [];
              let rootPath: string | undefined = undefined;
              if (firstWorkspace) {
                rootPath = firstWorkspace.uri.fsPath;
              }
              if (!rootPath) {
                vscode.window.showErrorMessage("ワークスペースが開かれていません。");
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
                this._panel.dispose();
              } catch (err) {
                vscode.window.showErrorMessage("メモの保存に失敗しました: " + err);
              }
            }
            return;
        }
      },
      null,
      this._disposables,
    );
  }

  private _update() {
    this._panel.title = "Chronolog Memo";
    this._panel.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview() {
    // textarea＋送信ボタンUI（送信ボタンは空入力時に非活性化）
    return `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Chronolog Memo</title>
        <style>
          body { font-family: sans-serif; margin: 20px; }
          textarea { width: 100%; height: 120px; font-size: 1em; }
          button { margin-top: 10px; font-size: 1em; }
        </style>
      </head>
      <body>
        <h2>新規メモ入力</h2>
        <textarea id="memoInput" placeholder="メモ内容を入力..."></textarea><br>
        <button id="submitBtn" disabled>保存</button>
        <script>
          const textarea = document.getElementById('memoInput');
          const button = document.getElementById('submitBtn');
          textarea.addEventListener('input', () => {
            button.disabled = textarea.value.trim().length === 0;
          });
          button.addEventListener('click', () => {
            const text = textarea.value.trim();
            if (text.length > 0) {
              // VSCode拡張側に送信
              window.vscodeApi.postMessage({ command: 'saveMemo', text });
            }
          });
          // VSCode API bridge
          window.vscodeApi = acquireVsCodeApi();
        </script>
      </body>
      </html>
    `;
  }

  public dispose() {
    ChronologMemoPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) x.dispose();
    }
  }
}
