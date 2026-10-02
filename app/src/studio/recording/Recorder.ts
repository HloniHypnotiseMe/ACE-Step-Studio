export interface RecordedAsset { id:string; uri:string; name:string; durationSeconds:number; mimeType:string; }
export class BrowserRecorder {
 private recorder?:MediaRecorder; private chunks:Blob[]=[]; private startedAt=0;
 async start():Promise<void>{
   if(this.recorder?.state==="recording") return;
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});
   const mimeType=["audio/webm;codecs=opus","audio/webm"].find(MediaRecorder.isTypeSupported) || "";
   this.chunks=[]; this.recorder=new MediaRecorder(stream,mimeType?{mimeType}:undefined); this.startedAt=performance.now();
   this.recorder.ondataavailable=e=>{if(e.data.size)this.chunks.push(e.data)};
   this.recorder.start();
 }
 async stop(name="Recording"):Promise<RecordedAsset>{
   const recorder=this.recorder;
   if(!recorder||recorder.state!=="recording") throw new Error("No active recording");
   const stream=recorder.stream;
   await new Promise<void>(resolve=>{recorder.addEventListener("stop",()=>resolve(),{once:true});recorder.stop()});
   stream.getTracks().forEach(t=>t.stop()); this.recorder=undefined;
   const blob=new Blob(this.chunks,{type:this.chunks[0]?.type||"audio/webm"});
   return {id:crypto.randomUUID(),uri:URL.createObjectURL(blob),name,durationSeconds:(performance.now()-this.startedAt)/1000,mimeType:blob.type};
 }
 get recording(){return this.recorder?.state==="recording";}
}