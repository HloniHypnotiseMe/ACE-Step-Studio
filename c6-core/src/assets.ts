import type { AudioAsset } from "./contracts";
export interface AssetRecord extends AudioAsset { name:string; source:"generated"|"recorded"|"imported"|"stem"; createdAt:number; provenance?:string; }
export class AssetLibrary {
 private readonly assets=new Map<string,AssetRecord>();
 add(asset:AssetRecord){if(this.assets.has(asset.id))throw new Error(`Asset already exists: ${asset.id}`);this.assets.set(asset.id,asset);return asset;}
 get(id:string){return this.assets.get(id);}
 list(){return [...this.assets.values()];}
 remove(id:string){this.assets.delete(id);}
}
