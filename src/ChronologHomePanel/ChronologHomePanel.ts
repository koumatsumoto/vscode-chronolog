// ChronologHomePanel.ts
import * as vscode from "vscode";
import { ChronologHomePanelView } from "./ChronologHomePanelView";
import { ChronologHomePanelService } from "./ChronologHomePanelService";

/**
 * Chronolog メモ入力用Webviewパネル（ChronologHomePanel）
 * Controller: WebView管理
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
            this._sendMemoListToWebview();
            return;
          case "saveMemo":
            {
              const text: string = message.text;
              try {
                const fileName = ChronologHomePanelService.saveMemo(text);
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

  /**
   * .clog/memo配下のメモファイル一覧を取得しWebviewに送信
   */
  private _sendMemoListToWebview() {
    const memoList = ChronologHomePanelService.getMemoList();
    this._panel.webview.postMessage({ command: "memoList", data: memoList });
  }

  private _update() {
    this._panel.title = "Chronolog Home";
    this._panel.webview.html = ChronologHomePanelView.getHtml();
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
