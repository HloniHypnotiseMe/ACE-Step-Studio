import {useMemo,useState} from "react";
import type {MidiNote} from "../../../c6-core/src/midi";
export function PianoRoll(){
 const [notes,setNotes]=useState<MidiNote[]>([{id:"n1",pitch:60,velocity:100,startBeats:0,durationBeats:1},{id:"n2",pitch:64,velocity:90,startBeats:1,durationBeats:1}]);
 const rows=useMemo(()=>Array.from({length:12},(_,i)=>72-i),[]);
 return <div className="piano-roll"><div className="piano-keys">{rows.map(p=><div key={p}>{p}</div>)}</div><div className="note-grid">{rows.map(p=><div className="note-row" key={p}>{[0,1,2,3,4,5,6,7].map(b=><div className="beat" key={b} onDoubleClick={()=>setNotes(n=>[...n,{id:crypto.randomUUID(),pitch:p,velocity:100,startBeats:b,durationBeats:1}])}/>)}</div>)}{notes.map(n=><button key={n.id} className="midi-note" style={{left:`${n.startBeats*12.5}%`,top:`${(72-n.pitch)*100/12}%`,width:`${n.durationBeats*12.5}%`}} onDoubleClick={()=>setNotes(v=>v.filter(x=>x.id!==n.id))}>{n.pitch}</button>)}</div></div>;
}
