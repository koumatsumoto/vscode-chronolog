import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

suite("Chronolog Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

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
});
