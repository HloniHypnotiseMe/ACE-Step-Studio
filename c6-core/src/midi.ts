export interface MidiNote { id:string; pitch:number; velocity:number; startBeats:number; durationBeats:number; }
export interface MidiClip { id:string; trackId:string; startBeats:number; lengthBeats:number; notes:MidiNote[]; }
export function addMidiNote(clip:MidiClip,note:MidiNote):MidiClip { return {...clip,notes:[...clip.notes,note]}; }
export function beatsToSeconds(beats:number,bpm:number):number { return beats*60/bpm; }
