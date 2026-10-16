export interface AudioBufferView { readonly channels: number; readonly frames: number; readonly sampleRate: number; }
export interface AudioNode { process(input: AudioBufferView, output: AudioBufferView): void; }
export interface TransportState { playing:boolean; positionSeconds:number; bpm:number; }

export interface DAWEngine {
  transport(): TransportState;
  play(): void;
  stop(): void;
  seek(seconds:number): void;
  renderOffline(startSeconds:number,endSeconds:number): Promise<AudioBufferView>;
}

export function assertRealtimeSafe(operation:string):void {
  if (/ai|llm|diffusion|network|filesystem/i.test(operation)) {
    throw new Error(`Realtime audio thread cannot execute: ${operation}`);
  }
}