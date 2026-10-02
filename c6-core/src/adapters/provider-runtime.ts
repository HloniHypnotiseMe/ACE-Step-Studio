import type {GenerationRequest,GenerationResult,MusicGenerationProvider,ProviderContext} from "../contracts";
import type {CommandRunner} from "./command-runtime";
export interface ProviderCommand { command:string; args:(request:GenerationRequest,context:ProviderContext)=>string[]; parse:(result:{stdout:string;stderr:string;code:number})=>GenerationResult; }
export class CommandMusicGenerationProvider implements MusicGenerationProvider {
 readonly kind="music-generation" as const;
 constructor(public readonly id:string,public readonly capabilities:string[],private readonly runner:CommandRunner,private readonly spec:ProviderCommand){}
 async generate(request:GenerationRequest,context:ProviderContext):Promise<GenerationResult>{
  const result=await this.runner.run(this.spec.command,this.spec.args(request,context),context.signal);
  if(result.code!==0)throw new Error(`${this.id} generation failed: ${result.stderr||result.stdout}`);
  return this.spec.parse(result);
 }
}
