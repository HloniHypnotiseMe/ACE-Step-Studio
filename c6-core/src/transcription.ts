import type { AudioAsset, ProviderContext, TranscriptionProvider } from "./contracts.js";
export interface TranscriptSegment { startSeconds:number; endSeconds:number; text:string; confidence?:number; }
export interface TranscriptionRuntime { transcribe(input:AudioAsset,context:ProviderContext):Promise<TranscriptSegment[]>; }
export class RuntimeTranscriptionProvider implements TranscriptionProvider {
 readonly kind="transcription" as const;
 constructor(public readonly id:string,private readonly runtime:TranscriptionRuntime){}
 capabilities():string[]{return ["speech-to-text","lyrics-transcription","timestamped-segments"];}
 transcribe(input:AudioAsset,context:ProviderContext){return this.runtime.transcribe(input,context);}
}