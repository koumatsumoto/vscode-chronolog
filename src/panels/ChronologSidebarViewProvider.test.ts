import { describe, it, expect, vi, beforeEach } from "vitest";

// vscode モジュールを最低限モック
vi.mock("vscode", () => ({
  commands: { executeCommand: vi.fn() },
  window: {},
}));

import { ChronologSidebarViewProvider } from "./ChronologSidebarViewProvider";

describe("ChronologSidebarViewProvider", () => {
  let provider: ChronologSidebarViewProvider;
  let mockLogger: any;
  let mockView: any;

  beforeEach(() => {
    mockLogger = { info: vi.fn() };
    provider = new ChronologSidebarViewProvider({} as any, mockLogger);
    mockView = {
      webview: {
        html: "",
        onDidReceiveMessage: vi.fn(),
      },
    };
    // resolveWebviewViewで_viewがセットされる
    provider.resolveWebviewView(mockView, {} as any, {} as any);
  });

  it("refresh() で webview.html が再セットされる", () => {
    mockView.webview.html = "old";
    provider.refresh();
    expect(mockView.webview.html).not.toBe("old");
    expect(typeof mockView.webview.html).toBe("string");
    expect(mockLogger.info).toHaveBeenCalledWith("ChronologSidebarViewProvider: webview refreshed");
  });
});
