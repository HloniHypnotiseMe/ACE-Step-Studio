export interface MixerChannel { id:string; name:string; gainDb:number; pan:number; muted:boolean; solo:boolean; outputBusId?:string; }
export interface MixerBus { id:string; name:string; gainDb:number; muted:boolean; }
export function setChannelGain(channel:MixerChannel,gainDb:number):MixerChannel{return {...channel,gainDb:Math.max(-96,Math.min(12,gainDb))};}
export function setChannelPan(channel:MixerChannel,pan:number):MixerChannel{return {...channel,pan:Math.max(-1,Math.min(1,pan))};}
export function routeChannel(channel:MixerChannel,busId:string):MixerChannel{return {...channel,outputBusId:busId};}
