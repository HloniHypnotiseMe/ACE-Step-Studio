export interface RuntimeHealth {
  status: "ready" | "partial" | "offline";
  runtimes: Array<{ id: string; label: string; status: "ready" | "offline" | "error"; detail: string; url?: string }>;
  platform: string;
  node: string;
  checkedAt: string;
}

export async function getRuntimeHealth(): Promise<RuntimeHealth> {
  const response = await fetch("/api/c6-runtime/health");
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Runtime health failed: ${response.status}`);
  return payload as RuntimeHealth;
}
