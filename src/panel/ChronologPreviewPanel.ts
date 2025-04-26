import * as vscode from "vscode";
import * as path from "path";
import { Uri } from "vscode";
import { HtmlGenerator } from "./HtmlGenerator";

/**
 * WebView を管理するクラス
 */
export class ChronologPreviewPanel {
  public static currentPanel: ChronologPreviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  // @ts-ignore: _extensionUriは将来的に使用する可能性があるため残しています
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _document: vscode.TextDocument | undefined;

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
      (_e) => {
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
    this._panel.title = this._document
      ? `Chronolog Preview: ${path.basename(this._document.fileName)}`
      : "Chronolog Preview";

    this._panel.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview() {
    // HtmlGeneratorに処理を委譲
    return HtmlGenerator.generateHtml(this._document);
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
