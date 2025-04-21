// src/stressTest.ts
import axios, { AxiosResponse } from "axios";
import { performance } from "perf_hooks";

const API_URL = "http://localhost:8000/process-batch";
const CONCURRENT_REQUESTS = 100;
const REQUESTS_PER_BATCH = 2000;

interface RequestResult {
  requestId: string;
  timeTaken: number;
  successCount: number;
  totalRequests: number;
}

interface BatchResponse {
  requestId: string;
  timeTaken: number;
  results: string[];
}

async function runStressTest(): Promise<void> {
  console.log(
    `Starting stress test with ${CONCURRENT_REQUESTS} concurrent requests of ${REQUESTS_PER_BATCH} API calls each`
  );
  console.log(
    "====================================================================="
  );

  const startTime = performance.now();

  const requests = Array(CONCURRENT_REQUESTS)
    .fill(0)
    .map((_, index) => {
      return axios.post<any, AxiosResponse<BatchResponse>>(API_URL, {
        requestId: `stress-test-${index + 1}`,
        requestsCount: REQUESTS_PER_BATCH,
      });
    });

  try {
    const results = await Promise.all(requests);

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    console.log(
      "====================================================================="
    );
    console.log(`Stress test completed in ${totalTime.toFixed(2)}ms`);
    console.log(
      "---------------------------------------------------------------------"
    );

    const requestTimes: RequestResult[] = results.map((result, index) => {
      const successCount = result.data.results.filter(
        (r) => r === "success"
      ).length;
      return {
        requestId: `stress-test-${index + 1}`,
        timeTaken: result.data.timeTaken,
        successCount,
        totalRequests: REQUESTS_PER_BATCH,
      };
    });

    requestTimes.sort((a, b) => a.timeTaken - b.timeTaken);

    const times = requestTimes.map((r) => r.timeTaken);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const avgTime = times.reduce((sum, val) => sum + val, 0) / times.length;

    const totalSuccesses = requestTimes.reduce(
      (sum, req) => sum + req.successCount,
      0
    );
    const totalRequests = CONCURRENT_REQUESTS * REQUESTS_PER_BATCH;
    const successRate = (totalSuccesses / totalRequests) * 100;

    const throughput = totalSuccesses / (totalTime / 1000);

    console.log("Individual Request Times:");
    requestTimes.forEach((req) => {
      const successRate = (
        (req.successCount / req.totalRequests) *
        100
      ).toFixed(2);
      console.log(
        `${req.requestId}: ${req.timeTaken}ms (${req.successCount}/${req.totalRequests} successful - ${successRate}%)`
      );
    });

    console.log(
      "---------------------------------------------------------------------"
    );
    console.log("Summary:");
    console.log(`Min time: ${minTime}ms`);
    console.log(`Max time: ${maxTime}ms`);
    console.log(`Average time: ${avgTime.toFixed(2)}ms`);
    console.log(`Success rate: ${successRate.toFixed(2)}%`);
    console.log(`Throughput: ${throughput.toFixed(2)} requests/second`);
    console.log(`Total requests processed: ${totalRequests}`);
    console.log(
      "====================================================================="
    );

    const metricsResponse = await axios.get("http://localhost:8000/metrics");
    console.log(
      "Server metrics:",
      JSON.stringify(metricsResponse.data.summary, null, 2)
    );
  } catch (error) {
    console.error("Stress test failed:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

runStressTest().catch(console.error);
