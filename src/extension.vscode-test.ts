import * as assert from "assert";
import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";

import { HomePanel } from "./panels/HomePanel";
import { HomePanelService } from "./panels/HomePanelService";
import { HomePanelView } from "./panels/HomePanelView";
import { Logger } from "./services/logger";

suite("Chronolog Extension VSCode-Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("HomePanel class should be defined", () => {
    assert.ok(HomePanel, "HomePanel is not defined");
  });

  // 追加: HomePanelService.saveMemo→getMemoListの即時反映テスト
  test("HomePanelService.saveMemo should immediately reflect in getMemoList", async function () {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const [firstWorkspace] = workspaceFolders ?? [];
    if (!firstWorkspace) {
      this.skip();
    }
    const rootPath = firstWorkspace.uri.fsPath;
    const memoDir = path.join(rootPath, ".clog", "memo");
    const testContent = "Chronolog integration test memo";
    // 保存
    const fileName = await HomePanelService.saveMemo(testContent);
    // 取得
    const memoList = await HomePanelService.getMemoList();
    const found = memoList.some((memo: any) => memo.fileName === fileName && typeof memo.summary === "string");
    assert.ok(found, "Saved memo was not found in getMemoList immediately");
    // 後始末
    const testFile = path.join(memoDir, fileName);
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  test(".clog/memo directory should exist in workspace root", async function () {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const [firstWorkspace] = workspaceFolders ?? [];
    if (!firstWorkspace) {
      this.skip();
    }
    const rootPath = firstWorkspace.uri.fsPath;
    const memoDir = path.join(rootPath, ".clog", "memo");
    assert.ok(fs.existsSync(memoDir), ".clog/memo directory does not exist");
  });

  // 追加: メモファイル保存テスト（ダミーで書き込み・内容検証・削除）
  test("Should save a memo file in .clog/memo", async function () {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const [firstWorkspace] = workspaceFolders ?? [];
    if (!firstWorkspace) {
      this.skip();
    }
    const rootPath = firstWorkspace.uri.fsPath;
    const memoDir = path.join(rootPath, ".clog", "memo");
    const testContent = "Chronolog test memo";
    const testFile = path.join(memoDir, "testmemo.clog");
    fs.writeFileSync(testFile, testContent, { encoding: "utf8" });
    assert.ok(fs.existsSync(testFile), "Memo file was not created");
    const readContent = fs.readFileSync(testFile, { encoding: "utf8" });
    assert.strictEqual(readContent, testContent, "Memo file content mismatch");
    fs.unlinkSync(testFile);
  });

  // 追加: getMemoListはファイル名降順で最大10件返すことを検証
  test("HomePanelService.getMemoList should return up to 10 memos in descending filename order", async function () {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const [firstWorkspace] = workspaceFolders ?? [];
    if (!firstWorkspace) {
      this.skip();
    }
    const rootPath = firstWorkspace.uri.fsPath;
    const memoDir = path.join(rootPath, ".clog", "memo");
    // 11個のダミーファイルをISO8601形式で作成
    const base = "2099-01-01T00:00:00";
    const files: string[] = [];
    for (let i = 0; i < 11; i++) {
      const date = new Date(Date.parse(base) + i * 60000); // 1分ずつずらす
      const iso = date.toISOString().replace(/:/g, "-").slice(0, 16);
      const fname = `${iso}.clog`;
      const fpath = path.join(memoDir, fname);
      const content = `---\ncreated: ${iso}\ntitle: test${i}\nsummary: sum${i}\n---\nbody${i}`;
      fs.writeFileSync(fpath, content, { encoding: "utf8" });
      files.push(fname);
    }
    // 並び替え期待値
    const expected = [...files].sort((a, b) => b.localeCompare(a)).slice(0, 10);
    const memoList = await HomePanelService.getMemoList();
    const actual = memoList.map((m) => m.fileName);
    assert.deepStrictEqual(actual, expected, "getMemoList did not return 10 newest memos in filename-desc order");
    // 後始末
    for (const file of files) {
      const filePath = path.join(memoDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  // HomePanelView の Webview テーマ対応テスト
  test("HomePanelView.getHtml() should use VSCode theme CSS variables", () => {
    const html = HomePanelView.getHtml();
    assert.match(html, /--vscode-editor-background/);
    assert.match(html, /--vscode-panel-background/);
    assert.match(html, /--vscode-editor-foreground/);
    assert.doesNotMatch(html, /background:\s*#fff/);
    assert.doesNotMatch(html, /background:\s*#f8f8fa/);
  });

  // HomePanelView の Ctrl+Enter保存機能テスト
  test("HomePanelView.getHtml() should implement Ctrl+Enter save on textarea", () => {
    const html = HomePanelView.getHtml();
    assert.match(
      html,
      /textarea\.addEventListener\('keydown',\s*\(e\)\s*=>\s*{[^}]*e\.ctrlKey[^}]*e\.key\s*===\s*['"]Enter['"]/s,
      "Ctrl+Enterによる保存イベントが実装されていない",
    );
  });

  // activationEvents テスト
  test("activationEvents should contain onCommand:chronolog.openHome", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    assert.ok(
      Array.isArray(pkg.activationEvents) && pkg.activationEvents.includes("onCommand:chronolog.openHome"),
      "activationEvents does not contain onCommand:chronolog.openHome",
    );
  });

  // Chronolog サイドバーの contributes.views 設定テスト
  test("Chronolog sidebar should be contributed as a custom view", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    const views = pkg.contributes?.views?.["chronolog-sidebar"];
    assert.ok(Array.isArray(views), "chronolog-sidebar views is not defined");
    const chronologView = views.find((v: any) => v.id === "chronolog-sidebar-view");
    assert.ok(chronologView, "chronolog-sidebar-view is not defined");
    assert.strictEqual(chronologView.name, "Chronolog", "chronolog-sidebar-view name should be 'Chronolog'");
  });

  // Logger のログ出力テスト
  test("Logger should output logs to OutputChannel", () => {
    const logs: string[] = [];
    const mockOutputChannel = {
      appendLine: (msg: string) => logs.push(msg),
    } as any;

    Logger.initialize(mockOutputChannel);

    Logger.info("info message");
    Logger.warn("warn message");
    Logger.error("error message");
    Logger.debug("debug message");
    Logger.trace("trace message");
    Logger.log("log message");

    assert.deepStrictEqual(
      logs,
      [
        "INFO: info message",
        "WARN: warn message",
        "ERROR: error message",
        "DEBUG: debug message",
        "TRACE: trace message",
        "LOG: log message",
      ],
      "Logger output mismatch",
    );
  });
});
