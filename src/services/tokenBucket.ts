interface WaitQueueItem {
  resolve: (value: void | PromiseLike<void>) => void;
  reject: (reason?: any) => void;
}

export class TokenBucket {
  private tokens: number;
  private capacity: number;
  private tokensPerSecond: number;
  private lastRefillTimestamp: number;
  private waitQueue: WaitQueueItem[] = [];
  private refillInterval: NodeJS.Timeout;

  constructor(tokensPerSecond: number, capacity: number) {
    this.tokens = capacity;
    this.capacity = capacity;
    this.tokensPerSecond = tokensPerSecond;
    this.lastRefillTimestamp = Date.now();

    this.refillInterval = setInterval(() => this.refill(), 100);
  }

  cleanup(): void {
    if (this.refillInterval) {
      clearInterval(this.refillInterval);
    }
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;

    const tokensToAdd = elapsedSeconds * this.tokensPerSecond;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefillTimestamp = now;

      this.processWaitQueue();
    }
  }

  private processWaitQueue(): void {
    while (this.waitQueue.length > 0 && this.tokens >= 1) {
      const waiter = this.waitQueue.shift();
      if (waiter) {
        this.tokens -= 1;
        waiter.resolve();
      }
    }
  }

  takeToken(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  getTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getCapacity(): number {
    return this.capacity;
  }

  waitForToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.refill();

      if (this.tokens >= 1) {
        this.tokens -= 1;
        resolve();
      } else {
        this.waitQueue.push({ resolve, reject });

        setTimeout(() => {
          const index = this.waitQueue.findIndex(
            (item) => item.resolve === resolve
          );
          if (index !== -1) {
            this.waitQueue.splice(index, 1);
            reject(new Error("Timed out waiting for token"));
          }
        }, 30000);
      }
    });
  }
}
