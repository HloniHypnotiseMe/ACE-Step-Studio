import { useEffect, useRef, useState } from "react";
import { addAssetTrack, createProject, moveProjectClip, resizeProjectClip, duplicateProjectClip, splitProjectClip, deleteProjectClip, moveProjectClipToTrack, type C6MusicProject } from "../../../c6-core/src/project";
import { snapSeconds } from "../../../c6-core/src/timeline";
import { createImportedAsset } from "../../../c6-core/src/importer";
import { BrowserAudioEngine } from "./audio/AudioEngine";
import { Waveform } from "./audio/Waveform";
import { PianoRoll } from "./PianoRoll";
import { ImportAudio } from "./ImportAudio";
import { BrowserRecorder } from "./recording/Recorder";
import { createGeneration, waitForGeneration } from "./api/GenerationClient";
import { createStemJob, waitForStemJob } from "./api/StemClient";
import { getStoredAsset, loadProject, saveProject, storeAsset } from "./persistence/ProjectStorage";
import { exportProjectPackage, importProjectPackage } from "./persistence/ProjectPackage";
import { RuntimeStatus } from "./RuntimeStatus";
import { ModelManagerPanel } from "./ModelManagerPanel";
import { MixerPanel } from "./MixerPanel";
import { useProjectHistory } from "./persistence/useProjectHistory";

type StudioAsset = { id: string; uri: string; name: string; durationSeconds?: number };
const TIMELINE_SECONDS = 32;

export function StudioApp() {
  const { project, setProject, apply: applyProject, undo, redo, canUndo, canRedo } = useProjectHistory(createProject("C6 Music Studio"));
  const [prompt, setPrompt] = useState("dark amapiano, warm bass, atmospheric keys, modern drums");
  const [playing, setPlaying] = useState(false);
  const [transportSeconds, setTransportSeconds] = useState(0);
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState<string>();
  const [generating, setGenerating] = useState(false);
  const [recording, setRecording] = useState(false);
  const [splittingTrackId, setSplittingTrackId] = useState<string>();
  const [status, setStatus] = useState("Ready");
  const [waveform, setWaveform] = useState<Float32Array>();
  const [loaded, setLoaded] = useState(false);
  const engine = useRef(new BrowserAudioEngine()).current;
  const recorder = useRef(new BrowserRecorder()).current;

  const assets: StudioAsset[] = project.tracks.flatMap(track => track.assets.map(asset => ({ id: asset.id, uri: asset.uri, name: track.name, durationSeconds: asset.durationSeconds })));
  const selectedClip = selectedClipId ? project.clips.find(clip => clip.id === selectedClipId) : undefined;
  const selectedSource = selectedClip ? project.tracks.find(track => track.id === selectedClip.trackId)?.assets.find(asset => asset.id === selectedClip.assetId) : undefined;

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
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (editing) return;
      if (event.code === "Space") {
        event.preventDefault();
        void toggle();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (!selectedClipId) return;
        event.preventDefault();
        applyProject(current => deleteProjectClip(current, selectedClipId));
        setSelectedClipId(undefined);
        return;
      }
      if (!selectedClipId || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const step = event.shiftKey ? 1 : 0.25;
      applyProject(current => {
        const clip = current.clips.find(item => item.id === selectedClipId);
        if (!clip) return current;
        const next = Math.max(0, clip.startSeconds + (event.key === "ArrowRight" ? step : -step));
        return moveProjectClip(current, selectedClipId, snapSeconds(next, current.bpm));
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [applyProject, redo, selectedClipId, undo]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const position = engine.positionSeconds;
      setTransportSeconds(position);
      if (playing) setPlayheadSeconds(position);
      if (playing && engine.state === "stopped") setPlaying(false);
    }, 50);
    return () => window.clearInterval(timer);
  }, [engine, playing]);

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
    applyProject(currentProject => addAssetTrack(currentProject, audioAsset, asset.name || "Audio"));
  };

  const updateTrack = (id: string, patch: Partial<C6MusicProject["tracks"][number]>) => {
    applyProject(currentProject => ({
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
      if (track.muted || (soloActive && !track.solo)) continue;
      for (const clip of project.clips.filter(item => item.trackId === track.id)) {
        const asset = track.assets.find(item => item.id === clip.assetId);
        if (!asset) continue;
        void engine.playClip({
          id: clip.id,
          uri: asset.uri,
          startSeconds: clip.startSeconds,
          offsetSeconds: (clip.sourceOffsetSeconds ?? 0) + Math.max(0, position - clip.startSeconds),
          durationSeconds: clip.durationSeconds,
          gain: Math.pow(10, (track.gainDb + clip.gainDb) / 20),
          pan: track.pan
        });
      }
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

  const generate = async (batchSize = 1, taskType: "text2music" | "cover" | "repaint" = "text2music") => {
    if (generating) return;
    setGenerating(true);
    setStatus(taskType === "repaint" ? "Queueing AI repaint…" : taskType === "cover" ? "Queueing AI cover…" : batchSize > 1 ? "Queueing " + batchSize + " AI variations…" : "Queueing generation…");
    try {
      if (taskType !== "text2music" && !selectedSource) throw new Error("Select an audio clip first");
      const job = await createGeneration({ prompt, batchSize, taskType, sourceAudioUrl: selectedSource?.uri, repaintingStart: taskType === "repaint" ? (selectedClip?.sourceOffsetSeconds ?? 0) : undefined, repaintingEnd: taskType === "repaint" ? (selectedClip?.sourceOffsetSeconds ?? 0) + (selectedClip?.durationSeconds ?? 0) : undefined });
      const result = await waitForGeneration(job.jobId, s => setStatus(s.stage || s.status));
      if (result.audioUrls.length === 0) throw new Error("Generation returned no audio assets");
      result.audioUrls.forEach((uri, index) => {
        addAsset({
          id: crypto.randomUUID(),
          uri,
          name: batchSize > 1 ? `AI Variation ${index + 1}` : "AI Generation",
          format: "mp3",
          durationSeconds: result.duration
        });
      });
      setStatus(taskType === "repaint" ? "Repainted " + result.audioUrls.length + " asset(s)" : taskType === "cover" ? "Created " + result.audioUrls.length + " cover asset(s)" : batchSize > 1 ? "Generated " + result.audioUrls.length + " variations" : "Generated in " + (result.generationTime ?? "—") + "s");
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

  const exportPackage = async () => {
    try {
      const blob = await exportProjectPackage(project, getStoredAsset);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${project.name.replace(/[^a-z0-9-_]+/gi, "-") || "c6-project"}.c6proj`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Project package exported");
    } catch (error) {
      setStatus(error instanceof Error ? `Export failed: ${error.message}` : "Export failed");
    }
  };

  const importPackage = async (file: File) => {
    try {
      engine.stop();
      const restored = await importProjectPackage(file, storeAsset);
      setProject({
        ...restored.project,
        clips: restored.project.clips ?? [],
        tracks: restored.project.tracks.map(track => ({
          ...track,
          assets: track.assets.map(asset => ({ ...asset, uri: restored.assets.get(asset.id) ?? asset.uri }))
        }))
      }, true);
      setPlaying(false);
      setStatus(`Imported ${file.name}`);
    } catch (error) {
      setStatus(error instanceof Error ? `Import failed: ${error.message}` : "Import failed");
    }
  };

  const pickPackage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".c6proj,application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void importPackage(file);
    };
    input.click();
  };

  const reset = () => {
    engine.stop();
    setPlaying(false);
    setSelectedClipId(undefined);
    setPlayheadSeconds(0);
    setProject(createProject("C6 Music Studio"), true);
    setWaveform(undefined);
    setStatus("New project");
  };


  const loadSavedProject = async () => {
    try {
      const saved = await loadProject();
      if (!saved) { setStatus("No saved project"); return; }
      setProject({
        ...saved.project,
        clips: saved.project.clips ?? [],
        tracks: saved.project.tracks.map(track => ({
          ...track,
          assets: track.assets.map(asset => ({ ...asset, uri: saved.assets.get(asset.id) ?? asset.uri }))
        }))
      }, true);
      setPlaying(false);
      setSelectedClipId(undefined);
      setPlayheadSeconds(0);
      setStatus("Project loaded");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed");
    }
  };
  return <main className="studio-shell">
    <header className="topbar">
      <div><strong>C6 MUSIC STUDIO</strong><span> LOCAL AI WORKSTATION</span></div>
      <div><button onClick={manualSave}>Save</button><button onClick={undo} disabled={!canUndo}>Undo</button><button onClick={redo} disabled={!canRedo}>Redo</button><button onClick={() => void exportPackage()}>Export</button><button onClick={pickPackage}>Import</button><button onClick={() => void loadSavedProject()}>Load</button><button onClick={reset}>New Project</button></div>
    </header>

    <section className="transport">
      <button onClick={toggle}>{playing ? "Pause" : "Play"}</button>
      <button onClick={() => { engine.stop(); setPlaying(false); setTransportSeconds(0); }}>Stop</button>
      <span className="transport-time">{Math.floor(transportSeconds / 60).toString().padStart(2, "0")}:{Math.floor(transportSeconds % 60).toString().padStart(2, "0")}.{Math.floor((transportSeconds % 1) * 10)}</span>
      <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">↶</button><button onClick={redo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">↷</button><span>{project.bpm} BPM</span><span>{project.sampleRate / 1000} kHz</span><span>{assets.length} assets</span>
    </section>

    <section className="workspace">
      <aside className="sidebar">
        <h3>AI PRODUCER</h3>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} />
        <button className="primary" disabled={generating} onClick={() => void generate()}>{generating ? "Generating…" : "Generate Idea"}</button>
        <button disabled={generating} onClick={() => void generate(4)}>Generate 4 Variations</button>
        <div className="ai-actions"><button disabled={generating || !selectedSource} onClick={() => void generate(1, "cover")}>Cover Selected</button><button disabled={generating || !selectedSource} onClick={() => void generate(1, "repaint")}>Repaint Selected</button></div>
        <small className="ai-hint">{selectedSource ? "Selected clip is the AI source." : "Select a timeline clip for Cover/Repaint."}</small>
        <RuntimeStatus />
        <ModelManagerPanel />
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
              const clips = project.clips.filter(item => item.trackId === track.id);
              return <div className="track" key={track.id}>
                <span>{track.name}</span>
                <div className="lane" onClick={event => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const next = snapSeconds(Math.max(0, Math.min(TIMELINE_SECONDS, (event.clientX - rect.left) / rect.width * TIMELINE_SECONDS)), project.bpm);
                  setPlayheadSeconds(next);
                }}>
                  <div className="timeline-playhead" style={{ left: (Math.min(100, Math.max(0, playheadSeconds / TIMELINE_SECONDS * 100))) + "%" }} />
                  {clips.map(clip => {
                    const left = Math.min(100, Math.max(0, clip.startSeconds / TIMELINE_SECONDS * 100));
                    const width = Math.min(100 - left, Math.max(4, clip.durationSeconds / TIMELINE_SECONDS * 100));
                    return <div
                    className={"clip" + (selectedClipId === clip.id ? " selected" : "")}
                    style={{ left: left + "%", width: width + "%" }}
                    onPointerDown={event => {
                      event.stopPropagation();
                      setSelectedClipId(clip.id);
                      const lane = event.currentTarget.parentElement;
                      if (!lane) return;
                      const rect = lane.getBoundingClientRect();
                      const original = clip.startSeconds;
                      const startX = event.clientX;
                      const move = (e: PointerEvent) => {
                        const delta = (e.clientX - startX) / rect.width * TIMELINE_SECONDS;
                        const next = snapSeconds(Math.max(0, original + delta), project.bpm);
                        applyProject(current => moveProjectClip(current, clip.id, next));
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
                    <div className="clip-actions">
                      <button aria-label={`Duplicate ${track.name}`} onPointerDown={event => event.stopPropagation()} onClick={() => applyProject(current => duplicateProjectClip(current, clip.id, Math.max(1, clip.durationSeconds)))}>+</button>
                      <button aria-label={`Split ${track.name}`} onPointerDown={event => event.stopPropagation()} onClick={() => applyProject(current => splitProjectClip(current, clip.id, clip.startSeconds + clip.durationSeconds / 2))}>Split</button>
                      <button aria-label={`Delete ${track.name}`} onPointerDown={event => event.stopPropagation()} onClick={() => applyProject(current => deleteProjectClip(current, clip.id))}>×</button>
                      <button
                        aria-label={`Move ${track.name} to next track`}
                        onPointerDown={event => event.stopPropagation()}
                        onClick={() => {
                          const index = project.tracks.findIndex(item => item.id === track.id);
                          const target = project.tracks[index + 1];
                          if (target) applyProject(current => moveProjectClipToTrack(current, clip.id, target.id));
                        }}
                      >↕</button>
                    </div>
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
                          applyProject(current => resizeProjectClip(current, clip.id, next));
                        };
                        const up = () => {
                          window.removeEventListener("pointermove", move);
                          window.removeEventListener("pointerup", up);
                        };
                        window.addEventListener("pointermove", move);
                        window.addEventListener("pointerup", up, { once: true });
                      }}
                    />
                  </div>;
                  })}
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

    <MixerPanel project={project} onTrackChange={updateTrack} />
    <section className="piano-panel"><div className="section-title">PIANO ROLL</div><PianoRoll /></section>
    <footer>{status} · Prompt → Generate → Edit → Arrange → Mix → Master → Export</footer>
  </main>;
}