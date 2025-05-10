import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { HomePanel } from "../HomePanel/HomePanel";
import { HomePanelService } from "../HomePanel/HomePanelService";
import { HomePanelView } from "../HomePanel/HomePanelView";

suite("Chronolog Extension Test Suite", () => {
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
    const fileName = HomePanelService.saveMemo(testContent);
    // 取得
    const memoList = HomePanelService.getMemoList();
    const found = memoList.some((memo) => memo.fileName === fileName && memo.content === testContent);
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

  // HomePanelView の Webview テーマ対応テスト
  test("HomePanelView.getHtml() should use VSCode theme CSS variables", () => {
    const html = HomePanelView.getHtml();
    assert.match(html, /--vscode-editor-background/);
    assert.match(html, /--vscode-panel-background/);
    assert.match(html, /--vscode-editor-foreground/);
    assert.doesNotMatch(html, /background:\s*#fff/);
    assert.doesNotMatch(html, /background:\s*#f8f8fa/);
  });

  // HomePanelView のUIスタイル改善仕様テスト
  test("HomePanelView.getHtml() should reflect improved UI styles for textarea, button, and memo card", () => {
    const html = HomePanelView.getHtml();
    // textarea: 高さ・背景色・border-radius・color-mix
    assert.match(html, /textarea\s*{[^}]*height:\s*calc\(100% - 32px\)/s, "Textarea height not set to 50% area");
    assert.match(html, /textarea\s*{[^}]*background:\s*color-mix\(/s, "Textarea background color-mix not found");
    assert.match(html, /textarea\s*{[^}]*border-radius:\s*8px/s, "Textarea border-radius not found");
    // 保存ボタン: 右下フローティング
    assert.match(html, /\.save-btn-float\s*{[^}]*position:\s*absolute/s, "Save button not absolute positioned");
    assert.match(html, /\.save-btn-float\s*{[^}]*right:\s*12px/s, "Save button right offset not found");
    assert.match(html, /\.save-btn-float\s*{[^}]*bottom:\s*12px/s, "Save button bottom offset not found");
    // memo-card: 背景色・color-mix
    assert.match(html, /\.memo-card\s*{[^}]*background:\s*color-mix\(/s, "Memo card background color-mix not found");
    // memo-body: color-mixによる本文色
    assert.match(html, /\.memo-body\s*{[^}]*color:\s*color-mix\(/s, "Memo body color-mix not found");
  });
});
