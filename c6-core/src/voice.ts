import type { ProviderContext, VoiceProvider } from "./contracts.js";
import type { AudioAsset } from "./contracts.js";
export interface VoiceRequest { text:string; voiceId?:string; language?:string; parameters?:Record<string,unknown>; }
export interface VoiceResult { assets:AudioAsset[]; metadata:Record<string,unknown>; }
export interface VoiceRuntime { synthesize(request:VoiceRequest,context:ProviderContext):Promise<VoiceResult>; }
export class RuntimeVoiceProvider implements VoiceProvider {
 readonly kind="voice" as const;
 constructor(public readonly id:string,private readonly runtime:VoiceRuntime){}
 capabilities():string[]{return ["text-to-speech","voice-design","voice-cloning-with-consent-gate"];}
 synthesize(request:VoiceRequest,context:ProviderContext){return this.runtime.synthesize(request,context);}
}