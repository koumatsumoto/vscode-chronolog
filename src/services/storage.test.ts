import { describe, it, beforeAll, afterAll } from "vitest";
import * as assert from "assert";
import * as path from "node:path";
import * as fs from "node:fs";
import { DataStorage } from "./storage";

describe("DataStorage", () => {
  const testDir = path.join(process.cwd(), "tmp_storage_test");

  beforeAll(async () => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(async () => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should save and read memo file", async () => {
    const fileName = "20250510T123000.clog";
    const content = [
      "---",
      "id: 20250510T123000",
      "title: テストメモ",
      "created: 20250510T123000",
      "---",
      "",
      "テスト本文",
    ].join("\n");
    await DataStorage.saveMemo(testDir, fileName, content);
    assert.ok(fs.existsSync(path.join(testDir, ".clog", "memo", fileName)), "File was not created");
    const read = await DataStorage.readMemo(testDir, fileName);
    assert.strictEqual(read, content, "File content mismatch");
    // idがファイル名と一致するか確認
    const idLine = read.split("\n").find((l) => l.startsWith("id:"));
    assert.strictEqual(idLine, "id: 20250510T123000", "id does not match file name");
  });

  it("should list latest memo files (returns content array)", async () => {
    const content1 = [
      "---",
      "id: 20250510T123000",
      "title: テストメモ",
      "created: 20250510T123000",
      "---",
      "",
      "テスト本文",
    ].join("\n");
    const content2 = [
      "---",
      "id: 20250510T123001",
      "title: テストメモ2",
      "created: 20250510T123001",
      "---",
      "",
      "テスト本文2",
    ].join("\n");
    await DataStorage.saveMemo(testDir, "20250510T123000.clog", content1);
    await DataStorage.saveMemo(testDir, "20250510T123001.clog", content2);
    const files = await DataStorage.listLatestMemoFiles(testDir, 10);
    assert.ok(Array.isArray(files), "listLatestMemoFiles did not return array");
    assert.ok(files.includes(content1), "Content of 20250510T123000.clog not found in listLatestMemoFiles");
    assert.ok(files.includes(content2), "Content of 20250510T123001.clog not found in listLatestMemoFiles");
  });

  it("should delete all memo files", async () => {
    // 2件保存
    const content1 = "---\nid: 20250510T999000\ntitle: 削除テスト1\ncreated: 20250510T999000\n---\n\ntest1";
    const content2 = "---\nid: 20250510T999001\ntitle: 削除テスト2\ncreated: 20250510T999001\n---\n\ntest2";
    await DataStorage.saveMemo(testDir, "20250510T999000.clog", content1);
    await DataStorage.saveMemo(testDir, "20250510T999001.clog", content2);
    // 削除
    await DataStorage.deleteAllMemos(testDir);
    const memoDir = path.join(testDir, ".clog", "memo");
    const files = fs.existsSync(memoDir) ? fs.readdirSync(memoDir).filter((f) => f.endsWith(".clog")) : [];
    assert.strictEqual(files.length, 0, "All memo files should be deleted");
  });
});

describe("DataStorage.initializeWorkspaceDirs", () => {
  const wsDir = path.join(process.cwd(), "tmp_workspace_init");
  const clogDir = path.join(wsDir, ".clog");
  const memoDir = path.join(clogDir, "memo");

  const logs: string[] = [];
  const DummyLogger = {
    info: (msg: string) => logs.push(`info:${msg}`),
    error: (msg: string) => logs.push(`error:${msg}`),
  };

  beforeAll(async () => {
    if (fs.existsSync(wsDir)) {
      fs.rmSync(wsDir, { recursive: true, force: true });
    }
    fs.mkdirSync(wsDir);
    logs.length = 0;
  });

  afterAll(async () => {
    if (fs.existsSync(wsDir)) {
      fs.rmSync(wsDir, { recursive: true, force: true });
    }
  });

  it("should create .clog and .clog/memo directories", async () => {
    await DataStorage.initializeWorkspaceDirs(wsDir, DummyLogger);
    assert.ok(fs.existsSync(clogDir), ".clog directory was not created");
    assert.ok(fs.existsSync(memoDir), ".clog/memo directory was not created");
    assert.ok(
      logs.some((l) => l.includes("Ensured directory:")),
      "Logger.info not called for directory creation",
    );
  });

  it("should not throw if directories already exist", async () => {
    await assert.doesNotReject(async () => {
      await DataStorage.initializeWorkspaceDirs(wsDir, DummyLogger);
    });
  });
});
