// ChronoLog メモの構造を定義
export interface ChronologMemo {
  metadata: {
    topic?: string;
    time?: string;
    links?: string[];
    [key: string]: any;
  };
  content: string;
  id?: string;
  graphConnections?: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
}

// Chronolog パーサークラス
export class ChronologParser {
  /**
   * .clog ファイルをパースしてメモの配列を返す
   */
  static parse(text: string): ChronologMemo[] {
    // 改行で分割して配列に
    const lines = text.split("\n");
    const memos: ChronologMemo[] = [];

    let currentMemo: ChronologMemo = this.createEmptyMemo();
    let isCollectingContent = false;
    let lastTopic: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // メモの区切りを検出
      if ((line.trim() === "" && i > 0 && lines[i - 1].trim() === "") || line.trim() === "---") {
        if (currentMemo.content.trim() !== "" || Object.keys(currentMemo.metadata).length > 0) {
          memos.push(currentMemo);
          currentMemo = this.createEmptyMemo();
          // トピックを継承
          if (lastTopic) {
            currentMemo.metadata.topic = lastTopic;
          }
        }
        isCollectingContent = false;
        continue;
      }

      // コメント行はスキップ
      if (line.startsWith("#")) {
        continue;
      }

      // メタデータ行の処理
      if (line.startsWith("@")) {
        isCollectingContent = true;
        const metaMatch = line.match(/@(\w+):\s*(.*)/);
        if (metaMatch) {
          const [, key, value] = metaMatch;

          if (key === "link") {
            if (!currentMemo.metadata.links) {
              currentMemo.metadata.links = [];
            }
            currentMemo.metadata.links.push(value.trim());
          } else {
            currentMemo.metadata[key] = value.trim();
            // トピックは継承のために記憶
            if (key === "topic") {
              lastTopic = value.trim();
            }
          }
        }
        continue;
      }

      // 内容の収集
      if (isCollectingContent || line.trim() !== "") {
        isCollectingContent = true;

        // ID の抽出
        const idMatch = line.match(/@id:\s*(\S+)/);
        if (idMatch) {
          currentMemo.id = idMatch[1];
          // ID部分を除去したものを追加
          currentMemo.content += line.replace(/@id:\s*\S+/, "").trim() + "\n";
        } else {
          currentMemo.content += line + "\n";
        }

        // グラフ接続の検出
        const graphMatch = line.match(/\[([^\]]+)\]\s*->\s*\[([^\]]+)\](?::\s*(.+))?/);
        if (graphMatch) {
          if (!currentMemo.graphConnections) {
            currentMemo.graphConnections = [];
          }

          currentMemo.graphConnections.push({
            source: graphMatch[1],
            target: graphMatch[2],
            label: graphMatch[3] ? graphMatch[3].trim() : undefined,
          });
        }
      }
    }

    // 最後のメモを追加
    if (currentMemo.content.trim() !== "" || Object.keys(currentMemo.metadata).length > 0) {
      memos.push(currentMemo);
    }

    return memos;
  }

  /**
   * 空のメモオブジェクトを作成
   */
  private static createEmptyMemo(): ChronologMemo {
    return {
      metadata: {},
      content: "",
    };
  }
}
