import * as yaml from "yaml";

/**
 * clogファイルをパースしてfrontmatterとbodyを返す
 * @param content clogファイルの内容
 * @returns { frontmatter: any, body: string }
 */
export function parseClogFile(content: string): { frontmatter: any; body: string } {
  try {
    const parts = content.split(/^---\s*$/m).filter((s) => s.trim() !== "");
    if (parts.length < 2) {
      console.warn("[clog] parseClogFile: no frontmatter found");
      return { frontmatter: {}, body: content };
    }
    const frontmatter = yaml.parse(parts[0] || "");
    const body = parts
      .slice(1)
      .join("---")
      .replace(/^\s*\n/, "");
    console.debug("[clog] Parsed frontmatter:", frontmatter);
    return { frontmatter, body };
  } catch (err) {
    console.error("[clog] parseClogFile error:", err);
    return { frontmatter: {}, body: content };
  }
}

/**
 * clogファイルのbodyからh1以降のテキスト（description）を抽出
 * @param markdownContent
 * @returns description
 */
export async function extractDescriptionFromMarkdown(markdownContent: string): Promise<string> {
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
    if (node.type === "paragraph") {
      const text = node.children.map((child: any) => child.value || "").join("");
      lines.push(text);
    } else if (node.type === "heading" || node.type === "list") {
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
export async function extractTitleFromMarkdown(markdownContent: string): Promise<string> {
  if (!markdownContent || markdownContent.trim() === "") {
    return "タイトルなし";
  }

  try {
    const { unified } = await import("unified");
    const remarkParse = await import("remark-parse");
    const processor = unified().use(remarkParse.default);
    const tree = processor.parse(markdownContent);

    for (const node of tree.children) {
      const headingNode = node as any;
      if (
        headingNode.type === "heading" &&
        headingNode.depth === 1 &&
        headingNode.children &&
        headingNode.children.length > 0
      ) {
        const textNode = headingNode.children.find((child: any) => child.type === "text");
        if (textNode && typeof textNode.value === "string") {
          return textNode.value;
        }
      }
    }

    const firstLine = markdownContent.split("\n")[0] || "";
    return firstLine.trim() || "タイトルなし";
  } catch (error) {
    console.error("[clog] Markdown parsing error:", error);
    const firstLine = markdownContent.split("\n")[0] || "";
    return firstLine.trim();
  }
}

/**
 * Markdown本文から summary を抽出（h1以降のテキストを50文字で切り取り）
 * @param markdownContent
 * @returns summary
 */
export async function extractSummaryFromMarkdown(markdownContent: string): Promise<string> {
  try {
    const desc = await extractDescriptionFromMarkdown(markdownContent);
    let summary = desc.slice(0, 50);
    if (!summary) {
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
    console.error("[clog] extractSummaryFromMarkdown error:", err);
    return "(no content)";
  }
}

/**
 * フロントマターを生成する
 * @param id ファイル名（拡張子除く、ISO8601形式の文字列）
 * @param title タイトル
 * @param created 作成日時（ISO8601形式の文字列 YYYYMMDDThhmmss）
 * @param summary サマリー
 * @returns YAMLフロントマター
 */
export function generateFrontmatter(id: string, title: string, created: string, summary: string): string {
  if (!id || !title || !created || !summary) {
    console.warn("[clog] generateFrontmatter: missing field(s)", { id, title, created, summary });
  }
  const frontmatterObj = {
    id: id && id.trim() ? id : "00000000T000000",
    title: title && title.trim() ? title : "タイトルなし",
    created: created && created.trim() ? created : "00000000T000000",
    summary: summary && summary.trim() ? summary : "(no content)",
  };

  console.debug("[clog] generateFrontmatter:", frontmatterObj);
  return yaml.stringify(frontmatterObj);
}

/**
 * MarkdownコンテンツをClog形式に変換する
 * @param markdownContent Markdown形式のコンテンツ
 * @param id ファイル名（拡張子除く、ISO8601形式の文字列）
 * @param created 作成日時（ISO8601形式の文字列 YYYYMMDDThhmmss）
 * @returns Clog形式のコンテンツ
 */
export async function convertToClogFormat(markdownContent: string, id: string, created: string): Promise<string> {
  try {
    const title = await extractTitleFromMarkdown(markdownContent);
    const summary = await extractSummaryFromMarkdown(markdownContent);
    const frontmatter = generateFrontmatter(id, title, created, summary);

    const result = `---\n${frontmatter}---\n\n${markdownContent}`;
    console.debug("[clog] convertToClogFormat result:", result);
    return result;
  } catch (err) {
    console.error("[clog] convertToClogFormat error:", err);
    return markdownContent;
  }
}
