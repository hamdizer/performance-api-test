interface RequestMetric {
  requestId: string;
  duration: number;
  startTime: number;
  endTime: number;
}

interface SummaryMetrics {
  total: number;
  min: number;
  max: number;
  avg: number;
  median: number;
}

interface MetricsResult {
  requests: RequestMetric[];
  summary: SummaryMetrics;
}

export class MetricsCollector {
  private requestStartTimes: Map<string, number> = new Map();
  private requestEndTimes: Map<string, number> = new Map();
  private requestDurations: Map<string, number> = new Map();

  startRequest(requestId: string): void {
    this.requestStartTimes.set(requestId, Date.now());
  }

  endRequest(requestId: string): number {
    const endTime = Date.now();
    this.requestEndTimes.set(requestId, endTime);

    const startTime = this.requestStartTimes.get(requestId);
    if (startTime) {
      const duration = endTime - startTime;
      this.requestDurations.set(requestId, duration);
      return duration;
    }

    return 0;
  }

  getMetrics(): MetricsResult {
    const metrics: MetricsResult = {
      requests: [],
      summary: {
        total: 0,
        min: Infinity,
        max: 0,
        avg: 0,
        median: 0,
      },
    };

    this.requestDurations.forEach((duration, requestId) => {
      const startTime = this.requestStartTimes.get(requestId);
      const endTime = this.requestEndTimes.get(requestId);

      if (startTime !== undefined && endTime !== undefined) {
        metrics.requests.push({
          requestId,
          duration,
          startTime,
          endTime,
        });
      }
    });

    if (metrics.requests.length > 0) {
      metrics.summary.total = metrics.requests.length;

      const sortedDurations = metrics.requests
        .map((r) => r.duration)
        .sort((a, b) => a - b);

      metrics.summary.min = sortedDurations[0];
      metrics.summary.max = sortedDurations[sortedDurations.length - 1];
      metrics.summary.avg =
        sortedDurations.reduce((sum, val) => sum + val, 0) /
        sortedDurations.length;

      const mid = Math.floor(sortedDurations.length / 2);
      metrics.summary.median =
        sortedDurations.length % 2 === 0
          ? (sortedDurations[mid - 1] + sortedDurations[mid]) / 2
          : sortedDurations[mid];
    }

    return metrics;
  }

  resetMetrics(): void {
    this.requestStartTimes.clear();
    this.requestEndTimes.clear();
    this.requestDurations.clear();
  }

  getRequestMetrics(requestId: string): RequestMetric | null {
    const duration = this.requestDurations.get(requestId);
    const startTime = this.requestStartTimes.get(requestId);
    const endTime = this.requestEndTimes.get(requestId);

    if (
      duration !== undefined &&
      startTime !== undefined &&
      endTime !== undefined
    ) {
      return {
        requestId,
        duration,
        startTime,
        endTime,
      };
    }

    return null;
  }
}
