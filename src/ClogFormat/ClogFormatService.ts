import * as yaml from "yaml";
import * as crypto from "crypto";

/**
 * clogファイル形式を扱うサービス
 */
export class ClogFormatService {
  /**
   * clogファイルをパースしてfrontmatterとbodyを返す
   * @param content clogファイルの内容
   * @returns { frontmatter: any, body: string }
   */
  static parseClogFile(content: string): { frontmatter: any; body: string } {
    try {
      // --- 区切りで分割
      const parts = content.split(/^---\s*$/m).filter((s) => s.trim() !== "");
      if (parts.length < 2) {
        console.warn("[ClogFormatService] parseClogFile: no frontmatter found");
        return { frontmatter: {}, body: content };
      }
      const frontmatter = yaml.parse(parts[0] || "");
      // bodyは2番目以降（空行を除外）
      const body = parts
        .slice(1)
        .join("---")
        .replace(/^\s*\n/, "");
      console.debug("[ClogFormatService] Parsed frontmatter:", frontmatter);
      return { frontmatter, body };
    } catch (err) {
      console.error("[ClogFormatService] parseClogFile error:", err);
      return { frontmatter: {}, body: content };
    }
  }

  /**
   * clogファイルのbodyからh1以降のテキスト（description）を抽出
   * @param markdownContent
   * @returns description
   */
  static async extractDescriptionFromMarkdown(markdownContent: string): Promise<string> {
    const { unified } = await import("unified");
    const remarkParse = await import("remark-parse");
    const processor = unified().use(remarkParse.default);
    const tree = processor.parse(markdownContent);

    let foundH1 = false;
    let lines: string[] = [];
    for (const node of tree.children as any[]) {
      if (!foundH1) {
        if (node.type === "heading" && node.depth === 1) {
          foundH1 = true;
        }
        continue;
      }
      // heading以降のノードを文字列化
      if (node.type === "paragraph") {
        const text = node.children.map((child: any) => child.value || "").join("");
        lines.push(text);
      } else if (node.type === "heading" || node.type === "list") {
        // headingやリストもテキスト化
        const text = (node.children || []).map((child: any) => child.value || "").join("");
        lines.push(text);
      }
    }
    return lines.join("\n").trim();
  }

  /**
   * Markdownからタイトルを抽出する
   * @param markdownContent Markdown形式のコンテンツ
   * @returns 抽出されたタイトル（h1があればその内容、なければ最初の行）
   */
  static async extractTitleFromMarkdown(markdownContent: string): Promise<string> {
    // 空の場合はダミータイトルを返す
    if (!markdownContent || markdownContent.trim() === "") {
      return "タイトルなし";
    }

    try {
      // 動的インポート
      const { unified } = await import("unified");
      const remarkParse = await import("remark-parse");

      // h1タグを探す
      const processor = unified().use(remarkParse.default);
      const tree = processor.parse(markdownContent);

      // ASTからh1を検索
      for (const node of tree.children) {
        // 型安全のためにanyを使用
        const headingNode = node as any;
        if (
          headingNode.type === "heading" &&
          headingNode.depth === 1 &&
          headingNode.children &&
          headingNode.children.length > 0
        ) {
          // h1の最初のテキストノードを取得
          const textNode = headingNode.children.find((child: any) => child.type === "text");
          if (textNode && typeof textNode.value === "string") {
            return textNode.value;
          }
        }
      }

      // h1が見つからない場合は最初の行を返す
      const firstLine = markdownContent.split("\n")[0] || "";
      return firstLine.trim() || "タイトルなし";
    } catch (error) {
      // パース失敗時は最初の行を返す
      console.error("Markdown parsing error:", error);
      const firstLine = markdownContent.split("\n")[0] || "";
      return firstLine.trim();
    }
  }

  /**
   * Markdown本文から summary を抽出（h1以降のテキストを50文字で切り取り）
   * @param markdownContent
   * @returns summary
   */
  static async extractSummaryFromMarkdown(markdownContent: string): Promise<string> {
    try {
      const desc = await this.extractDescriptionFromMarkdown(markdownContent);
      let summary = desc.slice(0, 50);
      if (!summary) {
        // fallback: 2行目以降 or "(no content)"
        const lines = markdownContent.split(/\r?\n/).filter((l) => l.trim() !== "");
        if (lines.length > 1) {
          summary = lines.slice(1).join(" ").slice(0, 50);
        }
        if (!summary) {
          summary = "(no content)";
        }
      }
      return summary;
    } catch (err) {
      console.error("[ClogFormatService] extractSummaryFromMarkdown error:", err);
      return "(no content)";
    }
  }

  /**
   * フロントマターを生成する
   * @param title タイトル
   * @param created 作成日時（ISO8601形式の文字列 YYYYMMDDThhmmss）
   * @param summary サマリー
   * @returns YAMLフロントマター
   */
  static generateFrontmatter(title: string, created: string, summary: string): string {
    // いずれかが空ならダミー値をセット
    if (!title || !created || !summary) {
      console.warn("[ClogFormatService] generateFrontmatter: missing field(s)", { title, created, summary });
    }
    const frontmatterObj = {
      id: crypto.randomUUID(),
      title: title && title.trim() ? title : "タイトルなし",
      created: created && created.trim() ? created : "00000000T000000",
      summary: summary && summary.trim() ? summary : "(no content)",
    };

    console.debug("[ClogFormatService] generateFrontmatter:", frontmatterObj);
    return yaml.stringify(frontmatterObj);
  }

  /**
   * MarkdownコンテンツをClog形式に変換する
   * @param markdownContent Markdown形式のコンテンツ
   * @param created 作成日時（ISO8601形式の文字列 YYYYMMDDThhmmss）
   * @returns Clog形式のコンテンツ
   */
  static async convertToClogFormat(markdownContent: string, created: string): Promise<string> {
    try {
      const title = await this.extractTitleFromMarkdown(markdownContent);
      const summary = await this.extractSummaryFromMarkdown(markdownContent);
      const frontmatter = this.generateFrontmatter(title, created, summary);

      // Clog形式に組み立て
      const result = `---\n${frontmatter}---\n\n${markdownContent}`;
      console.debug("[ClogFormatService] convertToClogFormat result:", result);
      return result;
    } catch (err) {
      console.error("[ClogFormatService] convertToClogFormat error:", err);
      // フォールバック: プレーンテキスト
      return markdownContent;
    }
  }
}
