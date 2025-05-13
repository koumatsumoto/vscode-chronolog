// Vitest ユニットテスト
import { describe, it, expect } from "vitest";
import { formatDateTime } from "./datetime";

describe("formatDateTime", () => {
  it("should return current datetime string in YYYYMMDDThhmmss format", () => {
    const now = new Date();
    const result = formatDateTime(now);
    // 例: 20250513T231309
    expect(result).toMatch(/^\d{8}T\d{6}$/);
    // 年月日・時分秒が一致すること
    expect(result.slice(0, 4)).toBe(now.getFullYear().toString());
    expect(result.slice(4, 6)).toBe((now.getMonth() + 1).toString().padStart(2, "0"));
    expect(result.slice(6, 8)).toBe(now.getDate().toString().padStart(2, "0"));
    expect(result[8]).toBe("T");
    expect(result.slice(9, 11)).toBe(now.getHours().toString().padStart(2, "0"));
    expect(result.slice(11, 13)).toBe(now.getMinutes().toString().padStart(2, "0"));
    expect(result.slice(13, 15)).toBe(now.getSeconds().toString().padStart(2, "0"));
  });

  it("should format a specific date correctly", () => {
    const date = new Date(2020, 0, 2, 3, 4, 5); // 2020-01-02T03:04:05
    const result = formatDateTime(date);
    expect(result).toBe("20200102T030405");
  });

  it("should pad single digit months, days, hours, minutes, seconds with zero", () => {
    const date = new Date(2021, 8, 9, 7, 6, 5); // 2021-09-09T07:06:05
    const result = formatDateTime(date);
    expect(result).toBe("20210909T070605");
  });
});
