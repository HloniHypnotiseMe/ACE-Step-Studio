export type StemKind="vocals"|"drums"|"bass"|"other"|"instrumental"|"custom";
export interface EditableStem { id:string; kind:StemKind; name:string; assetId:string; trackId:string; gainDb:number; muted:boolean; solo:boolean; }
export interface StemSet { id:string; sourceAssetId:string; stems:EditableStem[]; providerId:string; createdAt:number; }
export function muteStem(stem:EditableStem,muted=true):EditableStem{return {...stem,muted};}
