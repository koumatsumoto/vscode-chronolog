export class HomePanelView {
  /**
   * HTML生成
   * @param params 任意のパラメータ（将来拡張用）
   */
  static getHtml(): string {
    // 2分割レイアウト＋過去メモ一覧カード表示
    return `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Chronolog Home</title>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 0; height: 100vh; box-sizing: border-box; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
          .container { display: flex; flex-direction: column; height: 100vh; }
          .input-area {
            flex: 0 0 50%;
            padding: 20px;
            background: var(--vscode-panel-background);
            box-shadow: 0 2px 4px var(--vscode-widget-shadow, #0001);
            z-index: 1;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            height: 50vh;
            min-height: 240px;
          }
          .memo-list-area {
            flex: 1 1 50%;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 16px 20px 20px 20px;
            background: var(--vscode-editor-background);
          }
          textarea {
            width: 100%;
            height: calc(100% - 32px);
            min-height: 120px;
            max-height: 100%;
            font-size: 1em;
            resize: none;
            box-sizing: border-box;
            border-radius: 8px;
            border: none;
            padding: 12px;
            background: color-mix(in srgb, var(--vscode-panel-background) 100%, #111 30%);
            color: color-mix(in srgb, var(--vscode-editor-foreground) 99%, #fff 1%);
            transition: background 0.2s;
            outline: none;
            position: relative;
          }
          textarea::placeholder {
            color: color-mix(in srgb, var(--vscode-editor-foreground) 60%, #888 40%);
            opacity: 1;
          }
          textarea:focus {
            outline: none;
            border: none;
          }
          @media (prefers-color-scheme: dark) {
            textarea {
              background: color-mix(in srgb, var(--vscode-panel-background) 100%, #fff 6%);
            }
          }
          .save-btn-float {
            position: absolute;
            right: 16px;
            bottom: 16px;
            font-size: 1em;
            padding: 8px 20px;
            border-radius: 6px;
            background: var(--vscode-button-background, #007acc);
            color: var(--vscode-button-foreground, #fff);
            border: none;
            box-shadow: 0 1px 2px var(--vscode-widget-shadow, #0001);
            cursor: pointer;
            transition: background 0.2s;
            z-index: 2;
            pointer-events: auto;
          }
          .save-btn-float:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .memo-card {
            background: color-mix(in srgb, var(--vscode-panel-background) 100%, #fff 4%);
            box-shadow: 0 2px 8px var(--vscode-widget-shadow, #0002);
            border-radius: 8px;
            margin-bottom: 16px;
            padding: 12px 12px;
            width: calc(100% - 8px);
            min-width: 0;
            min-height: 64px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
            transition: background 0.2s;
          }
          @media (prefers-color-scheme: dark) {
            .memo-card {
              background: color-mix(in srgb, var(--vscode-panel-background) 100%, #fff 4%);
            }
          }
          .memo-date {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground, #888);
            margin-bottom: 2px;
          }
          .memo-title {
            font-weight: bold;
            font-size: 1.05em;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: color-mix(in srgb, var(--vscode-editor-foreground) 60%, #888 0%);
          }
          .memo-body {
            font-size: 1em;
            color: color-mix(in srgb, var(--vscode-editor-foreground) 40%, #000 30%);
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .memo-list-empty {
            color: var(--vscode-descriptionForeground, #aaa);
            text-align: center;
            margin-top: 32px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="input-area">
            <div style="position:relative; height:100%;">
              <textarea id="memoInput" placeholder="メモ内容を入力..." style="height:100%;"></textarea>
              <button id="submitBtn" class="save-btn-float" disabled>保存</button>
            </div>
          </div>
          <div class="memo-list-area" id="memoListArea">
            <div class="memo-list-empty" id="memoListEmpty">過去のメモはありません</div>
          </div>
        </div>
        <script>
          const textarea = document.getElementById('memoInput');
          const button = document.getElementById('submitBtn');
          const memoListArea = document.getElementById('memoListArea');
          const memoListEmpty = document.getElementById('memoListEmpty');
          // VSCode API bridge
          window.vscodeApi = acquireVsCodeApi();

          // 初回ロード時にメモ一覧を要求
          console.log("[Webview] postMessage: requestMemoList");
          window.vscodeApi.postMessage({ command: 'requestMemoList' });

          textarea.addEventListener('input', () => {
            button.disabled = textarea.value.trim().length === 0;
          });
          button.addEventListener('click', () => {
            const text = textarea.value.trim();
            if (text.length > 0) {
              console.log("[Webview] postMessage: saveMemo", text);
              window.vscodeApi.postMessage({ command: 'saveMemo', text });
            }
          });

          // メモ一覧描画
          window.addEventListener('message', event => {
            const msg = event.data;
            if (msg.command === 'memoList') {
              console.log("[Webview] received memoList", msg.data);
              renderMemoList(msg.data);
            }
            if (msg.command === 'clearMemoInput') {
              textarea.value = '';
              button.disabled = true;
            }
          });

          function renderMemoList(memos) {
            memoListArea.innerHTML = '';
            if (!memos || memos.length === 0) {
              memoListEmpty.style.display = '';
              return;
            }
            memoListEmpty.style.display = 'none';
            for (const memo of memos) {
              const card = document.createElement('div');
              card.className = 'memo-card';
              // タイトル抽出（1行目をタイトル、2行目以降を本文とする）
              let title = '';
              let body = '';
              if (memo.content) {
                const lines = memo.content.split(/\\r?\\n/);
                title = lines[0] || '';
                body = lines.slice(1).join(' ').trim();
              }
              // 日時表示
              const dateStr = formatDate(memo.date);
              card.innerHTML = \`
                <div class="memo-date">\${dateStr}</div>
                <div class="memo-title">\${title}</div>
                <div class="memo-body">\${body}</div>
              \`;
              memoListArea.appendChild(card);
            }
          }

          function formatDate(dateStr) {
            // 例: 20250510T105514 → 2025/05/10 10:55:14
            if (!dateStr) return '';
            const m = dateStr.match(/(\\d{4})(\\d{2})(\\d{2})T(\\d{2})(\\d{2})(\\d{2})/);
            if (!m) return dateStr;
            return \`\${m[1]}/\${m[2]}/\${m[3]} \${m[4]}:\${m[5]}:\${m[6]}\`;
          }
        </script>
      </body>
      </html>
    `;
  }
}
