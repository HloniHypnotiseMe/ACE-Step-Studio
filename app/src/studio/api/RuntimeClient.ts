export interface HardwareDetection {
  backend: "cpu" | "cuda" | "rocm" | "metal";
  vramGb: number | null;
  source: "detected" | "unknown";
  confidence: "high" | "medium" | "low";
  detail: string;
}

export interface RuntimeReadiness {
  readiness: "ready" | "partial" | "offline";
  checks: { aceStep: boolean; stemSeparation: boolean; hardwareDetected: boolean; modelsAvailable: boolean };
  hardware: HardwareDetection;
  models: Array<{ id: string; version: string; providerId: string; license: string; commercialRedistribution: boolean; localInference: boolean; minVramGb?: number; backends: string[]; provenance: string }>;
  runtimes: { aceStep: boolean; stemSeparation: boolean };
  checkedAt: string;
}

export interface RuntimeHealth {
  status: "ready" | "partial" | "offline";
  runtimes: Array<{ id: string; label: string; status: "ready" | "offline" | "error"; detail: string; url?: string }>;
  platform: string;
  node: string;
  checkedAt: string;
}

export async function getRuntimeReadiness(): Promise<RuntimeReadiness> {
  const response = await fetch("/api/c6-runtime/readiness");
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Runtime readiness failed: " + response.status);
  return payload as RuntimeReadiness;
}

export async function getRuntimeHealth(): Promise<RuntimeHealth> {
  const response = await fetch("/api/c6-runtime/health");
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Runtime health failed: ${response.status}`);
  return payload as RuntimeHealth;
}
