import {describe,expect,it} from "vitest";
import {assertRealtimeSafe,ModelRegistry} from "../src/index.js";

describe("runtime safety gates",()=>{
  it("blocks AI work from the realtime audio thread",()=>{
    expect(()=>assertRealtimeSafe("llm.inference")).toThrow();
    expect(()=>assertRealtimeSafe("diffusion.generate")).toThrow();
    expect(()=>assertRealtimeSafe("audio.buffer")).not.toThrow();
  });
  it("filters models by hardware and local-use requirements",()=>{
    const r=new ModelRegistry();
    r.register({id:"test",version:"1",providerId:"x",license:"MIT",commercialRedistribution:true,localInference:true,minVramGb:8,backends:["cuda"],provenance:"test"});
    expect(r.eligible("test","cuda",12)).toBe(true);
    expect(r.eligible("test","cuda",4)).toBe(false);
    expect(r.eligible("test","cpu",32)).toBe(false);
  });
});