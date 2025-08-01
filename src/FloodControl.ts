import util from 'util';

export const hash = (message: string, data: any[]): string => {
  const dataString = data.map(item => {
    try {
      return JSON.stringify(item);
    } catch {
      // Fallback to util.inspect for objects with circular references
      return util.inspect(item);
    }
  }).join('');
  return `${message}${dataString}`;
}

export type FloodControlConfig = {
  enabled: boolean;
  threshold: number;
  timeframe: number; // in milliseconds
};

export class FloodControl {
  private config: FloodControlConfig;
  private history: Map<string, number[]> = new Map();
  private suppressed: Map<string, { count: number, firstTimestamp: number, summaryLogged: boolean }> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: FloodControlConfig) {
    this.config = config;
    if (this.config.enabled) {
      this.cleanupTimer = setInterval(() => this.cleanup(), this.config.timeframe * 2);
    }
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [hash, timestamps] of this.history.entries()) {
      const recentTimestamps = timestamps.filter(
        (timestamp) => now - timestamp < this.config.timeframe
      );
      if (recentTimestamps.length > 0) {
        this.history.set(hash, recentTimestamps);
      } else {
        this.history.delete(hash);
        this.suppressed.delete(hash);
      }
    }
  }

  public check(message: string, data: any[]): 'log' | 'suppress' | 'resume' {
    if (!this.config.enabled) {
      return 'log';
    }

    const messageHash = hash(message, data);
    const now = Date.now();

    const timestamps = (this.history.get(messageHash) || []).filter(
      (timestamp) => now - timestamp < this.config.timeframe
    );
    timestamps.push(now);
    this.history.set(messageHash, timestamps);

    if (timestamps.length > this.config.threshold) {
      const suppressedInfo = this.suppressed.get(messageHash);
      if (suppressedInfo) {
        suppressedInfo.count++;
        return 'suppress';
      } else {
        this.suppressed.set(messageHash, { count: 1, firstTimestamp: timestamps[0], summaryLogged: false });
        return 'suppress';
      }
    } else {
      if (this.suppressed.has(messageHash)) {
        this.suppressed.delete(messageHash);
        return 'resume';
      }
    }

    return 'log';
  }

  public getSuppressedCount(message: string, data: any[]): number {
    const messageHash = hash(message, data);
    return this.suppressed.get(messageHash)?.count || 0;
  }
}
