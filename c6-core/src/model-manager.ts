import type {HardwareBackend,ModelManifest,ModelRegistry} from "./model-registry";
export interface HardwareProfile { backend:HardwareBackend; vramGb?:number; cpuCores?:number; ramGb?:number; }
export class ModelManager {
 constructor(private readonly registry:ModelRegistry){}
 recommend(profile:HardwareProfile):ModelManifest[]{return this.registry.eligible(profile.backend,profile.vramGb ?? 0);}

 commercialReady(profile:HardwareProfile):ModelManifest[]{return this.recommend(profile).filter(model=>model.commercialRedistribution);}
}
