export type TransportState="stopped"|"playing"|"paused";
export interface AudioClip { id:string; uri:string; startSeconds:number; gain?:number; }
export class BrowserAudioEngine {
 private ctx?:AudioContext; private startedAt=0; private offset=0; private buffers=new Map<string,AudioBuffer>(); private sources=new Map<string,AudioBufferSourceNode>();
 async ensureContext(){this.ctx ??= new AudioContext(); await this.ctx.resume(); return this.ctx;}
 async decode(uri:string){const ctx=await this.ensureContext(); const cached=this.buffers.get(uri); if(cached)return cached; const response=await fetch(uri); if(!response.ok)throw new Error(`Unable to load audio: ${response.status}`); const buffer=await ctx.decodeAudioData(await response.arrayBuffer()); this.buffers.set(uri,buffer); return buffer;}
 async start(){await this.ensureContext(); this.startedAt=this.ctx!.currentTime-this.offset;}
 play(){if(!this.ctx) void this.start(); else {this.startedAt=this.ctx.currentTime-this.offset; void this.ctx.resume();}}
 pause(){if(this.ctx){this.offset=this.ctx.currentTime-this.startedAt; void this.ctx.suspend();}}
 stop(){this.offset=0; for(const source of this.sources.values())source.stop(); this.sources.clear(); if(this.ctx)void this.ctx.suspend();}
 async playClip(clip:AudioClip){const ctx=await this.ensureContext(); const buffer=await this.decode(clip.uri); const source=ctx.createBufferSource(); source.buffer=buffer; const gain=ctx.createGain(); gain.gain.value=clip.gain ?? 1; source.connect(gain).connect(ctx.destination); source.start(ctx.currentTime,0); this.sources.set(clip.id,source); source.onended=()=>this.sources.delete(clip.id);}
 get state():TransportState{return this.ctx?.state==="running"?"playing":"stopped";}
 get positionSeconds(){return this.ctx?Math.max(0,this.ctx.currentTime-this.startedAt):this.offset;}
}