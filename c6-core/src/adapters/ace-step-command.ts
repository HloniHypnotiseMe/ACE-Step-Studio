import type {GenerationRequest,GenerationResult,ProviderContext} from "../contracts";
import {CommandMusicGenerationProvider,type ProviderCommand} from "./provider-runtime";
import type {CommandRunner} from "./command-runtime";

export interface AceStepCommandConfig { executable:string; outputDir:string; extraArgs?:string[]; }

const spec=(config:AceStepCommandConfig):ProviderCommand=>({
 command:config.executable,
 args:(request:GenerationRequest,context:ProviderContext)=>[
  ...(config.extraArgs??[]),
  "--prompt",request.prompt,
  "--output",`${config.outputDir}/${context.jobId}.wav`,
  ...(request.durationSeconds?["--duration",String(request.durationSeconds)]:[]),
  ...(request.seed!==undefined?["--seed",String(request.seed)]:[])
 ],
 parse:result=>{
  const uri=result.stdout.trim().split(/\r?\n/).find(x=>x.startsWith("file://"))??"";
  if(!uri)throw new Error("ACE-Step runtime did not report an output asset URI");
  return {assets:[{id:`ace-step-${Date.now()}`,uri,format:"wav"}],metadata:{runtime:"ace-step",stdout:result.stdout}};
 }
});

export function createAceStepCommandProvider(config:AceStepCommandConfig,runner:CommandRunner){
 return new CommandMusicGenerationProvider("ace-step-local",["text-to-music","lyrics-to-music","variation","continuation"],runner,spec(config));
}
