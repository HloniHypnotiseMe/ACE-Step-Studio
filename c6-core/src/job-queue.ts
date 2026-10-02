export type QueueStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export interface QueueJob<TInput, TOutput> {
  id: string;
  input: TInput;
  status: QueueStatus;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  output?: TOutput;
  error?: string;
}

export interface JobExecutor<TInput, TOutput> {
  execute(input: TInput, signal: AbortSignal): Promise<TOutput>;
}

export class InMemoryJobQueue<TInput, TOutput> {
  private readonly jobs = new Map<string, QueueJob<TInput, TOutput>>();
  private readonly controllers = new Map<string, AbortController>();

  constructor(private readonly executor: JobExecutor<TInput, TOutput>) {}

  submit(id: string, input: TInput): QueueJob<TInput, TOutput> {
    if (this.jobs.has(id)) throw new Error(`Job already exists: ${id}`);
    const job: QueueJob<TInput,TOutput> = { id, input, status: "queued", createdAt: Date.now() };
    this.jobs.set(id, job);
    void this.run(job);
    return { ...job };
  }

  get(id: string): QueueJob<TInput,TOutput> | undefined {
    const job = this.jobs.get(id);
    return job ? { ...job } : undefined;
  }

  cancel(id: string): void {
    const job=this.jobs.get(id);
    if (!job || job.status==="succeeded" || job.status==="failed" || job.status==="cancelled") return;
    this.controllers.get(id)?.abort();
    if (job.status==="queued") job.status="cancelled";
  }

  private async run(job: QueueJob<TInput,TOutput>): Promise<void> {
    const controller=new AbortController();
    this.controllers.set(job.id,controller);
    job.status="running"; job.startedAt=Date.now();
    try {
      job.output=await this.executor.execute(job.input,controller.signal);
      job.status=controller.signal.aborted ? "cancelled" : "succeeded";
    } catch (error) {
      job.error=error instanceof Error ? error.message : String(error);
      job.status=controller.signal.aborted ? "cancelled" : "failed";
    } finally {
      job.finishedAt=Date.now();
      this.controllers.delete(job.id);
    }
  }
}
