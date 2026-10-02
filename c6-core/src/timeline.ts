import type { AudioAsset } from "./contracts.js";
export interface TimelineClip { id:string; trackId:string; startSeconds:number; durationSeconds:number; source?:AudioAsset; gainDb:number; }
export interface TimelineTrack { id:string; name:string; kind:"audio"|"midi"|"instrument"|"bus"; clips:TimelineClip[]; }
export interface Timeline { sampleRate:number; bpm:number; tracks:TimelineTrack[]; }
export function createTimeline(sampleRate=48000,bpm=120):Timeline{return {sampleRate,bpm,tracks:[]};}
export function addTrack(t:Timeline,track:TimelineTrack):Timeline{return {...t,tracks:[...t.tracks,track]};}
export function addClip(t:Timeline,clip:TimelineClip):Timeline{
 if(!t.tracks.some(x=>x.id===clip.trackId)) throw new Error(`Track not found: ${clip.trackId}`);
 return {...t,tracks:t.tracks.map(x=>x.id===clip.trackId?{...x,clips:[...x.clips,clip]}:x)};
}