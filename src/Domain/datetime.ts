// 日時文字列生成ユーティリティ
/**
 * 現在時刻または指定日時を YYYYMMDDThhmmss 形式で返す
 * @param date Dateオブジェクト（省略時は現在時刻）
 * @returns 日時文字列（例: 20250513T231243）
 */
export function formatDateTime(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}
