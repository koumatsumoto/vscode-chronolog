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
      DataStorage.saveMemo(rootPath, fileName, clogContent);
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
    let files: string[] = [];
    try {
      files = DataStorage.listLatestMemoFiles(rootPath, 10);
    } catch (e) {
      files = [];
    }
    // ファイル内容を取得し、frontmatterをパースし、必要なフィールドが揃っているものだけ返す
    const memoList = await Promise.all(
      files.map(async (file) => {
        let content = "";
        try {
          content = DataStorage.readMemo(rootPath, file);
        } catch (e) {
          console.error(`[HomePanelService] Failed to read file: ${file}`, e);
          return null;
        }
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
          console.warn(
            `[HomePanelService] Skipping file due to invalid frontmatter: ${file} frontmatter=`,
            frontmatter,
          );
          return null;
        }
        console.debug(
          `[HomePanelService] Parsed memo: file=${file} created=${frontmatter.created} title=${frontmatter.title} summary=${frontmatter.summary}`,
        );
        return {
          fileName: file,
          datetime: frontmatter.created,
          title: frontmatter.title,
          summary: frontmatter.summary,
        };
      }),
    );
    // nullを除外
    return memoList.filter((m) => m !== null) as {
      fileName: string;
      datetime: string;
      title: string;
      summary: string;
    }[];
  }
}
