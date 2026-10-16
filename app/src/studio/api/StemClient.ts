export interface StemJobResponse {
  job_id: string;
  status: "queued";
}

export interface StemState {
  id?: string;
  status: string;
  stage?: string;
  progress?: number;
  error_detail?: string;
  duration_sec?: number;
  stems?: Array<{ name: string; url: string }>;
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const body = await response.text();
  if (!response.ok) throw new Error(body || `Request failed: ${response.status}`);
  return JSON.parse(body) as T;
}

export async function createStemJob(uri: string, name: string, stems: string[] = []): Promise<StemJobResponse> {
  const source = await fetch(uri);
  if (!source.ok) throw new Error(`Unable to read source audio: ${source.status}`);
  const blob = await source.blob();
  const form = new FormData();
  form.append("file", blob, name);
  form.append("stems", JSON.stringify(stems));
  return json<StemJobResponse>("/api/c6-local/stems", { method: "POST", body: form });
}

export const getStemStatus = (jobId: string) => json<StemState>(`/api/c6-local/stems/${encodeURIComponent(jobId)}`);

export const cancelStemJob = (jobId: string) =>
  json<{ result: unknown }>(`/api/c6-local/stems/${encodeURIComponent(jobId)}/cancel`, { method: "POST" });

export async function waitForStemJob(
  jobId: string,
  onUpdate?: (state: StemState) => void,
  intervalMs = 1000
): Promise<StemState> {
  for (;;) {
    const state = await getStemStatus(jobId);
    onUpdate?.(state);
    if (state.status === "done") return state;
    if (state.status === "error" || state.status === "cancelled" || state.status === "unavailable") {
      throw new Error(state.error_detail || state.stage || `Stem separation ${state.status}`);
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}
