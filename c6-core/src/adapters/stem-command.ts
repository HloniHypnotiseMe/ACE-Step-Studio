import type {AudioAsset,ProviderContext,StemSeparationProvider} from "../contracts";
import type {CommandRunner} from "./command-runtime";
export interface StemCommandConfig { executable:string; outputDir:string; extraArgs?:string[]; }
export function createCommandStemProvider(config:StemCommandConfig,runner:CommandRunner):StemSeparationProvider{
 return {kind:"stem-separation",id:"local-stem-command",capabilities:["vocals","drums","bass","other"],async separate(input:AudioAsset,context:ProviderContext){
  const r=await runner.run(config.executable,[...(config.extraArgs??[]),"--input",input.uri,"--output",config.outputDir, "--job-id",context.jobId],context.signal);
  if(r.code!==0)throw new Error(`Stem separation failed: ${r.stderr||r.stdout}`);
  const assets=r.stdout.split(/\r?\n/).filter(x=>x.startsWith("file://")).map((uri,i)=>({id:`${context.jobId}-stem-${i}`,uri,format:"wav" as const}));
  if(!assets.length)throw new Error("Stem runtime returned no output assets");
  return {assets,metadata:{runtime:"local-stem-command",sourceAssetId:input.id}};
 }};
}
