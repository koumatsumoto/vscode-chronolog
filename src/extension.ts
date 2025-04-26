// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ChronologPreviewPanel } from "./panel/ChronologPreviewPanel";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("Chronolog extension is now active!");

  // Register a language for .clog files (基本的なシンタックスハイライト)
  vscode.languages.registerDocumentSemanticTokensProvider(
    { language: "chronolog", scheme: "file" },
    new (class implements vscode.DocumentSemanticTokensProvider {
      async provideDocumentSemanticTokens(_document: vscode.TextDocument): Promise<vscode.SemanticTokens> {
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
      ChronologPreviewPanel.createOrShow(context.extensionUri, activeEditor.document);
    } else {
      vscode.window.showInformationMessage(
        "Chronolog: アクティブな .clog ファイルをプレビューするには、.clog ファイルを開いてください。",
      );
    }
  });

  // ファイル保存時の処理 (プレビューの更新)
  vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
    if (document.fileName.endsWith(".clog") && ChronologPreviewPanel.currentPanel) {
      ChronologPreviewPanel.currentPanel.update(document);
    }
  });

  context.subscriptions.push(previewCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
