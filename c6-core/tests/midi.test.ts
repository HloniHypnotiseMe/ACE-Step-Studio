import {describe,expect,it} from "vitest"; import {addMidiNote,beatsToSeconds} from "../src/midi";
describe("midi",()=>{it("converts beats",()=>expect(beatsToSeconds(4,120)).toBe(2));it("adds notes immutably",()=>{const c={id:"c",trackId:"t",startBeats:0,lengthBeats:4,notes:[]};expect(addMidiNote(c,{id:"n",pitch:60,velocity:100,startBeats:0,durationBeats:1}).notes).toHaveLength(1);});});
