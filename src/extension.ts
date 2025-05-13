// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { HomePanel } from "./HomePanel/HomePanel";
import * as fs from "node:fs";
import * as path from "node:path";
import { Logger } from "./Logger/Logger";

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 */
export function activate(context: vscode.ExtensionContext) {
  // OutputChannel の生成と Logger 初期化
  const outputChannel = vscode.window.createOutputChannel("Chronolog");
  Logger.initialize(outputChannel);
  Logger.info("Chronolog extension is now active!");

  // === Chronolog: ワークスペース初期化処理 ===
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const [firstWorkspace] = workspaceFolders ?? [];
  let rootPath: string | undefined = undefined;
  if (firstWorkspace) {
    rootPath = firstWorkspace.uri.fsPath;
    const clogDir = path.join(rootPath, ".clog");
    const memoDir = path.join(clogDir, "memo");

    try {
      // .clog フォルダ作成
      if (!fs.existsSync(clogDir)) {
        fs.mkdirSync(clogDir);
        Logger.info(`Created directory: ${clogDir}`);
      }
      // .clog/memo フォルダ作成
      if (!fs.existsSync(memoDir)) {
        fs.mkdirSync(memoDir);
        Logger.info(`Created directory: ${memoDir}`);
      }
    } catch (err) {
      Logger.error(`Failed to initialize workspace directories: ${err}`);
    }
  } else {
    Logger.warn("No workspace folder found. .clog directory was not created.");
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
  Logger.info("Registered semantic tokens provider for chronolog language.");

  // .clogファイルタイプの関連付け
  vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
    if (document.fileName.endsWith(".clog")) {
      vscode.languages.setTextDocumentLanguage(document, "chronolog");
      Logger.debug(`Set language mode to 'chronolog' for: ${document.fileName}`);
    }
  });

  // Chronolog: ホームパネル表示コマンド
  const openHomeCommand = vscode.commands.registerCommand("chronolog.openHome", () => {
    Logger.info("Command 'chronolog.openHome' executed.");
    HomePanel.createOrShow(context.extensionUri);
  });
  context.subscriptions.push(openHomeCommand);
}

/**
 * This method is called when your extension is deactivated
 */
export function deactivate() {
  Logger.info("Chronolog extension is now deactivated.");
}
