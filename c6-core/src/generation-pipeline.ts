import type {GenerationRequest,GenerationResult,MusicGenerationProvider,ProviderContext} from "./contracts";
import {appendOperation,type C6MusicProject} from "./project";
export interface GenerationPipelineResult { project:C6MusicProject; result:GenerationResult; }
export async function generateIntoProject(provider:MusicGenerationProvider,project:C6MusicProject,request:GenerationRequest,context:ProviderContext):Promise<GenerationPipelineResult>{
 const result=await provider.generate(request,context);
 const next=appendOperation(project,{id:`generate-${context.jobId}`,timestamp:Date.now(),type:"ai.generate",payload:{provider:provider.id,assetIds:result.assets.map(a=>a.id),prompt:request.prompt},reversible:true});
 return {project:next,result};
}
