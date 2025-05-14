import * as fs from "node:fs";
import * as path from "node:path";

/**
 * DataStorage クラス
 *
 * 利用側はフォルダ名やファイル構造を意識せず、メモ一覧取得やメモ保存などのデータ操作を行うことができる。
 * 具体的には「最新10件のメモファイル一覧(string[])を取得」「メモを保存」などのAPIを提供する。
 * データの物理配置やファイル操作の詳細はこのクラスが隠蔽する。
 */
export class DataStorage {
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
      if (!fs.existsSync(clogDir)) {
        fs.mkdirSync(clogDir);
        logger.info(`Created directory: ${clogDir}`);
      }
      if (!fs.existsSync(memoDir)) {
        fs.mkdirSync(memoDir);
        logger.info(`Created directory: ${memoDir}`);
      }
    } catch (err) {
      logger.error(`Failed to initialize workspace directories: ${err}`);
    }
  }

  /**
   * メモを保存する
   * @param rootPath ワークスペースルートパス
   * @param fileName 保存するファイル名（例: 20240514T220000.clog）
   * @param content 保存内容
   */
  static saveMemo(rootPath: string, fileName: string, content: string) {
    const memoDir = path.join(rootPath, ".clog", "memo");
    if (!fs.existsSync(memoDir)) {
      fs.mkdirSync(memoDir, { recursive: true });
    }
    const filePath = path.join(memoDir, fileName);
    fs.writeFileSync(filePath, content, { encoding: "utf8" });
  }

  /**
   * メモファイルの内容を取得する
   * @param rootPath ワークスペースルートパス
   * @param fileName ファイル名
   * @returns ファイル内容
   */
  static readMemo(rootPath: string, fileName: string): string {
    const memoDir = path.join(rootPath, ".clog", "memo");
    const filePath = path.join(memoDir, fileName);
    return fs.readFileSync(filePath, { encoding: "utf8" });
  }

  /**
   * 最新のメモファイル名リストを取得する
   * @param rootPath ワークスペースルートパス
   * @param limit 取得件数（デフォルト10件）
   * @returns ファイル名配列（新しい順）
   */
  static listLatestMemoFiles(rootPath: string, limit: number = 10): string[] {
    const memoDir = path.join(rootPath, ".clog", "memo");
    if (!fs.existsSync(memoDir)) {
      return [];
    }
    let files = fs.readdirSync(memoDir);
    files = files.filter((f) => f.endsWith(".clog"));
    files = files.sort((a, b) => b.localeCompare(a)).slice(0, limit);
    return files;
  }
}
