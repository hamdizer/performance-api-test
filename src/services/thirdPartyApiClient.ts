interface ThirdPartyApiClientOptions {
  minLatency?: number;
  maxLatency?: number;
  successRate?: number;
}

export class ThirdPartyApiClient {
  private minLatency: number;
  private maxLatency: number;
  private successRate: number;

  constructor(options: ThirdPartyApiClientOptions = {}) {
    this.minLatency = options.minLatency || 500; 
    this.maxLatency = options.maxLatency || 3000; 
    this.successRate = options.successRate || 0.99; 
  }

  async makeRequest(apiKey: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const latency =
        Math.floor(Math.random() * (this.maxLatency - this.minLatency + 1)) +
        this.minLatency;

      setTimeout(() => {
        if (Math.random() < this.successRate) {
          resolve("success");
        } else {
          reject(new Error(`Third-party API request failed for key ${apiKey}`));
        }
      }, latency);
    });
  }

  setSuccessRate(rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error("Success rate must be between 0 and 1");
    }
    this.successRate = rate;
  }

  setLatencyRange(min: number, max: number): void {
    if (min < 0 || max < min) {
      throw new Error("Invalid latency range");
    }
    this.minLatency = min;
    this.maxLatency = max;
  }
}
