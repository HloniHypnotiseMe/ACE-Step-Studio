import {describe,expect,it} from "vitest";
import {createTimeline,addTrack,addClip} from "../src/index.js";
describe("generation-to-DAW pipeline primitives",()=>{
 it("places generated audio on an editable timeline",()=>{
  const t=addTrack(createTimeline(),{id:"track-1",name:"Generated",kind:"audio",clips:[]});
  const next=addClip(t,{id:"clip-1",trackId:"track-1",startSeconds:0,durationSeconds:30,gainDb:0,source:{id:"a1",uri:"local://a1.wav",format:"wav"}});
  expect(next.tracks[0].clips[0].source?.uri).toBe("local://a1.wav");
 });
});