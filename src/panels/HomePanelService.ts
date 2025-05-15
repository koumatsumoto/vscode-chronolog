import { DataStorage } from "../services/storage";
import * as vscode from "vscode";
import {
  convertToClogFormat,
  parseClogFile,
  extractTitleFromMarkdown,
  extractSummaryFromMarkdown,
  generateFrontmatter,
} from "../core/clog";
import { formatDateTime } from "../core/datetime";

export class HomePanelService {
  /**
   * メモを保存
   * @param text メモ内容
   * @returns 保存したファイル名
   * @throws Error 保存失敗時
   */
  static async saveMemo(text: string, id?: string, optRootPath?: string): Promise<string> {
    let rootPath: string | undefined = optRootPath;
    if (!rootPath) {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const [firstWorkspace] = workspaceFolders ?? [];
      if (firstWorkspace) {
        rootPath = firstWorkspace.uri.fsPath;
      }
    }
    if (!rootPath) {
      throw new Error("ワークスペースが開かれていません。");
    }

    // 新規保存
    if (!id) {
      const dateStr = formatDateTime();
      const clogContent = await convertToClogFormat(text, dateStr, dateStr);
      const fileName = dateStr + ".clog";
      try {
        await DataStorage.saveMemo(rootPath, fileName, clogContent);
      } catch (err) {
        console.error(`[HomePanelService] Failed to write file: ${fileName}`, err);
        throw err;
      }
      return fileName;
    }

    // 既存メモ更新: frontmatter再利用、bodyのみ差し替え
    const fileName = id + ".clog";
    let frontmatter: any = {};
    let created = id;
    try {
      const oldContent = await DataStorage.readMemo(rootPath, fileName);
      const { frontmatter: oldFm } = parseClogFile(oldContent);
      frontmatter = oldFm || {};
      created = frontmatter.created || id;
    } catch (e) {
      // ファイルがない場合は新規扱い
      frontmatter = {};
      created = id;
    }
    // タイトル・サマリーは新しい内容から再抽出
    const title = await extractTitleFromMarkdown(text);
    const summary = await extractSummaryFromMarkdown(text);
    const newFrontmatter = generateFrontmatter(id, title, created, summary);
    const newContent = `---\n${newFrontmatter}---\n\n${text}`;
    try {
      await DataStorage.saveMemo(rootPath, fileName, newContent);
    } catch (err) {
      console.error(`[HomePanelService] Failed to write file: ${fileName}`, err);
      throw err;
    }
    return fileName;
  }

  /**
   * メモIDから内容を取得
   * @param id メモID（日時形式）
   * @returns メモ内容
   */
  static async getMemoById(id: string, optRootPath?: string): Promise<{ content: string }> {
    let rootPath: string | undefined = optRootPath;
    if (!rootPath) {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const [firstWorkspace] = workspaceFolders ?? [];
      if (firstWorkspace) {
        rootPath = firstWorkspace.uri.fsPath;
      }
    }
    if (!rootPath) {
      throw new Error("ワークスペースが開かれていません。");
    }
    const fileName = id + ".clog";
    try {
      const fileContent = await DataStorage.readMemo(rootPath, fileName);
      const { body } = parseClogFile(fileContent);
      return { content: body };
    } catch (err) {
      console.error(`[HomePanelService] Failed to load memo: ${fileName}`, err);
      throw err;
    }
  }

  /**
   * メモ一覧を取得
   * @returns メモ情報配列
   */
  static async getMemoList(): Promise<{ fileName: string; datetime: string; title: string; summary: string }[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const [firstWorkspace] = workspaceFolders ?? [];
    let rootPath: string | undefined = undefined;
    if (firstWorkspace) {
      rootPath = firstWorkspace.uri.fsPath;
    }
    if (!rootPath) {
      return [];
    }
    let contents: string[] = [];
    try {
      contents = await DataStorage.listLatestMemoFiles(rootPath, 10);
    } catch (e) {
      contents = [];
    }
    // ファイル内容からfrontmatterをパースし、必要なフィールドが揃っているものだけ返す
    const memoList = contents
      .map((content) => {
        const { frontmatter } = parseClogFile(content);
        if (
          !frontmatter ||
          typeof frontmatter.created !== "string" ||
          typeof frontmatter.title !== "string" ||
          typeof frontmatter.summary !== "string" ||
          !frontmatter.created ||
          !frontmatter.title ||
          !frontmatter.summary
        ) {
          console.warn(`[HomePanelService] Skipping memo due to invalid frontmatter:`, frontmatter);
          return null;
        }
        console.debug(
          `[HomePanelService] Parsed memo: created=${frontmatter.created} title=${frontmatter.title} summary=${frontmatter.summary}`,
        );
        return {
          fileName: "", // ファイル名は取得できないため空文字
          datetime: frontmatter.created,
          title: frontmatter.title,
          summary: frontmatter.summary,
        };
      })
      .filter((m) => m !== null) as {
      fileName: string;
      datetime: string;
      title: string;
      summary: string;
    }[];
    return memoList;
  }
}
