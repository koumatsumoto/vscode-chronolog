import { describe, it, beforeAll, afterAll } from "vitest";
// Storage クラスの単体テスト
import * as assert from "assert";
import * as path from "node:path";
import * as fs from "node:fs";
import { DataStorage } from "./storage";

describe("DataStorage", () => {
  const testDir = path.join(process.cwd(), "tmp_storage_test");

  beforeAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });

      describe("DataStorage.initializeWorkspaceDirs", () => {
        const wsDir = path.join(process.cwd(), "tmp_workspace_init");
        const clogDir = path.join(wsDir, ".clog");
        const memoDir = path.join(clogDir, "memo");

        const logs: string[] = [];
        const DummyLogger = {
          info: (msg: string) => logs.push(`info:${msg}`),
          error: (msg: string) => logs.push(`error:${msg}`),
        };

        beforeAll(() => {
          if (fs.existsSync(wsDir)) {
            fs.rmSync(wsDir, { recursive: true, force: true });
          }
          fs.mkdirSync(wsDir);
          logs.length = 0;
        });

        afterAll(() => {
          if (fs.existsSync(wsDir)) {
            fs.rmSync(wsDir, { recursive: true, force: true });
          }
        });

        it("should create .clog and .clog/memo directories", () => {
          DataStorage.initializeWorkspaceDirs(wsDir, DummyLogger);
          assert.ok(fs.existsSync(clogDir), ".clog directory was not created");
          assert.ok(fs.existsSync(memoDir), ".clog/memo directory was not created");
          assert.ok(
            logs.some((l) => l.includes("Created directory:")),
            "Logger.info not called for directory creation",
          );
        });

        it("should not throw if directories already exist", () => {
          // 2回目呼び出しで例外が出ないこと
          assert.doesNotThrow(() => {
            DataStorage.initializeWorkspaceDirs(wsDir, DummyLogger);
          });
        });
      });
    }
  });

  it("should save and read memo file", () => {
    const content = "hello storage";
    DataStorage.saveMemo(testDir, "test.clog", content);
    assert.ok(fs.existsSync(path.join(testDir, ".clog", "memo", "test.clog")), "File was not created");
    const read = DataStorage.readMemo(testDir, "test.clog");
    assert.strictEqual(read, content, "File content mismatch");
  });

  it("should list latest memo files", () => {
    const files = DataStorage.listLatestMemoFiles(testDir, 10);
    assert.ok(Array.isArray(files), "listLatestMemoFiles did not return array");
    assert.ok(files.includes("test.clog"), "test.clog not found in listLatestMemoFiles");
  });
});
