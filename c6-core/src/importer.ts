import type {AudioAsset} from "./contracts";
export function inferAudioFormat(uri:string):AudioAsset["format"]{const ext=uri.split(/[?#]/)[0].split(".").pop()?.toLowerCase();return ext==="wav"?"wav":ext==="flac"?"flac":ext==="aiff"||ext==="aif"?"aiff":ext==="mp3"?"mp3":ext==="ogg"?"ogg":"unknown";}
export function createImportedAsset(id:string,uri:string,name?:string):AudioAsset&{name?:string}{return{id,uri,format:inferAudioFormat(uri),...(name?{name}:{})};}
