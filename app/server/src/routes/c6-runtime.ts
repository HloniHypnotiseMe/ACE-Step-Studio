import { Router, Request, Response } from 'express';
import { isGradioAvailable } from '../services/gradio-client.js';

const router = Router();

interface RuntimeCheck { id: string; label: string; status: "ready" | "offline" | "error"; detail: string; url?: string; }

async function checkHttp(url: string): Promise<RuntimeCheck["status"]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok || response.status < 500 ? "ready" : "error";
  } catch { return "offline"; } finally { clearTimeout(timer); }
}

router.get('/health', async (_req: Request, res: Response) => {
  const aceReady = await isGradioAvailable();
  const stemUrl = (process.env.C6_STEMDECK_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
  const stemStatus = process.env.C6_STEMDECK_ENABLED === "false" ? "offline" : await checkHttp(stemUrl + "/health");
  const runtimes: RuntimeCheck[] = [
    { id: "ace-step", label: "ACE-Step local generation", status: aceReady ? "ready" : "offline", detail: aceReady ? "Generation runtime reachable" : "Start the local ACE-Step runtime", url: process.env.ACESTEP_API_URL },
    { id: "stemdeck", label: "StemDeck", status: stemStatus, detail: stemStatus === "ready" ? "Stem separation runtime reachable" : "Start StemDeck or disable it in .env", url: stemUrl }
  ];
  const ready = runtimes.filter(item => item.status === "ready").length;
  res.json({ status: ready === runtimes.length ? "ready" : ready > 0 ? "partial" : "offline", runtimes, platform: process.platform, node: process.version, checkedAt: new Date().toISOString() });
});

export default router;