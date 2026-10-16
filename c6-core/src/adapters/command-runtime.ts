export interface CommandResult { code:number; stdout:string; stderr:string; }
export interface CommandRunner { run(command:string,args:string[],signal?:AbortSignal):Promise<CommandResult>; }
export interface RuntimeHealth { available:boolean; detail:string; }
export class ExternalCommandRuntime {
 constructor(private readonly runner:CommandRunner){}
 async health(command:string):Promise<RuntimeHealth>{try{const r=await this.runner.run(command,["--help"]);return{available:r.code===0,detail:r.code===0?"runtime detected":r.stderr||r.stdout}}catch(e){return{available:false,detail:e instanceof Error?e.message:String(e)}}}
}
