export interface GenerationRequest {
  prompt: string;
  duration?: number;
  seed?: number;
  instrumental?: boolean;
  batchSize?: number;
  audioFormat?: "mp3" | "flac";
  thinking?: boolean;
  enhance?: boolean;
  taskType?: "text2music" | "cover" | "repaint" | "audio2audio";
  sourceAudioUrl?: string;
  referenceAudioUrl?: string;
  bpm?: number;
  keyScale?: string;
  timeSignature?: string;
  repaintingStart?: number;
  repaintingEnd?: number;
}
export interface GenerationResponse { jobId: string; status: "queued"; }
export interface GenerationJobStatus {
  status: "queued" | "running" | "succeeded" | "failed";
  queuePosition?: number; etaSeconds?: number; progress?: number; stage?: string; error?: string;
  result?: { audioUrls: string[]; duration: number; bpm?: number; keyScale?: string; timeSignature?: string; generationTime?: number; };
}
async function json<T>(path:string, init?:RequestInit):Promise<T>{
  const response=await fetch(path,{...init,headers:{"Content-Type":"application/json",...(init?.headers||{})}});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error((payload as {error?:string}).error||`Request failed: ${response.status}`);
  return payload as T;
}
export const createGeneration=(request:GenerationRequest)=>json<GenerationResponse>("/api/c6-local/generate",{method:"POST",body:JSON.stringify(request)});
export const getGenerationStatus=(jobId:string)=>json<GenerationJobStatus>(`/api/c6-local/generate/${encodeURIComponent(jobId)}`);
export const cancelGeneration=(jobId:string)=>json<{cancelled:boolean}>(`/api/c6-local/generate/${encodeURIComponent(jobId)}/cancel`,{method:"POST"});
export async function waitForGeneration(jobId:string,onStatus?:(s:GenerationJobStatus)=>void,signal?:AbortSignal){
  while(!signal?.aborted){
    const status=await getGenerationStatus(jobId); onStatus?.(status);
    if(status.status==="succeeded"&&status.result)return status.result;
    if(status.status==="failed")throw new Error(status.error||"Generation failed");
    await new Promise<void>((resolve,reject)=>{const timer=setTimeout(resolve,1200);signal?.addEventListener("abort",()=>{clearTimeout(timer);reject(new DOMException("Aborted","AbortError"));},{once:true});});
  }
  throw new DOMException("Aborted","AbortError");
}
