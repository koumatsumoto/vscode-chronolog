// src/Logger/Logger.ts

import type { OutputChannel } from "vscode";

/**
 * Logging utility for the extension backend.
 * Uses VS Code's OutputChannel, initialized from extension.ts.
 */
export class Logger {
  private static outputChannel: OutputChannel;

  static initialize(outputChannel: OutputChannel) {
    Logger.outputChannel = outputChannel;
  }

  static error(message: string) {
    Logger.outputChannel.appendLine(`ERROR: ${message}`);
  }

  static warn(message: string) {
    Logger.outputChannel.appendLine(`WARN: ${message}`);
  }

  static log(message: string) {
    Logger.outputChannel.appendLine(`LOG: ${message}`);
  }

  static debug(message: string) {
    Logger.outputChannel.appendLine(`DEBUG: ${message}`);
  }

  static info(message: string) {
    Logger.outputChannel.appendLine(`INFO: ${message}`);
  }

  static trace(message: string) {
    Logger.outputChannel.appendLine(`TRACE: ${message}`);
  }
}
