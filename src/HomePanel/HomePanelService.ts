import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export class HomePanelService {
  /**
   * メモを保存
   * @param text メモ内容
   * @returns 保存したファイル名
   * @throws Error 保存失敗時
   */
  static saveMemo(text: string): string {
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
    const fileName = dateStr + ".clog";
    const filePath = path.join(memoDir, fileName);
    fs.writeFileSync(filePath, text, { encoding: "utf8" });
    return fileName;
  }

  /**
   * メモ一覧を取得
   * @returns メモ情報配列
   */
  static getMemoList(): { fileName: string; date: string; content: string }[] {
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
    // ファイル内容を取得
    const memoList = files.map((file) => {
      const filePath = path.join(memoDir, file);
      let content = "";
      try {
        content = fs.readFileSync(filePath, { encoding: "utf8" });
      } catch (e) {
        // ignore
      }
      return {
        fileName: file,
        date: file.replace(".clog", ""),
        content,
      };
    });
    return memoList;
  }
}
