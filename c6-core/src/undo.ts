import type {C6MusicProject,ProjectOperation} from "./project";
export function undoLastReversible(project:C6MusicProject):C6MusicProject{
 const index=[...project.operations].reverse().findIndex(o=>o.reversible);
 if(index<0)return project;
 const target=project.operations.length-1-index;
 const operations=project.operations.filter((_,i)=>i!==target);
 return {...project,operations};
}
export function addOperation(project:C6MusicProject,operation:ProjectOperation):C6MusicProject{return {...project,operations:[...project.operations,operation]};}
