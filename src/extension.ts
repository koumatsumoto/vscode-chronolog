// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ChronologHomePanel } from "./ChronologHomePanel/ChronologHomePanel";
import * as fs from "fs";
import * as path from "path";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("Chronolog extension is now active!");

  // === Chronolog: ワークスペース初期化処理 ===
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const [firstWorkspace] = workspaceFolders ?? [];
  let rootPath: string | undefined = undefined;
  if (firstWorkspace) {
    rootPath = firstWorkspace.uri.fsPath;
    const clogDir = path.join(rootPath, ".clog");
    const memoDir = path.join(clogDir, "memo");

    // .clog フォルダ作成
    if (!fs.existsSync(clogDir)) {
      fs.mkdirSync(clogDir);
    }
    // .clog/memo フォルダ作成
    if (!fs.existsSync(memoDir)) {
      fs.mkdirSync(memoDir);
    }
  }

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

  // Chronolog: ホームパネル表示コマンド
  const openHomeCommand = vscode.commands.registerCommand("chronolog.openHome", () => {
    ChronologHomePanel.createOrShow(context.extensionUri);
  });
  context.subscriptions.push(openHomeCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
