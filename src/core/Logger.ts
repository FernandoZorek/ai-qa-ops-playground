import path from 'path';

export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  VERBOSE = 5
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO;
  private static initialized = false;

  static init() {
    if (this.initialized) return;
    
    const logLevel = process.env.LOG_LEVEL || process.env.LOGS || '3';
    const level = parseInt(logLevel, 10);
    
    if (isNaN(level) || level < 0 || level > 5) {
      this.level = LogLevel.INFO;
      console.warn(`⚠️ Invalid LOG_LEVEL: ${logLevel}. Using default level 3 (INFO)`);
    } else {
      this.level = level as LogLevel;
    }
    
    this.initialized = true;
  }

  static error(message: string, ...args: any[]) {
    if (this.level >= LogLevel.ERROR) {
      console.error(`\x1b[31m❌ ${message}\x1b[0m`, ...args);
    }
  }

  static warn(message: string, ...args: any[]) {
    if (this.level >= LogLevel.WARN) {
      console.warn(`\x1b[33m⚠️ ${message}\x1b[0m`, ...args);
    }
  }

  static info(message: string, ...args: any[]) {
    if (this.level >= LogLevel.INFO) {
      console.log(`\x1b[36mℹ️ ${message}\x1b[0m`, ...args);
    }
  }

  static debug(message: string, ...args: any[]) {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`\x1b[34m🔍 ${message}\x1b[0m`, ...args);
    }
  }

  static verbose(message: string, ...args: any[]) {
    if (this.level >= LogLevel.VERBOSE) {
      console.log(`\x1b[35m📝 ${message}\x1b[0m`, ...args);
    }
  }

  static section(title: string) {
    if (this.level >= LogLevel.INFO) {
      console.log(`\n\x1b[1m\x1b[32m${'='.repeat(60)}\x1b[0m`);
      console.log(`\x1b[1m\x1b[32m${title}\x1b[0m`);
      console.log(`\x1b[1m\x1b[32m${'='.repeat(60)}\x1b[0m\n`);
    }
  }

  static subSection(title: string) {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`\n\x1b[1m\x1b[33m--- ${title} ---\x1b[0m\n`);
    }
  }

  static code(code: string, title?: string) {
    if (this.level >= LogLevel.VERBOSE) {
      if (title) {
        console.log(`\x1b[1m\x1b[36m${title}\x1b[0m`);
      }
      console.log('\x1b[2m' + code + '\x1b[0m');
    }
  }

  static getLevel(): LogLevel {
    return this.level;
  }

  static isVerbose(): boolean {
    return this.level >= LogLevel.VERBOSE;
  }

  static isDebug(): boolean {
    return this.level >= LogLevel.DEBUG;
  }
}