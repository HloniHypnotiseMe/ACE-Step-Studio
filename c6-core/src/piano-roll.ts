import type {MidiClip,MidiNote} from "./midi";
export function moveNote(clip:MidiClip,noteId:string,startBeats:number,pitch:number):MidiClip{return {...clip,notes:clip.notes.map(n=>n.id===noteId?{...n,startBeats,pitch}:n)};}
export function quantizeNotes(clip:MidiClip,gridBeats:number):MidiClip{if(gridBeats<=0)throw new Error("Grid must be positive");return {...clip,notes:clip.notes.map(n=>({...n,startBeats:Math.round(n.startBeats/gridBeats)*gridBeats}))};}
export function transpose(clip:MidiClip,semitones:number):MidiClip{return {...clip,notes:clip.notes.map(n=>({...n,pitch:Math.max(0,Math.min(127,n.pitch+semitones))}))};}
export function deleteNote(clip:MidiClip,noteId:string):MidiClip{return {...clip,notes:clip.notes.filter(n=>n.id!==noteId)};}
