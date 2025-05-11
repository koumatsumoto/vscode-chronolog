// src/ClogFormat/ChronologLogger.ts

import type { OutputChannel } from "vscode";

/**
 * Logging utility for the extension backend.
 * Uses VS Code's OutputChannel, initialized from extension.ts.
 */
export class ChronologLogger {
  private static outputChannel: OutputChannel;

  static initialize(outputChannel: OutputChannel) {
    ChronologLogger.outputChannel = outputChannel;
  }

  static error(message: string) {
    ChronologLogger.outputChannel.appendLine(`ERROR: ${message}`);
  }

  static warn(message: string) {
    ChronologLogger.outputChannel.appendLine(`WARN: ${message}`);
  }

  static log(message: string) {
    ChronologLogger.outputChannel.appendLine(`LOG: ${message}`);
  }

  static debug(message: string) {
    ChronologLogger.outputChannel.appendLine(`DEBUG: ${message}`);
  }

  static info(message: string) {
    ChronologLogger.outputChannel.appendLine(`INFO: ${message}`);
  }

  static trace(message: string) {
    ChronologLogger.outputChannel.appendLine(`TRACE: ${message}`);
  }
}
