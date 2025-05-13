import { describe, it, beforeAll, afterAll } from "vitest";
// Storage クラスの単体テスト
import * as assert from "assert";
import * as path from "node:path";
import * as fs from "node:fs";
import { Storage } from "./storage";

describe("Storage", () => {
  const testDir = path.join(process.cwd(), "tmp_storage_test");
  const testFile = path.join(testDir, "test.txt");

  beforeAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should create directory if not exists", () => {
    Storage.ensureDir(testDir);
    assert.ok(fs.existsSync(testDir), "Directory was not created");
  });

  it("should save and read file", () => {
    const content = "hello storage";
    Storage.saveFile(testFile, content);
    assert.ok(fs.existsSync(testFile), "File was not created");
    const read = Storage.readFile(testFile);
    assert.strictEqual(read, content, "File content mismatch");
  });

  it("should list files with extension", () => {
    const files = Storage.listFiles(testDir, ".txt");
    assert.ok(Array.isArray(files), "listFiles did not return array");
    assert.ok(files.includes("test.txt"), "test.txt not found in listFiles");
  });

  it("should get file mtime", () => {
    const mtime = Storage.getMTime(testFile);
    assert.strictEqual(typeof mtime, "number");
    assert.ok(mtime > 0, "mtime should be positive");
  });
});
