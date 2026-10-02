import { useMemo,useRef,useState } from "react";
import { createProject } from "../../../c6-core/src/project";
import { createTimeline } from "../../../c6-core/src/timeline";
import { BrowserAudioEngine } from "./audio/AudioEngine";
import { Waveform } from "./audio/Waveform";

export function StudioApp(){
 const [project,setProject]=useState(()=>createProject("C6 Music Studio"));
 const [prompt,setPrompt]=useState("dark amapiano, warm bass, atmospheric keys, modern drums");
 const [playing,setPlaying]=useState(false);
 const engine=useRef(new BrowserAudioEngine()).current;
 const timeline=useMemo(()=>createTimeline(project.sampleRate,project.bpm),[project]);
 const toggle=()=>{if(playing){engine.pause();setPlaying(false)}else{engine.play();setPlaying(true)}};
 return <main className="studio-shell">
  <header className="topbar"><div><strong>C6 MUSIC STUDIO</strong><span> LOCAL AI WORKSTATION</span></div><button onClick={()=>setProject(createProject("C6 Music Studio"))}>New Project</button></header>
  <section className="transport"><button onClick={toggle}>{playing?"Pause":"Play"}</button><button onClick={()=>{engine.stop();setPlaying(false)}}>Stop</button><span>{project.bpm} BPM</span><span>{project.sampleRate/1000} kHz</span><span>{timeline.tracks.length} tracks</span></section>
  <section className="workspace"><aside className="sidebar"><h3>AI PRODUCER</h3><textarea value={prompt} onChange={e=>setPrompt(e.target.value)}/><button className="primary" onClick={()=>setProject(p=>({...p,metadata:{...p.metadata,lastPrompt:prompt}}))}>Generate Idea</button><h3>PROJECT</h3><div className="card">Editable project<br/><small>AI output becomes editable assets.</small></div></aside>
   <section className="arrangement"><div className="section-title">ARRANGEMENT</div><div className="wave-row"><Waveform/></div>{[...Array(8)].map((_,i)=><div className="track" key={i}><span>Track {i+1}</span><div className="lane"><i style={{left:`${(i*7)%55}%`,width:`${18+(i%4)*7}%`}}/></div></div>)}</section>
  </section><footer>Prompt → Generate → Edit → Arrange → Mix → Master → Export</footer>
 </main>;
}
