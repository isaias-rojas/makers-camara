type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context } = entry;
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createEntry('info', message, context);
    console.log(this.formatMessage(entry));
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createEntry('warn', message, context);
    console.warn(this.formatMessage(entry));
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const entry = this.createEntry('error', message, {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      } : error,
    });
    console.error(this.formatMessage(entry));
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      const entry = this.createEntry('debug', message, context);
      console.debug(this.formatMessage(entry));
    }
  }

  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();