import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";

const execFileAsync = promisify(execFile);

export type HardwareBackend = "cpu" | "cuda" | "rocm" | "metal";
export type DetectionSource = "detected" | "unknown";

export interface HardwareDetection {
  backend: HardwareBackend;
  vramGb: number | null;
  source: DetectionSource;
  confidence: "high" | "medium" | "low";
  detail: string;
}

async function commandExists(command: string, args: string[] = []): Promise<boolean> {
  try { await execFileAsync(command, args, { timeout: 1500 }); return true; } catch { return false; }
}

async function detectNvidia(): Promise<HardwareDetection | undefined> {
  try {
    const { stdout } = await execFileAsync("nvidia-smi", ["--query-gpu=memory.total", "--format=csv,noheader,nounits"], { timeout: 2000 });
    const values = stdout.trim().split(/\r?\n/).map(Number).filter(Number.isFinite);
    if (!values.length) return undefined;
    return { backend: "cuda", vramGb: Math.max(...values) / 1024, source: "detected", confidence: "high", detail: "NVIDIA GPU detected (" + values.length + " device" + (values.length === 1 ? "" : "s") + ")" };
  } catch { return undefined; }
}

async function detectRocm(): Promise<HardwareDetection | undefined> {
  if (!(await commandExists("rocminfo"))) return undefined;
  let vramGb: number | null = null;
  try {
    const { stdout } = await execFileAsync("rocm-smi", ["--showmeminfo", "vram", "--csv"], { timeout: 2000 });
    const matches = [...stdout.matchAll(/(\d+(?:\.\d+)?)\s*(?:MiB|MB)/gi)].map(m => Number(m[1])).filter(Number.isFinite);
    if (matches.length) vramGb = Math.max(...matches) / 1024;
  } catch {}
  return { backend: "rocm", vramGb, source: "detected", confidence: "high", detail: "AMD ROCm runtime detected" };
}

async function detectMetal(): Promise<HardwareDetection | undefined> {
  if (process.platform !== "darwin") return undefined;
  if (!(await commandExists("system_profiler", ["SPDisplaysDataType"]))) return undefined;
  return { backend: "metal", vramGb: null, source: "detected", confidence: "medium", detail: "Apple Metal-capable display hardware detected; VRAM not reliably exposed" };
}

export async function detectHardware(): Promise<HardwareDetection> {
  const cuda = await detectNvidia();
  if (cuda) return cuda;
  const rocm = await detectRocm();
  if (rocm) return rocm;
  const metal = await detectMetal();
  if (metal) return metal;
  return { backend: "cpu", vramGb: null, source: "unknown", confidence: "low", detail: os.platform() + " CPU fallback; accelerator not detected" };
}
