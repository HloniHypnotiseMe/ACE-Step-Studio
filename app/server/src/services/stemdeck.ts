import { Blob } from "node:buffer";

const baseUrl = () => (process.env.C6_STEMDECK_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export interface StemDeckJob {
  job_id: string;
}

export interface StemDeckState {
  id?: string;
  status: string;
  stage?: string;
  progress?: number;
  error_detail?: string;
  stems?: Array<{ name: string; url: string }>;
  duration_sec?: number;
}

export async function submitStemDeckJob(file: Buffer, filename: string, stems: string[] = []): Promise<StemDeckJob> {
  const form = new FormData();
  form.append("file", new Blob([file]), filename);
  form.append("stems", JSON.stringify(stems));

  const response = await fetch(`${baseUrl()}/api/jobs`, { method: "POST", body: form });
  const body = await response.text();
  if (!response.ok) throw new Error(`StemDeck submit failed (${response.status}): ${body.slice(0, 500)}`);
  return JSON.parse(body) as StemDeckJob;
}

export async function getStemDeckJob(jobId: string): Promise<StemDeckState> {
  const response = await fetch(`${baseUrl()}/api/jobs/${encodeURIComponent(jobId)}`);
  const body = await response.text();
  if (!response.ok) throw new Error(`StemDeck status failed (${response.status}): ${body.slice(0, 500)}`);
  return JSON.parse(body) as StemDeckState;
}

export async function cancelStemDeckJob(jobId: string): Promise<unknown> {
  const response = await fetch(`${baseUrl()}/api/jobs/${encodeURIComponent(jobId)}/cancel`, { method: "POST" });
  const body = await response.text();
  if (!response.ok) throw new Error(`StemDeck cancel failed (${response.status}): ${body.slice(0, 500)}`);
  return JSON.parse(body);
}

export async function fetchStemDeckStem(jobId: string, stemName: string): Promise<Response> {
  const safeName = stemName.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeName) throw new Error("Invalid stem name");
  const response = await fetch(`${baseUrl()}/api/jobs/${encodeURIComponent(jobId)}/stems/${safeName}.wav`);
  if (!response.ok) throw new Error(`StemDeck stem failed (${response.status})`);
  return response;
}
