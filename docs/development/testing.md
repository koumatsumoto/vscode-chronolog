# テスト実装方針

- vitest等の単体テストでは、ファイル操作（fs, path等）やvscodeモジュールは必ずmockすること
- 実ファイルI/OやVSCode APIへの依存を含むテストはintegration testまたはE2E testでのみ許可
- mock方針を守らずにテストを書くとCIで失敗するため注意
- この方針は全開発者が遵守すること
