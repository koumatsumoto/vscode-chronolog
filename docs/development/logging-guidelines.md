# ログ方針

- 拡張機能のイベント処理、コマンド実行、activation など主要な関数の呼び出しでは info ログを必ず残すこと。
- 内部関数や副作用の無い純粋関数には、原則としてログを残さないこと。
- 例外処理には error ログを残すこと。
- 通常は発生しないような条件分岐やエラー処理には warn ログを残すこと。
- ログ出力には Logger クラスを使用すること。
- ログレベルは用途に応じて info, warn, error, debug, trace, log を使い分けること。

---

## 実装例

```typescript
import { Logger } from "./Logger/Logger";

// OutputChannel の生成と Logger 初期化
const outputChannel = vscode.window.createOutputChannel("Chronolog");
Logger.initialize(outputChannel);

// 拡張機能の有効化
export function activate(context: vscode.ExtensionContext) {
  Logger.info("Chronolog extension is now active!");

  try {
    // ディレクトリ作成処理
    if (!fs.existsSync(clogDir)) {
      fs.mkdirSync(clogDir);
      Logger.info(`Created directory: ${clogDir}`);
    }
  } catch (err) {
    Logger.error(`Failed to initialize workspace directories: ${err}`);
  }
}

// ワークスペースが存在しない場合
if (!firstWorkspace) {
  Logger.warn("No workspace folder found. .clog directory was not created.");
}
```
