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
    const content = "hello storage";
    await DataStorage.saveMemo(testDir, "test.clog", content);
    assert.ok(fs.existsSync(path.join(testDir, ".clog", "memo", "test.clog")), "File was not created");
    const read = await DataStorage.readMemo(testDir, "test.clog");
    assert.strictEqual(read, content, "File content mismatch");
  });

  it("should list latest memo files (returns content array)", async () => {
    const content = "hello storage";
    await DataStorage.saveMemo(testDir, "test2.clog", content + "2");
    const files = await DataStorage.listLatestMemoFiles(testDir, 10);
    assert.ok(Array.isArray(files), "listLatestMemoFiles did not return array");
    assert.ok(files.includes("hello storage"), "Content of test.clog not found in listLatestMemoFiles");
    assert.ok(files.includes("hello storage2"), "Content of test2.clog not found in listLatestMemoFiles");
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
