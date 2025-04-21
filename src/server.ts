import express, { Request, Response } from "express";
import { createServer } from "http";
import { ApiKeyManager } from "./services/apiKeyManager";
import { ThirdPartyApiClient } from "./services/thirdPartyApiClient";
import { RequestProcessor } from "./services/requestProcessor";
import { MetricsCollector } from "./services/metricsCollector";

interface ProcessBatchRequest {
  requestId?: string;
  requestsCount?: number;
}

const app = express();
const httpServer = createServer(app);

const apiKeyManager = new ApiKeyManager(["key1", "key2", "key3"], 1000);

const thirdPartyApiClient = new ThirdPartyApiClient();
const metricsCollector = new MetricsCollector();
const requestProcessor = new RequestProcessor(
  apiKeyManager,
  thirdPartyApiClient,
  metricsCollector
);

app.use(express.json());

app.post(
  "/process-batch",
  async (req: Request<{}, {}, ProcessBatchRequest>, res: Response) => {
    const requestId = req.body.requestId || Date.now().toString();
    const requestsCount = req.body.requestsCount || 2000;

    try {
      console.log(
        `[${requestId}] Starting batch processing for ${requestsCount} requests`
      );
      metricsCollector.startRequest(requestId);

      const results = await requestProcessor.processBatch(
        requestId,
        requestsCount
      );

      const timeTaken = metricsCollector.endRequest(requestId);
      console.log(`[${requestId}] Batch completed in ${timeTaken}ms`);

      res.json({
        requestId,
        timeTaken,
        results,
      });
    } catch (error) {
      console.error(`[${requestId}] Error processing batch:`, error);
      res.status(500).json({
        error: "Failed to process request batch",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

app.get("/metrics", (_req: Request, res: Response) => {
  res.json(metricsCollector.getMetrics());
});

app.get("/health", (_req: Request, res: Response) => {
  const keysStatus = apiKeyManager.getKeysStatus();
  res.json({
    status: "healthy",
    apiKeys: keysStatus,
    queueSize: requestProcessor.getQueueSize(),
  });
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default httpServer;
