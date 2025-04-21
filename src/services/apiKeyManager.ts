import { TokenBucket } from "./tokenBucket";

interface ApiKeyStatus {
  tokens: number;
  maxTokens: number;
}

export class ApiKeyManager {
  private apiKeys: string[];
  private buckets: Map<string, TokenBucket>;
  private lastUsedIndex: number = -1;

  constructor(apiKeys: string[], requestsPerMinute: number) {
    this.apiKeys = apiKeys;
    this.buckets = new Map();

    apiKeys.forEach((key) => {
      const tokensPerSecond = requestsPerMinute / 60;
      const bucketCapacity = Math.max(50, Math.floor(requestsPerMinute / 5));

      this.buckets.set(key, new TokenBucket(tokensPerSecond, bucketCapacity));
    });
  }

  async getAvailableApiKey(): Promise<string | null> {
    for (let i = 0; i < this.apiKeys.length; i++) {
      this.lastUsedIndex = (this.lastUsedIndex + 1) % this.apiKeys.length;
      const key = this.apiKeys[this.lastUsedIndex];
      const bucket = this.buckets.get(key)!;

      if (bucket.getTokens() > 0) {
        bucket.takeToken();
        return key;
      }
    }

    const waitPromises = this.apiKeys.map(async (key) => {
      const bucket = this.buckets.get(key)!;
      try {
        await bucket.waitForToken();
        return key;
      } catch (error) {
        return null;
      }
    });

    try {
      const results = await Promise.race(
        waitPromises.map((p) => p.catch((e) => null))
      );

      return results as string | null;
    } catch (error) {
      console.error("Error waiting for available API key:", error);
      return null;
    }
  }

  getTotalAvailableTokens(): number {
    return Array.from(this.buckets.values()).reduce(
      (total, bucket) => total + bucket.getTokens(),
      0
    );
  }

  getKeysStatus(): Record<string, ApiKeyStatus> {
    const status: Record<string, ApiKeyStatus> = {};

    this.apiKeys.forEach((key) => {
      const bucket = this.buckets.get(key)!;
      status[key] = {
        tokens: bucket.getTokens(),
        maxTokens: bucket.getCapacity(),
      };
    });

    return status;
  }

  cleanup(): void {
    for (const bucket of this.buckets.values()) {
      bucket.cleanup();
    }
    this.buckets.clear();
  }
}
