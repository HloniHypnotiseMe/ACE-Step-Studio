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
  list():ModelManifest[] { return [...this.models.values()]; }

  eligible(backend:HardwareBackend,vramGb=0):ModelManifest[] {
    return this.list().filter(model =>
      model.localInference &&
      model.backends.includes(backend) &&
      (model.minVramGb===undefined || vramGb>=model.minVramGb)
    );
  }

  isEligible(id:string,backend:HardwareBackend,vramGb=0):boolean {
    return this.eligible(backend,vramGb).some(model=>model.id===id);
  }
}