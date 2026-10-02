import { describe, expect, it } from "vitest";
import { InMemoryProviderRegistry, createProject, appendOperation } from "../src/index.js";

describe("C6 music core", () => {
  it("creates a portable project model", () => {
    const p=createProject("Demo");
    expect(p.schemaVersion).toBe(1);
    expect(p.bpm).toBe(120);
    expect(p.sampleRate).toBe(48000);
  });
  it("records reversible AI operations", () => {
    const p=createProject();
    const next=appendOperation(p,{id:"op-1",timestamp:new Date(0).toISOString(),type:"generation.import",payload:{provider:"ace-step-1.5"},reversible:true});
    expect(next.operations).toHaveLength(1);
    expect(next.operations[0].reversible).toBe(true);
  });
  it("rejects duplicate providers", () => {
    const r=new InMemoryProviderRegistry();
    const d={id:"ace-step-1.5",kind:"music-generation" as const,version:"1.5",license:"MIT",status:"dev" as const};
    r.register(d);
    expect(()=>r.register(d)).toThrow("Provider already registered");
  });
});