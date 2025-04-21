// src/services/requestProcessor.ts
import { ApiKeyManager } from "./apiKeyManager";
import { ThirdPartyApiClient } from "./thirdPartyApiClient";
import { MetricsCollector } from "./metricsCollector";
import PQueue from "p-queue";

interface RequestProcessorOptions {
  concurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class RequestProcessor {
  private apiKeyManager: ApiKeyManager;
  private thirdPartyApiClient: ThirdPartyApiClient;
  private metricsCollector: MetricsCollector;
  private concurrencyLimiter: PQueue;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(
    apiKeyManager: ApiKeyManager,
    thirdPartyApiClient: ThirdPartyApiClient,
    metricsCollector: MetricsCollector,
    options: RequestProcessorOptions = {}
  ) {
    this.apiKeyManager = apiKeyManager;
    this.thirdPartyApiClient = thirdPartyApiClient;
    this.metricsCollector = metricsCollector;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 100;

    this.concurrencyLimiter = new PQueue({
      concurrency: options.concurrency || 200,
      autoStart: true,
    });
  }

  async processBatch(requestId: string, count: number): Promise<string[]> {
    const results: string[] = new Array(count);
    const promises: Promise<void>[] = [];

    for (let i = 0; i < count; i++) {
      const promise = this.concurrencyLimiter.add(async () => {
        try {
          results[i] = await this.processIndividualRequest(requestId, i);
        } catch (error) {
          console.error(`[${requestId}][${i}] Request failed:`, error);

          for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
              await new Promise((resolve) =>
                setTimeout(resolve, this.retryDelay * attempt)
              );
              results[i] = await this.processIndividualRequest(requestId, i);
              break;
            } catch (retryError) {
              if (attempt === this.retryAttempts) {
                console.error(
                  `[${requestId}][${i}] All retry attempts failed:`,
                  retryError
                );
                results[i] = "failed";
              }
            }
          }
        }
      });

      promises.push(promise);
    }

    await Promise.all(promises);

    return results;
  }

  private async processIndividualRequest(
    requestId: string,
    index: number
  ): Promise<string> {
    const apiKey = await this.apiKeyManager.getAvailableApiKey();

    if (!apiKey) {
      throw new Error("No API key available");
    }

    try {
      const result = await this.thirdPartyApiClient.makeRequest(apiKey);
      return result;
    } catch (error) {
      throw error;
    }
  }

  getQueueSize(): number {
    return this.concurrencyLimiter.size;
  }

  getPendingCount(): number {
    return this.concurrencyLimiter.pending;
  }

  pause(): void {
    this.concurrencyLimiter.pause();
  }

  resume(): void {
    this.concurrencyLimiter.start();
  }

  clearQueue(): void {
    this.concurrencyLimiter.clear();
  }
}
