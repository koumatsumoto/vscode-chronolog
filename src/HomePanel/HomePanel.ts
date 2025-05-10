import * as vscode from "vscode";
import { HomePanelView } from "./HomePanelView";
import { HomePanelService } from "./HomePanelService";

/**
 * メモ入力用Webviewパネル（HomePanel）
 * Controller: WebView管理
 */
export class HomePanel {
  public static currentPanel: HomePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  // @ts-ignore: _extensionUriは将来的に使用する可能性があるため残しています
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    // 既存パネルがあれば再利用
    if (HomePanel.currentPanel) {
      HomePanel.currentPanel._panel.reveal(column);
      return;
    }

    // 新規パネル作成
    const panel = vscode.window.createWebviewPanel("chronologHome", "Chronolog Home", column || vscode.ViewColumn.One, {
      enableScripts: true,
    });

    HomePanel.currentPanel = new HomePanel(panel, extensionUri);
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
                const fileName = HomePanelService.saveMemo(text);
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
    const memoList = HomePanelService.getMemoList();
    this._panel.webview.postMessage({ command: "memoList", data: memoList });
  }

  private _update() {
    this._panel.title = "Chronolog Home";
    this._panel.webview.html = HomePanelView.getHtml();
  }

  public dispose() {
    HomePanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
