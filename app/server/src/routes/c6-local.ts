import { Router, Request, Response } from 'express';
import { generateMusicViaAPI, getJobStatus, cancelJob } from '../services/acestep.js';

const router = Router();

router.use((_req: Request, res: Response, next) => {
  if (process.env.C6_LOCAL_API_ENABLED === 'false') {
    res.status(404).json({ error: 'C6 local API disabled' });
    return;
  }
  next();
});

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const prompt = String(body.prompt || '').trim();
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const job = await generateMusicViaAPI({
      customMode: false,
      songDescription: prompt,
      lyrics: '',
      style: prompt,
      title: '',
      instrumental: Boolean(body.instrumental ?? false),
      duration: Number(body.duration) > 0 ? Number(body.duration) : undefined,
      seed: body.seed === undefined ? undefined : Number(body.seed),
      randomSeed: body.seed === undefined,
      batchSize: Math.min(Math.max(Number(body.batchSize || 1), 1), 4),
      audioFormat: body.audioFormat === 'flac' ? 'flac' : 'mp3',
      thinking: Boolean(body.thinking ?? false),
      enhance: Boolean(body.enhance ?? false),
    });
    return res.json({ ...job, status: 'queued' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get('/generate/:jobId', async (req: Request, res: Response) => {
  try { return res.json(await getJobStatus(req.params.jobId)); }
  catch (error) { return res.status(500).json({ error: error instanceof Error ? error.message : String(error) }); }
});

router.post('/generate/:jobId/cancel', async (req: Request, res: Response) => {
  try { return res.json({ cancelled: await cancelJob(req.params.jobId) }); }
  catch (error) { return res.status(500).json({ error: error instanceof Error ? error.message : String(error) }); }
});

export default router;
