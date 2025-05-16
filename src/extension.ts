// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { HomePanel } from "./panels/HomePanel";
import { Logger } from "./services/logger";
import { DataStorage } from "./services/storage";
import { ChronologSidebarViewProvider } from "./panels/ChronologSidebarViewProvider";

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
    DataStorage.initializeWorkspaceDirs(rootPath, Logger);
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

  // Chronolog: Delete All Memos コマンド登録
  const deleteAllMemosCommand = vscode.commands.registerCommand("chronolog.deleteAllMemos", async () => {
    Logger.info("Command 'chronolog.deleteAllMemos' executed.");
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const rootPath = workspaceFolders?.[0]?.uri?.fsPath;
    if (rootPath) {
      try {
        await DataStorage.deleteAllMemos(rootPath);
        Logger.info("All memos deleted successfully.");
        vscode.window.showInformationMessage("All memos have been deleted.");
      } catch (err) {
        Logger.error("Failed to delete memos: " + err);
        vscode.window.showErrorMessage("Failed to delete memos: " + err);
      }
    } else {
      vscode.window.showErrorMessage("No workspace folder found.");
    }
  });
  context.subscriptions.push(deleteAllMemosCommand);

  // Chronolog: サイドバー WebviewViewProvider 登録
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ChronologSidebarViewProvider.viewType,
      new ChronologSidebarViewProvider(context, Logger),
    ),
  );
}

/**
 * This method is called when your extension is deactivated
 */
export function deactivate() {
  Logger.info("Chronolog extension is now deactivated.");
}
