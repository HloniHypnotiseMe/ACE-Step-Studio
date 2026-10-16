import { Router, Request, Response } from "express";
import multer from "multer";
import { cancelStemDeckJob, fetchStemDeckStem, getStemDeckJob, submitStemDeckJob } from "../services/stemdeck.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 400 * 1024 * 1024 } });

router.use((_req: Request, res: Response, next) => {
  if (process.env.C6_STEMDECK_ENABLED === "false") {
    res.status(404).json({ error: "C6 StemDeck bridge disabled" });
    return;
  }
  next();
});

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file is required" });
    const rawStems = typeof req.body?.stems === "string" ? JSON.parse(req.body.stems) : [];
    const stems = Array.isArray(rawStems) ? rawStems.map(String).slice(0, 6) : [];
    const job = await submitStemDeckJob(req.file.buffer, req.file.originalname, stems);
    return res.json({ ...job, status: "queued" });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/:jobId", async (req: Request, res: Response) => {
  try {
    const state = await getStemDeckJob(req.params.jobId);
    const stems = (state.stems || []).map(stem => ({
      ...stem,
      url: `/api/c6-local/stems/${encodeURIComponent(req.params.jobId)}/${encodeURIComponent(stem.name)}`
    }));
    return res.json({ ...state, stems });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/:jobId/cancel", async (req: Request, res: Response) => {
  try {
    return res.json({ result: await cancelStemDeckJob(req.params.jobId) });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/:jobId/:stemName", async (req: Request, res: Response) => {
  try {
    const response = await fetchStemDeckStem(req.params.jobId, req.params.stemName);
    res.setHeader("Content-Type", response.headers.get("content-type") || "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    if (response.body) {
      const reader = response.body.getReader();
      const pump = async (): Promise<void> => {
        const next = await reader.read();
        if (next.done) return;
        res.write(Buffer.from(next.value));
        await pump();
      };
      await pump();
    }
    return res.end();
  } catch (error) {
    return res.status(404).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
