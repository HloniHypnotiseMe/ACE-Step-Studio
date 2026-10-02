import { useEffect,useRef,useState } from "react";
import { createProject } from "../../../c6-core/src/project";
import { createImportedAsset } from "../../../c6-core/src/importer";
import { BrowserAudioEngine } from "./audio/AudioEngine";
import { Waveform } from "./audio/Waveform";
import { PianoRoll } from "./PianoRoll";
import { ImportAudio } from "./ImportAudio";
import { createGeneration, waitForGeneration } from "./api/GenerationClient";

type StudioAsset={id:string;uri:string;name:string;durationSeconds?:number};
type TrackState={id:string;name:string;gainDb:number;pan:number;muted:boolean;solo:boolean;asset:StudioAsset};

export function StudioApp(){
 const [project,setProject]=useState(()=>createProject("C6 Music Studio"));
 const [prompt,setPrompt]=useState("dark amapiano, warm bass, atmospheric keys, modern drums");
 const [playing,setPlaying]=useState(false),[generating,setGenerating]=useState(false),[status,setStatus]=useState("Ready");
 const [assets,setAssets]=useState<StudioAsset[]>([]),[waveform,setWaveform]=useState<Float32Array>();
 const [tracks,setTracks]=useState<TrackState[]>([]);
 const engine=useRef(new BrowserAudioEngine()).current;

 const addAsset=(asset:{id:string;uri:string;name?:string;format?:string;durationSeconds?:number})=>{
   const a={id:asset.id,uri:asset.uri,name:asset.name||"Audio",durationSeconds:asset.durationSeconds};
   setAssets(items=>[...items,a]); setTracks(items=>[...items,{id:a.id,name:a.name,gainDb:0,pan:0,muted:false,solo:false,asset:a}]);
   setProject(p=>({...p,tracks:[...p.tracks,{id:a.id,name:a.name,type:"audio",gainDb:0,pan:0,muted:false,solo:false,assets:[{id:a.id,uri:a.uri,format:(asset.format as "wav"|"flac"|"aiff"|"mp3"|"ogg"|"unknown")||"unknown",durationSeconds:a.durationSeconds}]}]}));
 };

 useEffect(()=>{const first=assets[0]; if(!first)return; let cancelled=false; engine.waveform(first.uri).then(w=>{if(!cancelled)setWaveform(w)}).catch(()=>setWaveform(undefined)); return()=>{cancelled=true}},[assets,engine]);

 const toggle=async()=>{
   if(playing){engine.pause();setPlaying(false);return;}
   await engine.start(); setPlaying(true);
   const soloActive=tracks.some(t=>t.solo);
   for(const t of tracks) if((!soloActive||t.solo)&&!t.muted) void engine.playClip({id:t.id,uri:t.asset.uri,startSeconds:0,gain:Math.pow(10,t.gainDb/20),pan:t.pan});
 };
 const updateTrack=(id:string,patch:Partial<TrackState>)=>setTracks(ts=>ts.map(t=>t.id===id?{...t,...patch}:t));
 const generate=async()=>{if(generating)return;setGenerating(true);setStatus("Queueing generation…");try{const job=await createGeneration({prompt});const result=await waitForGeneration(job.jobId,s=>setStatus(s.stage||s.status));const uri=result.audioUrls[0];if(!uri)throw new Error("Generation returned no audio asset");addAsset(createImportedAsset(crypto.randomUUID(),uri,"AI Generation"));setStatus(`Generated in ${result.generationTime??"—"}s`)}catch(error){setStatus(error instanceof Error?error.message:"Generation failed")}finally{setGenerating(false)}};

 const reset=()=>{engine.stop();setPlaying(false);setAssets([]);setTracks([]);setWaveform(undefined);setProject(createProject("C6 Music Studio"));setStatus("New project")};

 return <main className="studio-shell">
  <header className="topbar"><div><strong>C6 MUSIC STUDIO</strong><span> LOCAL AI WORKSTATION</span></div><button onClick={reset}>New Project</button></header>
  <section className="transport"><button onClick={toggle}>{playing?"Pause":"Play"}</button><button onClick={()=>{engine.stop();setPlaying(false)}}>Stop</button><span>{project.bpm} BPM</span><span>{project.sampleRate/1000} kHz</span><span>{assets.length} assets</span></section>
  <section className="workspace"><aside className="sidebar"><h3>AI PRODUCER</h3><textarea value={prompt} onChange={e=>setPrompt(e.target.value)}/><button className="primary" disabled={generating} onClick={generate}>{generating?"Generating…":"Generate Idea"}</button><h3>PROJECT</h3><ImportAudio onImport={addAsset}/><div className="card"><strong>{assets.length} audio assets</strong><br/><small>Decoded locally into editable playback.</small></div>{assets.map(asset=><div className="card" key={asset.id}><strong>{asset.name}</strong><br/><small>{asset.uri}</small></div>)}</aside>
   <section className="arrangement"><div className="section-title">ARRANGEMENT</div><div className="wave-row"><Waveform samples={waveform}/></div>{tracks.length===0?[...Array(4)].map((_,i)=><div className="track" key={i}><span>Track {i+1}</span><div className="lane"/></div>):tracks.map(track=><div className="track" key={track.id}><span>{track.name}</span><div className="lane"><i style={{left:"0%",width:"72%"}}/></div><button onClick={()=>updateTrack(track.id,{muted:!track.muted})}>{track.muted?"Unmute":"Mute"}</button><button onClick={()=>updateTrack(track.id,{solo:!track.solo})}>{track.solo?"Unsolo":"Solo"}</button></div>)}</section>
  </section><section className="piano-panel"><div className="section-title">PIANO ROLL</div><PianoRoll/></section><footer>{status} · Prompt → Generate → Edit → Arrange → Mix → Master → Export</footer>
 </main>;
}