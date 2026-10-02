import {useRef} from "react";
import {createImportedAsset} from "../../../c6-core/src/importer";
export function ImportAudio({onImport}:{onImport:(asset:ReturnType<typeof createImportedAsset>)=>void}){
 const ref=useRef<HTMLInputElement>(null);
 return <><input ref={ref} type="file" accept="audio/*" hidden onChange={e=>{const f=e.target.files?.[0];if(!f)return;const uri=URL.createObjectURL(f);onImport(createImportedAsset(crypto.randomUUID(),uri,f.name));}}/><button onClick={()=>ref.current?.click()}>Import Audio</button></>;
}
