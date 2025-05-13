// Storage クラス: ファイル操作のユーティリティ
import * as fs from "node:fs";
import * as path from "node:path";

export class Storage {
  /**
   * ディレクトリがなければ作成
   * @param dirPath ディレクトリパス
   */
  static ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * ファイルを保存
   * @param filePath 保存先ファイルパス
   * @param content 保存内容
   */
  static saveFile(filePath: string, content: string) {
    fs.writeFileSync(filePath, content, { encoding: "utf8" });
  }

  /**
   * ファイルを読み込み
   * @param filePath ファイルパス
   * @returns ファイル内容
   */
  static readFile(filePath: string): string {
    return fs.readFileSync(filePath, { encoding: "utf8" });
  }

  /**
   * ディレクトリ内のファイル一覧取得
   * @param dirPath ディレクトリパス
   * @param ext 拡張子フィルタ（例: ".clog"）
   * @returns ファイル名配列
   */
  static listFiles(dirPath: string, ext?: string): string[] {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    let files = fs.readdirSync(dirPath);
    if (ext) {
      files = files.filter((f) => f.endsWith(ext));
    }
    return files;
  }

  /**
   * ファイルの更新日時取得
   * @param filePath ファイルパス
   * @returns 更新日時 (number, ms)
   */
  static getMTime(filePath: string): number {
    return fs.statSync(filePath).mtime.getTime();
  }

  /**
   * ワークスペースの .clog/.clog/memo ディレクトリを初期化
   * @param rootPath ワークスペースルートパス
   * @param logger Loggerインスタンス (info, error メソッドを持つ)
   */
  static initializeWorkspaceDirs(
    rootPath: string,
    logger: { info: (msg: string) => void; error: (msg: string) => void },
  ) {
    const clogDir = path.join(rootPath, ".clog");
    const memoDir = path.join(clogDir, "memo");

    try {
      // .clog フォルダ作成
      if (!fs.existsSync(clogDir)) {
        fs.mkdirSync(clogDir);
        logger.info(`Created directory: ${clogDir}`);
      }
      // .clog/memo フォルダ作成
      if (!fs.existsSync(memoDir)) {
        fs.mkdirSync(memoDir);
        logger.info(`Created directory: ${memoDir}`);
      }
    } catch (err) {
      logger.error(`Failed to initialize workspace directories: ${err}`);
    }
  }
}
