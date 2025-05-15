import { describe, it, beforeEach, vi, expect } from "vitest";
vi.mock("vscode", () => ({
  workspace: {
    workspaceFolders: [{ uri: { fsPath: "/mock/root" } }],
  },
}));
import { HomePanelService } from "./HomePanelService";

// DataStorage, convertToClogFormat, formatDateTimeをmock
vi.mock("../services/storage", () => ({
  DataStorage: {
    saveMemo: vi.fn(),
    readMemo: vi.fn(),
  },
}));
vi.mock("../core/clog", () => ({
  convertToClogFormat: vi.fn((text, id) => `---\nid: ${id}\n---\n${text}`),
  parseClogFile: vi.fn((content) => {
    // テスト用: frontmatter/body分離
    const match = content.match(/^---[\s\S]*?---\n([\s\S]*)$/m);
    return { frontmatter: {}, body: match ? match[1] : content };
  }),
  extractTitleFromMarkdown: vi.fn(async () => "dummy title"),
  extractSummaryFromMarkdown: vi.fn(async () => "dummy summary"),
  generateFrontmatter: vi.fn(
    (id, title, created, summary) => `id: ${id}\ntitle: ${title}\ncreated: ${created}\nsummary: ${summary}\n`,
  ),
}));
vi.mock("../core/datetime", () => ({
  formatDateTime: vi.fn(() => "20991231T235959"),
}));

import { DataStorage } from "../services/storage";
import { convertToClogFormat } from "../core/clog";
import { formatDateTime } from "../core/datetime";

describe("HomePanelService.saveMemo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("新規メモ保存時は新規ID（日時形式）でDataStorage.saveMemoが呼ばれる", async () => {
    const text = "# test title\nbody";
    await HomePanelService.saveMemo(text);
    expect(formatDateTime).toHaveBeenCalled();
    expect(convertToClogFormat).toHaveBeenCalledWith(text, "20991231T235959", "20991231T235959");
    expect(DataStorage.saveMemo).toHaveBeenCalledWith(
      expect.any(String),
      "20991231T235959.clog",
      expect.stringContaining("# test title\nbody"),
    );
  });

  it("既存ID指定で保存時はそのIDでDataStorage.saveMemoが呼ばれる", async () => {
    const text = "# title1\nbody1";
    const id = "20990101T000000";
    // 既存ファイルのfrontmatterを返すようmock
    (DataStorage.readMemo as any).mockResolvedValueOnce(
      "---\nid: 20990101T000000\ncreated: 20990101T000000\n---\nold body",
    );
    await HomePanelService.saveMemo(text, id, "/mock/root");
    // convertToClogFormatは呼ばれない
    expect(convertToClogFormat).not.toHaveBeenCalled();
    expect(DataStorage.saveMemo).toHaveBeenCalledWith(
      "/mock/root",
      "20990101T000000.clog",
      expect.stringContaining("# title1\nbody1"),
    );
  });

  it("getMemoByIdでDataStorage.readMemoが呼ばれbodyのみが返る", async () => {
    (DataStorage.readMemo as any).mockResolvedValueOnce("---\nid: 20991231T235959\n---\n# test getMemoById\nbody");
    const result = await HomePanelService.getMemoById("20991231T235959", "/mock/root");
    expect(DataStorage.readMemo).toHaveBeenCalledWith("/mock/root", "20991231T235959.clog");
    expect(result.content).toBe("# test getMemoById\nbody");
    expect(result.content).not.toContain("id:");
    expect(result.content).not.toContain("summary:");
  });
});
