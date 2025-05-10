# 技術仕様

## TypeScript 設定

- `tsconfig.json` で strict モードおよび厳格な型チェックオプションを有効化
  - `"strict": true`, `"noImplicitAny": true`, `"noUnusedLocals": true` など
- `"include": ["src"]` により、`src/` 配下のみを型チェック対象とする
- JavaScript ファイルも `"checkJs": true` で型チェック対象
- `"noEmit": true` でビルド時のファイル出力を禁止
- その他、詳細は `tsconfig.json` を参照

## 実装構成

### HomePanel の実装構成（ファイル分割）

HomePanel の実装は以下の3ファイルに分割されています：

- `HomePanel.ts`  
  WebViewパネルの管理・コントローラー（UIイベントの受信、Service/View呼び出し）

- `HomePanelService.ts`  
  ビジネスロジック（メモの保存・一覧取得などのファイル操作や処理）

- `HomePanelView.ts`  
  HTML生成（入力パラメータからWebView用HTMLを組み立てて返す）

この分割により、UI制御・ロジック・ビューの責務を明確化しています。
