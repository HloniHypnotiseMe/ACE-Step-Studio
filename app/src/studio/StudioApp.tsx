import { useMemo,useRef,useState } from "react";
import { createProject } from "../../../c6-core/src/project";
import { createTimeline } from "../../../c6-core/src/timeline";
import { createImportedAsset } from "../../../c6-core/src/importer";
import { BrowserAudioEngine } from "./audio/AudioEngine";
import { Waveform } from "./audio/Waveform";
import { PianoRoll } from "./PianoRoll";
import { ImportAudio } from "./ImportAudio";
import { createGeneration, waitForGeneration } from "./api/GenerationClient";

type StudioAsset={id:string;uri:string;name:string};

export function StudioApp(){
 const [project,setProject]=useState(()=>createProject("C6 Music Studio"));
 const [prompt,setPrompt]=useState("dark amapiano, warm bass, atmospheric keys, modern drums");
 const [playing,setPlaying]=useState(false);
 const [generating,setGenerating]=useState(false);
 const [status,setStatus]=useState("Ready");
 const [assets,setAssets]=useState<StudioAsset[]>([]);
 const engine=useRef(new BrowserAudioEngine()).current;
 const timeline=useMemo(()=>createTimeline(project.sampleRate,project.bpm),[project]);

 const addAsset=(asset:{id:string;uri:string;name?:string})=>{
   const name=asset.name || "Audio";
   setAssets(items=>[...items,{id:asset.id,uri:asset.uri,name}]);
   setProject(p=>({...p,tracks:[...p.tracks,{id:asset.id,name,type:"audio",gainDb:0,pan:0,muted:false,solo:false,assets:[asset.id]}]}));
 };

 const toggle=()=>{if(playing){engine.pause();setPlaying(false)}else{engine.play();setPlaying(true)}};

 const generate=async()=>{
   if(generating)return;
   setGenerating(true);setStatus("Queueing generation…");
   try{
     const job=await createGeneration({prompt});
     const result=await waitForGeneration(job.jobId,s=>setStatus(s.stage||s.status));
     const uri=result.audioUrls[0];
     if(!uri)throw new Error("Generation returned no audio asset");
     addAsset(createImportedAsset(crypto.randomUUID(),uri,"AI Generation"));
     setStatus(`Generated in ${result.generationTime ?? "—"}s`);
   }catch(error){
     setStatus(error instanceof Error?error.message:"Generation failed");
   }finally{setGenerating(false);}
 };

 return <main className="studio-shell">
  <header className="topbar"><div><strong>C6 MUSIC STUDIO</strong><span> LOCAL AI WORKSTATION</span></div><button onClick={()=>{setProject(createProject("C6 Music Studio"));setAssets([]);setStatus("New project")}}>New Project</button></header>
  <section className="transport"><button onClick={toggle}>{playing?"Pause":"Play"}</button><button onClick={()=>{engine.stop();setPlaying(false)}}>Stop</button><span>{project.bpm} BPM</span><span>{project.sampleRate/1000} kHz</span><span>{assets.length} assets</span></section>
  <section className="workspace"><aside className="sidebar"><h3>AI PRODUCER</h3><textarea value={prompt} onChange={e=>setPrompt(e.target.value)}/><button className="primary" disabled={generating} onClick={generate}>{generating?"Generating…":"Generate Idea"}</button><h3>PROJECT</h3><ImportAudio onImport={addAsset}/><div className="card"><strong>{assets.length} audio assets</strong><br/><small>Imported and generated audio enters the editable project.</small></div>{assets.map(asset=><div className="card" key={asset.id}><strong>{asset.name}</strong><br/><small>{asset.uri}</small></div>)}</aside>
   <section className="arrangement"><div className="section-title">ARRANGEMENT</div><div className="wave-row"><Waveform/></div>{project.tracks.length===0?[...Array(4)].map((_,i)=><div className="track" key={i}><span>Track {i+1}</span><div className="lane"/></div>):project.tracks.map(track=><div className="track" key={track.id}><span>{track.name}</span><div className="lane"><i style={{left:"0%",width:"72%"}}/></div>)}</section>
  </section><section className="piano-panel"><div className="section-title">PIANO ROLL</div><PianoRoll/></section><footer>{status} · Prompt → Generate → Edit → Arrange → Mix → Master → Export</footer>
 </main>;
}
