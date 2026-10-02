export interface RecordingDevice { id:string; name:string; inputs:number; outputs:number; }
export interface RecordingSession { id:string; deviceId:string; sampleRate:number; channels:number; startedAt:number; stoppedAt?:number; }
export class RecordingManager {
 private devices:RecordingDevice[]=[];
 setDevices(devices:RecordingDevice[]){this.devices=[...devices];}
 listDevices(){return [...this.devices];}
 start(deviceId:string,sampleRate=48000,channels=2):RecordingSession{if(!this.devices.some(d=>d.id===deviceId))throw new Error("Recording device not found");return{id:crypto.randomUUID(),deviceId,sampleRate,channels,startedAt:Date.now()};}
 stop(session:RecordingSession):RecordingSession{return {...session,stoppedAt:Date.now()};}
}
