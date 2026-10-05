import { useEffect, useRef, useState } from "react";
import { addAssetTrack, createProject, moveProjectClip, resizeProjectClip, type C6MusicProject } from "../../../c6-core/src/project";
import { snapSeconds } from "../../../c6-core/src/timeline";
import { createImportedAsset } from "../../../c6-core/src/importer";
import { BrowserAudioEngine } from "./audio/AudioEngine";
import { Waveform } from "./audio/Waveform";
import { PianoRoll } from "./PianoRoll";
import { ImportAudio } from "./ImportAudio";
import { BrowserRecorder } from "./recording/Recorder";
import { createGeneration, waitForGeneration } from "./api/GenerationClient";
import { createStemJob, waitForStemJob } from "./api/StemClient";
import { loadProject, saveProject } from "./persistence/ProjectStorage";

type StudioAsset = { id: string; uri: string; name: string; durationSeconds?: number };
const TIMELINE_SECONDS = 32;

export function StudioApp() {
  const [project, setProject] = useState<C6MusicProject>(() => createProject("C6 Music Studio"));
  const [prompt, setPrompt] = useState("dark amapiano, warm bass, atmospheric keys, modern drums");
  const [playing, setPlaying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [recording, setRecording] = useState(false);
  const [splittingTrackId, setSplittingTrackId] = useState<string>();
  const [status, setStatus] = useState("Ready");
  const [waveform, setWaveform] = useState<Float32Array>();
  const [loaded, setLoaded] = useState(false);
  const engine = useRef(new BrowserAudioEngine()).current;
  const recorder = useRef(new BrowserRecorder()).current;

  const assets: StudioAsset[] = project.tracks.flatMap(track =>
    track.assets.map(asset => ({ id: asset.id, uri: asset.uri, name: track.name, durationSeconds: asset.durationSeconds }))
  );

  useEffect(() => {
    let cancelled = false;
    void loadProject().then(saved => {
      if (cancelled) return;
      if (!saved) { setLoaded(true); return; }
      const restored: C6MusicProject = {
        ...saved.project,
        clips: saved.project.clips ?? [],
        tracks: saved.project.tracks.map(track => ({
          ...track,
          assets: track.assets.map(asset => ({ ...asset, uri: saved.assets.get(asset.id) ?? asset.uri }))
        }))
      };
      setProject(restored);
      setStatus(`Loaded project · saved ${new Date(saved.savedAt).toLocaleTimeString()}`);
      setLoaded(true);
    }).catch(error => {
      if (!cancelled) {
        setStatus(error instanceof Error ? `Load failed: ${error.message}` : "Load failed");
        setLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      void saveProject(project).then(() => setStatus("Autosaved")).catch(error => {
        setStatus(error instanceof Error ? `Autosave failed: ${error.message}` : "Autosave failed");
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [project, loaded]);

  useEffect(() => {
    const first = assets[0];
    if (!first) { setWaveform(undefined); return; }
    let cancelled = false;
    void engine.waveform(first.uri).then(w => {
      if (!cancelled) setWaveform(w);
    }).catch(() => { if (!cancelled) setWaveform(undefined); });
    return () => { cancelled = true; };
  }, [assets.length, assets[0]?.uri, engine]);

  const addAsset = (asset: { id: string; uri: string; name?: string; format?: string; durationSeconds?: number }) => {
    const format = (asset.format as "wav" | "flac" | "aiff" | "mp3" | "ogg" | "unknown") || "unknown";
    const audioAsset = { id: asset.id, uri: asset.uri, format, durationSeconds: asset.durationSeconds };
    setProject(currentProject => addAssetTrack(currentProject, audioAsset, asset.name || "Audio"));
  };

  const updateTrack = (id: string, patch: Partial<C6MusicProject["tracks"][number]>) => {
    setProject(currentProject => ({
      ...currentProject,
      tracks: currentProject.tracks.map(track => track.id === id ? { ...track, ...patch } : track)
    }));
  };

  const toggle = async () => {
    if (playing) {
      engine.pause();
      setPlaying(false);
      return;
    }
    await engine.start();
    setPlaying(true);
    const position = engine.positionSeconds;
    const soloActive = project.tracks.some(track => track.solo);
    for (const track of project.tracks) {
      const asset = track.assets[0];
      const clip = project.clips.find(item => item.trackId === track.id);
      if (!asset || !clip || track.muted || (soloActive && !track.solo)) continue;
      void engine.playClip({
        id: track.id,
        uri: asset.uri,
        startSeconds: clip.startSeconds,
        offsetSeconds: Math.max(0, position - clip.startSeconds),
        durationSeconds: clip.durationSeconds,
        gain: Math.pow(10, (track.gainDb + clip.gainDb) / 20),
        pan: track.pan
      });
    }
  };

  const toggleRecording = async () => {
    try {
      if (recording) {
        const result = await recorder.stop();
        addAsset(result);
        setRecording(false);
        setStatus("Recording added to project");
      } else {
        await recorder.start();
        setRecording(true);
        setStatus("Recording…");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Recording failed");
      setRecording(false);
    }
  };

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    setStatus("Queueing generation…");
    try {
      const job = await createGeneration({ prompt });
      const result = await waitForGeneration(job.jobId, s => setStatus(s.stage || s.status));
      const uri = result.audioUrls[0];
      if (!uri) throw new Error("Generation returned no audio asset");
      addAsset(createImportedAsset(crypto.randomUUID(), uri, "AI Generation"));
      setStatus(`Generated in ${result.generationTime ?? "—"}s`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const splitStems = async (trackId: string) => {
    if (splittingTrackId) return;
    const track = project.tracks.find(item => item.id === trackId);
    const asset = track?.assets[0];
    if (!track || !asset) return;
    setSplittingTrackId(trackId);
    setStatus(`Sending ${track.name} to local StemDeck…`);
    try {
      const job = await createStemJob(asset.uri, `${track.name}.wav`);
      const result = await waitForStemJob(job.job_id, state => setStatus(state.stage || `Stem separation ${state.status}`));
      for (const stem of result.stems || []) {
        addAsset({
          id: crypto.randomUUID(),
          uri: stem.url,
          name: `${track.name} · ${stem.name}`,
          format: "wav",
          durationSeconds: result.duration_sec ?? asset.durationSeconds
        });
      }
      setStatus(`Created ${result.stems?.length ?? 0} editable stems`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Stem separation failed");
    } finally {
      setSplittingTrackId(undefined);
    }
  };

  const manualSave = async () => {
    try {
      await saveProject(project);
      setStatus(`Saved ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const reset = () => {
    engine.stop();
    setPlaying(false);
    setProject(createProject("C6 Music Studio"));
    setWaveform(undefined);
    setStatus("New project");
  };

  return <main className="studio-shell">
    <header className="topbar">
      <div><strong>C6 MUSIC STUDIO</strong><span> LOCAL AI WORKSTATION</span></div>
      <div><button onClick={manualSave}>Save</button><button onClick={() => void loadProject().then(saved => {
        if (!saved) { setStatus("No saved project"); return; }
        setProject({ ...saved.project, clips: saved.project.clips ?? [], tracks: saved.project.tracks.map(track => ({
          ...track, assets: track.assets.map(asset => ({ ...asset, uri: saved.assets.get(asset.id) ?? asset.uri }))
        })) });
        setPlaying(false);
        setStatus("Project loaded");
      }).catch(error => setStatus(error instanceof Error ? error.message : "Load failed"))}>Load</button><button onClick={reset}>New Project</button></div>
    </header>

    <section className="transport">
      <button onClick={toggle}>{playing ? "Pause" : "Play"}</button>
      <button onClick={() => { engine.stop(); setPlaying(false); }}>Stop</button>
      <span>{project.bpm} BPM</span><span>{project.sampleRate / 1000} kHz</span><span>{assets.length} assets</span>
    </section>

    <section className="workspace">
      <aside className="sidebar">
        <h3>AI PRODUCER</h3>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} />
        <button className="primary" disabled={generating} onClick={generate}>{generating ? "Generating…" : "Generate Idea"}</button>
        <h3>PROJECT</h3>
        <ImportAudio onImport={addAsset} />
        <button onClick={toggleRecording}>{recording ? "Stop Recording" : "Record"}</button>
        <div className="card"><strong>{assets.length} audio assets</strong><br /><small>Stored locally with the project.</small></div>
        {assets.map(asset => <div className="card" key={asset.id}><strong>{asset.name}</strong><br /><small>{asset.uri}</small></div>)}
      </aside>

      <section className="arrangement">
        <div className="section-title">ARRANGEMENT <small>Drag clips · resize right edge · snap: 1 beat</small></div>
        <div className="timeline-ruler">{[0, 4, 8, 12, 16, 20, 24, 28, 32].map(second => <span key={second}>{second}s</span>)}</div>
        <div className="wave-row"><Waveform samples={waveform} /></div>

        {project.tracks.length === 0
          ? [...Array(4)].map((_, i) => <div className="track" key={i}><span>Track {i + 1}</span><div className="lane" /></div>)
          : project.tracks.map(track => {
              const asset = track.assets[0];
              const clip = project.clips.find(item => item.trackId === track.id);
              const left = clip ? Math.min(100, Math.max(0, clip.startSeconds / TIMELINE_SECONDS * 100)) : 0;
              const width = clip ? Math.min(100 - left, Math.max(4, clip.durationSeconds / TIMELINE_SECONDS * 100)) : Math.min(100, Math.max(4, (asset?.durationSeconds ?? 8) / TIMELINE_SECONDS * 100));
              return <div className="track" key={track.id}>
                <span>{track.name}</span>
                <div className="lane">
                  {clip && <i
                    className="clip"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onPointerDown={event => {
                      event.stopPropagation();
                      const lane = event.currentTarget.parentElement;
                      if (!lane) return;
                      const rect = lane.getBoundingClientRect();
                      const original = clip.startSeconds;
                      const startX = event.clientX;
                      const move = (e: PointerEvent) => {
                        const delta = (e.clientX - startX) / rect.width * TIMELINE_SECONDS;
                        const next = snapSeconds(Math.max(0, original + delta), project.bpm);
                        setProject(current => moveProjectClip(current, clip.id, next));
                      };
                      const up = () => {
                        window.removeEventListener("pointermove", move);
                        window.removeEventListener("pointerup", up);
                      };
                      window.addEventListener("pointermove", move);
                      window.addEventListener("pointerup", up, { once: true });
                    }}
                  >
                    <span>{track.name} · {clip.startSeconds.toFixed(1)}s</span>
                    <button
                      className="clip-resize"
                      aria-label={`Resize ${track.name}`}
                      onPointerDown={event => {
                        event.stopPropagation();
                        const lane = event.currentTarget.parentElement?.parentElement;
                        if (!lane) return;
                        const rect = lane.getBoundingClientRect();
                        const original = clip.durationSeconds;
                        const startX = event.clientX;
                        const maxDuration = asset?.durationSeconds ?? original + TIMELINE_SECONDS;
                        const move = (e: PointerEvent) => {
                          const delta = (e.clientX - startX) / rect.width * TIMELINE_SECONDS;
                          const next = Math.min(maxDuration, Math.max(0.25, snapSeconds(original + delta, project.bpm)));
                          setProject(current => resizeProjectClip(current, clip.id, next));
                        };
                        const up = () => {
                          window.removeEventListener("pointermove", move);
                          window.removeEventListener("pointerup", up);
                        };
                        window.addEventListener("pointermove", move);
                        window.addEventListener("pointerup", up, { once: true });
                      }}
                    />
                  </i>}
                </div>
                <div className="track-controls">
                  <button onClick={() => updateTrack(track.id, { muted: !track.muted })}>{track.muted ? "Unmute" : "Mute"}</button>
                  <button onClick={() => updateTrack(track.id, { solo: !track.solo })}>{track.solo ? "Unsolo" : "Solo"}</button>
                  <button disabled={Boolean(splittingTrackId)} onClick={() => void splitStems(track.id)}>{splittingTrackId === track.id ? "Splitting…" : "Split Stems"}</button>
                </div>
              </div>;
            })}
      </section>
    </section>

    <section className="piano-panel"><div className="section-title">PIANO ROLL</div><PianoRoll /></section>
    <footer>{status} · Prompt → Generate → Edit → Arrange → Mix → Master → Export</footer>
  </main>;
}