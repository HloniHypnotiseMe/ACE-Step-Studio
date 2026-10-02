export type TransportState="stopped"|"playing"|"paused";
export class BrowserAudioEngine {
 private ctx?:AudioContext; private startedAt=0; private offset=0;
 async start(){this.ctx ??= new AudioContext(); await this.ctx.resume(); this.startedAt=this.ctx.currentTime-this.offset;}
 play(){if(!this.ctx) void this.start(); else {this.startedAt=this.ctx.currentTime-this.offset; this.ctx.resume();}}
 pause(){if(this.ctx){this.offset=this.ctx.currentTime-this.startedAt; void this.ctx.suspend();}}
 stop(){this.offset=0; if(this.ctx) void this.ctx.suspend();}
 get state():TransportState{return this.ctx?.state==="running"?"playing":"stopped";}
 get positionSeconds(){return this.ctx?Math.max(0,this.ctx.currentTime-this.startedAt):this.offset;}
}
