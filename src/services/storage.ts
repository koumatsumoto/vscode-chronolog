import { promises as fs } from "node:fs";
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
   * .clog/memo ディレクトリのパスを取得
   */
  private static getMemoDir(rootPath: string): string {
    return path.join(rootPath, ".clog", "memo");
  }

  /**
   * .clog/memo ディレクトリを作成（存在しなければ）
   */
  private static async ensureMemoDir(rootPath: string): Promise<void> {
    const memoDir = this.getMemoDir(rootPath);
    try {
      await fs.mkdir(memoDir, { recursive: true });
    } catch (err) {
      // 既に存在している場合は無視
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
        throw err;
      }
    }
  }

  /**
   * ワークスペースの .clog/.clog/memo ディレクトリを初期化
   * @param rootPath ワークスペースルートパス
   * @param logger Loggerインスタンス (info, error メソッドを持つ)
   */
  static async initializeWorkspaceDirs(
    rootPath: string,
    logger: { info: (msg: string) => void; error: (msg: string) => void },
  ): Promise<void> {
    try {
      await this.ensureMemoDir(rootPath);
      logger.info(`Ensured directory: ${this.getMemoDir(rootPath)}`);
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
  static async saveMemo(rootPath: string, fileName: string, content: string): Promise<void> {
    await this.ensureMemoDir(rootPath);
    const filePath = path.join(this.getMemoDir(rootPath), fileName);
    await fs.writeFile(filePath, content, { encoding: "utf8" });
  }

  /**
   * メモファイルの内容を取得する
   * @param rootPath ワークスペースルートパス
   * @param fileName ファイル名
   * @returns ファイル内容
   */
  static async readMemo(rootPath: string, fileName: string): Promise<string> {
    const filePath = path.join(this.getMemoDir(rootPath), fileName);
    return await fs.readFile(filePath, { encoding: "utf8" });
  }

  /**
   * 最新のメモファイル内容リストを取得する
   * @param rootPath ワークスペースルートパス
   * @param limit 取得件数（デフォルト10件）
   * @returns ファイル内容配列（新しい順）
   */
  static async listLatestMemoFiles(rootPath: string, limit: number = 10): Promise<string[]> {
    const memoDir = this.getMemoDir(rootPath);
    try {
      const files = (await fs.readdir(memoDir))
        .filter((f) => f.endsWith(".clog"))
        .sort((a, b) => b.localeCompare(a))
        .slice(0, limit);

      const contents = await Promise.all(
        files.map((file) => fs.readFile(path.join(memoDir, file), { encoding: "utf8" })),
      );
      return contents;
    } catch (err) {
      // ディレクトリが存在しない場合など
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw err;
    }
  }
}
