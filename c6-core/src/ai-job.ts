export type AIJobState = "queued"|"running"|"succeeded"|"failed"|"cancelled";

export interface AIJob<TInput=unknown,TOutput=unknown> {
  id: string;
  providerId: string;
  input: TInput;
  state: AIJobState;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  output?: TOutput;
  error?: string;
}

export interface AIJobRunner {
  submit<TInput,TOutput>(job: Omit<AIJob<TInput,TOutput>,"state">): Promise<AIJob<TInput,TOutput>>;
  cancel(jobId: string): Promise<void>;
}