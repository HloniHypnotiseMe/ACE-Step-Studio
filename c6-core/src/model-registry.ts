export type HardwareBackend = "cpu"|"cuda"|"rocm"|"metal";

export interface ModelManifest {
  id:string;
  version:string;
  providerId:string;
  license:string;
  weightsLicense?:string;
  commercialRedistribution:boolean;
  localInference:boolean;
  minVramGb?:number;
  backends:HardwareBackend[];
  provenance:string;
}

export class ModelRegistry {
  private readonly models=new Map<string,ModelManifest>();
  register(model:ModelManifest):void { this.models.set(model.id,model); }
  get(id:string):ModelManifest|undefined { return this.models.get(id); }
  eligible(id:string, backend:HardwareBackend, vramGb:number):boolean {
    const m=this.models.get(id);
    return !!m && m.localInference && m.backends.includes(backend) && (m.minVramGb===undefined || vramGb>=m.minVramGb);
  }
}