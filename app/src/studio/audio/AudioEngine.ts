export type TransportState="stopped"|"playing"|"paused";
export interface AudioClip { id:string; uri:string; startSeconds:number; gain?:number; pan?:number; muted?:boolean; }

export class BrowserAudioEngine {
 private ctx?:AudioContext; private startedAt=0; private offset=0;
 private buffers=new Map<string,AudioBuffer>(); private sources=new Map<string,AudioBufferSourceNode>();

 async ensureContext(){this.ctx ??= new AudioContext(); await this.ctx.resume(); return this.ctx;}
 async decode(uri:string){const ctx=await this.ensureContext(); const cached=this.buffers.get(uri); if(cached)return cached; const response=await fetch(uri); if(!response.ok)throw new Error(`Unable to load audio: ${response.status}`); const buffer=await ctx.decodeAudioData(await response.arrayBuffer()); this.buffers.set(uri,buffer); return buffer;}

 async waveform(uri:string,bins=900){
   const buffer=await this.decode(uri); const channels=buffer.numberOfChannels; const length=buffer.length;
   const out=new Float32Array(Math.min(bins,length)); const block=Math.max(1,Math.floor(length/out.length));
   for(let i=0;i<out.length;i++){const start=i*block; const end=Math.min(length,start+block); let peak=0;
     for(let c=0;c<channels;c++){const data=buffer.getChannelData(c); for(let j=start;j<end;j++)peak=Math.max(peak,Math.abs(data[j]));}
     out[i]=peak;
   } return out;
 }

 async start(){await this.ensureContext(); this.startedAt=this.ctx!.currentTime-this.offset;}
 play(){if(!this.ctx) void this.start(); else {this.startedAt=this.ctx.currentTime-this.offset; void this.ctx.resume();}}
 pause(){if(this.ctx){this.offset=this.ctx.currentTime-this.startedAt; void this.ctx.suspend();}}
 stop(){this.offset=0; for(const source of this.sources.values()){try{source.stop();}catch{}} this.sources.clear(); if(this.ctx)void this.ctx.suspend();}

 async playClip(clip:AudioClip){
   const ctx=await this.ensureContext(); const buffer=await this.decode(clip.uri); const source=ctx.createBufferSource(); source.buffer=buffer;
   const gain=ctx.createGain(); gain.gain.value=clip.muted?0:(clip.gain ?? 1);
   const pan=ctx.createStereoPanner(); pan.pan.value=clip.pan ?? 0;
   source.connect(gain).connect(pan).connect(ctx.destination);
   const when=ctx.currentTime+Math.max(0,clip.startSeconds-this.positionSeconds);
   source.start(when); this.sources.set(clip.id,source); source.onended=()=>this.sources.delete(clip.id);
 }

 get state():TransportState{return this.ctx?.state==="running"?"playing":"stopped";}
 get positionSeconds(){return this.ctx?Math.max(0,this.ctx.currentTime-this.startedAt):this.offset;}
}