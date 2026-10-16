import { Router, Request, Response } from 'express';
import { isGradioAvailable } from '../services/gradio-client.js';
import { detectHardware } from '../services/hardware-detection.js';
import { loadModelManifests } from '../services/model-manifest.js';

const router = Router();

interface RuntimeCheck { id: string; label: string; status: "ready" | "offline" | "error"; detail: string; url?: string; }

async function checkHttp(url: string): Promise<RuntimeCheck["status"]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok ? "ready" : response.status < 500 ? "offline" : "error";
  } catch { return "offline"; } finally { clearTimeout(timer); }
}

function stemDeckHealthTarget(): { url?: string; detail: string } {
  const explicit = process.env.C6_STEMDECK_HEALTH_URL?.trim();
  if (explicit) return { url: explicit, detail: "Configured StemDeck health endpoint" };
  // StemDeck is a standalone local desktop app; its API does not guarantee /health.
  // Do not probe an assumed route and report a false negative/positive.
  return { detail: "Not verified: set C6_STEMDECK_HEALTH_URL to a health endpoint exposed by the configured StemDeck-compatible API" };
}

router.get('/health', async (_req: Request, res: Response) => {
  const aceReady = await isGradioAvailable();
  const stemBaseUrl = (process.env.C6_STEMDECK_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
  const stemHealth = stemDeckHealthTarget();
  const stemStatus = process.env.C6_STEMDECK_ENABLED === "false"
    ? "offline"
    : stemHealth.url ? await checkHttp(stemHealth.url) : "offline";
  const hardware = await detectHardware();
  const runtimes: RuntimeCheck[] = [
    { id: "ace-step", label: "ACE-Step local generation", status: aceReady ? "ready" : "offline", detail: aceReady ? "Generation runtime reachable" : "Start the local ACE-Step runtime", url: process.env.ACESTEP_API_URL },
    { id: "stemdeck", label: "StemDeck API", status: stemStatus, detail: process.env.C6_STEMDECK_ENABLED === "false" ? "StemDeck bridge disabled by configuration" : stemHealth.url ? (stemStatus === "ready" ? "Configured health endpoint reachable" : "Configured health endpoint did not pass its health check") : stemHealth.detail, url: stemHealth.url ?? stemBaseUrl }
  ];
  const ready = runtimes.filter(item => item.status === "ready").length;
  res.json({ status: ready === runtimes.length ? "ready" : ready > 0 ? "partial" : "offline", runtimes, hardware, platform: process.platform, node: process.version, checkedAt: new Date().toISOString() });
});

router.get('/readiness', async (_req: Request, res: Response) => {
  const aceReady = await isGradioAvailable();
  const hardware = await detectHardware();
  const modelInventory = await loadModelManifests();
  const stemHealth = stemDeckHealthTarget();
  const stemReady = process.env.C6_STEMDECK_ENABLED !== "false" && Boolean(stemHealth.url) && await checkHttp(stemHealth.url!) === "ready";
  const checks = {
    aceStep: aceReady,
    stemSeparation: stemReady,
    hardwareDetected: hardware.source === "detected",
    modelsAvailable: modelInventory.models.length > 0
  };
  res.json({
    readiness: checks.aceStep && checks.hardwareDetected ? "ready" : aceReady ? "partial" : "offline",
    checks,
    hardware,
    models: modelInventory.models.map(model => ({ ...model, commercialReady: model.commercialRedistribution && model.licenseVerified === true && model.weightsLicenseVerified === true && model.provenanceVerified === true })),
    modelManifest: { source: modelInventory.source, warning: modelInventory.warning },
    runtimes: { aceStep: aceReady, stemSeparation: stemReady },
    checkedAt: new Date().toISOString()
  });
});

export default router;
