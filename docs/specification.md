## Homeパネルのメモ保存挙動

- メモ保存後もHomeパネルは閉じず、入力欄はクリアされる。
- 保存したメモは即座に履歴一覧に反映される。

## Homeパネルのテーマ対応

- HomeパネルのWebviewは、VSCodeのテーマ（ダーク/ライト）に自動追従した配色とすること。
- CSSカスタムプロパティ（--vscode-editor-background, --vscode-panel-background, --vscode-editor-foreground など）を利用してカラーリングを行うこと。
- 静的な色指定（#fff など）は使用しないこと。
