import { DataStorage } from "../services/storage";
import * as vscode from "vscode";
import { convertToClogFormat, parseClogFile } from "../core/clog";
import { formatDateTime } from "../core/datetime";

export class HomePanelService {
  /**
   * メモを保存
   * @param text メモ内容
   * @returns 保存したファイル名
   * @throws Error 保存失敗時
   */
  static async saveMemo(text: string): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const [firstWorkspace] = workspaceFolders ?? [];
    let rootPath: string | undefined = undefined;
    if (firstWorkspace) {
      rootPath = firstWorkspace.uri.fsPath;
    }
    if (!rootPath) {
      throw new Error("ワークスペースが開かれていません。");
    }
    // 日時文字列生成
    const dateStr = formatDateTime();

    // markdown bodyをclog形式に変換
    console.debug("[HomePanelService] saveMemo input text:", text);
    const clogContent = await convertToClogFormat(text, dateStr);
    console.debug("[HomePanelService] saveMemo generated dateStr:", dateStr);
    console.debug("[HomePanelService] saveMemo final content to write:", clogContent);

    const fileName = dateStr + ".clog";
    try {
      await DataStorage.saveMemo(rootPath, fileName, clogContent);
    } catch (err) {
      console.error(`[HomePanelService] Failed to write file: ${fileName}`, err);
      throw err;
    }
    return fileName;
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
