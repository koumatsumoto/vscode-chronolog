import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ClogFormatService } from "../ClogFormat/ClogFormatService";

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
    const memoDir = path.join(rootPath, ".clog", "memo");
    // ディレクトリがなければ作成
    if (!fs.existsSync(memoDir)) {
      fs.mkdirSync(memoDir, { recursive: true });
    }
    // 日時文字列生成
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr =
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      "T" +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());

    // markdown bodyをclog形式に変換
    console.debug("[HomePanelService] saveMemo input text:", text);
    const clogContent = await ClogFormatService.convertToClogFormat(text, dateStr);
    console.debug("[HomePanelService] saveMemo generated dateStr:", dateStr);
    console.debug("[HomePanelService] saveMemo final content to write:", clogContent);

    const fileName = dateStr + ".clog";
    const filePath = path.join(memoDir, fileName);
    try {
      fs.writeFileSync(filePath, clogContent, { encoding: "utf8" });
    } catch (err) {
      console.error(`[HomePanelService] Failed to write file: ${filePath}`, err);
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
    const memoDir = path.join(rootPath, ".clog", "memo");
    let files: string[] = [];
    try {
      files = fs
        .readdirSync(memoDir)
        .filter((f) => f.endsWith(".clog"))
        .map((f) => ({
          file: f,
          fullPath: path.join(memoDir, f),
          mtime: fs.statSync(path.join(memoDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, 10)
        .map((f) => f.file);
    } catch (e) {
      files = [];
    }
    // ファイル内容を取得し、frontmatterをパースし、必要なフィールドが揃っているものだけ返す
    const memoList = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(memoDir, file);
        let content = "";
        try {
          content = fs.readFileSync(filePath, { encoding: "utf8" });
        } catch (e) {
          console.error(`[HomePanelService] Failed to read file: ${filePath}`, e);
          return null;
        }
        const { frontmatter } = ClogFormatService.parseClogFile(content);
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
