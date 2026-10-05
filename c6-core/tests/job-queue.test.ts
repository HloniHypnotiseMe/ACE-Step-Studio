import { describe, expect, it } from "vitest";
import { InMemoryJobQueue } from "../src/job-queue";

describe("job queue", () => {
  it("executes AI work outside the synchronous caller", async () => {
    const queue=new InMemoryJobQueue<{value:number},number>({
      async execute(input) { await Promise.resolve(); return input.value*2; }
    });
    const submitted=queue.submit("job-1",{value:21});
    expect(submitted.status).toBe("queued");
    for(let i=0;i<20;i++){ const job=queue.get("job-1"); if(job?.status==="succeeded") break; await new Promise(r=>setTimeout(r,1)); }
    expect(queue.get("job-1")?.output).toBe(42);
  });
});
