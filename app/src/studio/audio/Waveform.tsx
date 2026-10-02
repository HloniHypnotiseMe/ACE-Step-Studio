import { useEffect,useRef } from "react";
export function Waveform({samples}: {samples?:Float32Array}) {
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const c=ref.current;if(!c)return;const x=c.getContext("2d");if(!x)return;x.clearRect(0,0,c.width,c.height);x.beginPath();const data=samples??new Float32Array(256).map((_,i)=>Math.sin(i*.25)*.55*Math.random());for(let i=0;i<data.length;i++){const px=i/data.length*c.width;const py=c.height/2-data[i]*c.height*.42;i?x.lineTo(px,py):x.moveTo(px,py)}x.stroke();},[samples]);
 return <canvas ref={ref} width={900} height={90} className="waveform" aria-label="audio waveform"/>;
}
