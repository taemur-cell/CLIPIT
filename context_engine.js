/* CLIPIT v6 Context Engine — no network, keys or background uploads. */
/* Accepts transcript subtitles and optional visual captions created by cloud analysis. */
(function(root){
"use strict";
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const num=x=>{const n=Number(x);return Number.isFinite(n)?n:NaN};
const words=["wait","really","why","what","secret","truth","shocking","argue","fight","angry","laugh","funny","surprise","reveal","cry","scream","kya","kyun","kaise","sach","larai","jhagda","gussa","hansi","hasna","nahi","abhi","کیا","کیوں","کیسے","لڑائی","جھگڑا","غصہ","ہنسی","سچ","رکو","نہیں","حیران"];
const actions=["running","chasing","jumping","fighting","arguing","shouting","crying","laughing","celebrating","dancing","falling","hugging","pointing","escaping","surprised","angry","smiling","falls","runs","fights","laughs","cries","dances","جھگڑا","لڑائی","ہنسی","رو","دوڑ"];
const textClean=s=>String(s??"").replace(/<[^>]*>/g,"").trim().slice(0,1400);
function parseClock(raw){
 const parts=String(raw).trim().replace(",",".").split(":").map(Number);
 if(parts.length<2||parts.length>3||parts.some(v=>!Number.isFinite(v)||v<0))return NaN;
 return parts.reduce((a,b)=>a*60+b,0);
}
function parseSubtitles(raw){
 const s=String(raw??"").replace(/^\uFEFF/,"").replace(/\r/g,"");
 const blocks=s.replace(/^WEBVTT[^\n]*\n?/i,"").split(/\n\s*\n/);
 const result=[];
 for(const block of blocks){
  const lines=block.split("\n").map(x=>x.trim()).filter(Boolean);
  const index=lines.findIndex(x=>x.includes("-->"));
  if(index<0)continue;
  const [a,b]=lines[index].split("-->").map(x=>x.trim().split(/\s+/)[0]);
  const start=parseClock(a),end=parseClock(b);
  const text=textClean(lines.slice(index+1).join(" "));
  if(finite(start)&&finite(end)&&start>=0&&end>start&&text)result.push({start,end,text});
 }
 return result;
}
function normalise(input){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Analysis must be a JSON object.");
 const segments=Array.isArray(input.transcript)?input.transcript:(Array.isArray(input.segments)?input.segments:[]);
 const visualSrc=Array.isArray(input.visuals)?input.visuals:(Array.isArray(input.visual_captions)?input.visual_captions:[]);
 const transcript=segments.slice(0,15000).map(x=>({start:num(x.start),end:num(x.end),text:textClean(x.text)})).filter(x=>finite(x.start)&&finite(x.end)&&x.start>=0&&x.end>x.start&&x.text).sort((a,b)=>a.start-b.start);
 const visuals=visualSrc.slice(0,5000).map(x=>({time:num(x.time),caption:textClean(x.caption||x.description),motion_score:clamp(num(x.motion_score)||0,0,1),scene_change_score:clamp(num(x.scene_change_score)||0,0,1)})).filter(x=>finite(x.time)&&x.time>=0).sort((a,b)=>a.time-b.time);
 const endGuess=Math.max(0,...transcript.map(x=>x.end),...visuals.map(x=>x.time+1));
 const duration=num(input.duration_seconds??input.duration);
 const source_filename=textClean(input.source_filename||input.source||"");
 const total=finite(duration)&&duration>0?duration:endGuess;
 if(total<=0)throw Error("No readable transcript timestamps, visual timestamps, or duration found.");
 return {duration:total,source_filename,transcript,visuals,visualCaptions:visuals.filter(x=>x.caption).length,kind:input.format||input.version||"context"};
}
const termCount=(text,terms)=>{const t=String(text||"").toLowerCase();return terms.reduce((acc,word)=>acc+(t.includes(word)?1:0),0)};
function recommend(input,options={}){
 const data=normalise(input);
 const duration=data.duration, len=clamp(num(options.targetSeconds)||30,5,Math.min(duration,180));
 const count=clamp(Math.round(num(options.count)||3),1,12);
 const centers=[];
 // Prefer speaking turns and visual activity; sample within bounded memory.
 const sStep=Math.max(1,Math.ceil(data.transcript.length/140));
 for(let i=0;i<data.transcript.length;i+=sStep)centers.push((data.transcript[i].start+data.transcript[i].end)/2);
 const vStep=Math.max(1,Math.ceil(data.visuals.length/110));
 for(let i=0;i<data.visuals.length;i+=vStep)centers.push(data.visuals[i].time);
 for(let i=0;i<18;i++)centers.push((i+.5)*duration/18);
 const candidates=[];
 const seen=new Set();
 for(const center of centers.slice(0,300)){
  const start=Math.max(0,Math.min(duration-len,center-len*.45));
  const key=Math.round(start/Math.max(2,len*.16));
  if(seen.has(key))continue;seen.add(key);
  const end=Math.min(duration,start+len);
  const ts=data.transcript.filter(x=>x.end>start&&x.start<end);
  const vs=data.visuals.filter(x=>x.time>=start&&x.time<=end);
  const joined=ts.map(x=>x.text).join(" ").slice(0,12000);
  const dialogue=termCount(joined,words);
  const action=vs.reduce((n,x)=>n+termCount(x.caption,actions),0);
  const motion=vs.length?vs.reduce((n,x)=>n+x.motion_score,0)/vs.length:0;
  const scene=vs.length?vs.reduce((n,x)=>n+x.scene_change_score,0)/vs.length:0;
  const speaking=ts.reduce((n,x)=>n+Math.max(0,Math.min(end,x.end)-Math.max(start,x.start)),0)/Math.max(1,end-start);
  const emphasis=(joined.match(/[!?؟!]/g)||[]).length;
  const visualCap=vs.filter(x=>x.caption).length;
  const score=1.6*Math.min(dialogue,7)+2.1*Math.min(action,5)+3*motion+2.5*scene+2*clamp(speaking,0,1)+.45*Math.min(emphasis,6)+Math.min(visualCap,3)*.35;
  const reasons=[];
  if(action>0)reasons.push("on-screen action description");
  if(dialogue>0)reasons.push("dialogue keywords");
  if(scene>.28)reasons.push("scene change");
  if(motion>.24)reasons.push("visual movement");
  if(speaking>.5)reasons.push("continuous dialogue");
  if(!reasons.length)reasons.push("timing candidate — review manually");
  candidates.push({start:Number(start.toFixed(2)),end:Number(end.toFixed(2)),kind:"context",reason:reasons.slice(0,3).join(" + "),score:Number(score.toFixed(2)),evidence:{dialogue,action,visualCaptions:visualCap,motion:Number(motion.toFixed(2))}});
 }
 candidates.sort((a,b)=>b.score-a.score||a.start-b.start);
 const chosen=[];
 for(const c of candidates){
  const overlap=chosen.some(q=>Math.max(0,Math.min(q.end,c.end)-Math.max(q.start,c.start))>.24*Math.min(c.end-c.start,q.end-q.start));
  if(!overlap)chosen.push(c);
  if(chosen.length>=count)break;
 }
 if(!chosen.length)chosen.push({start:0,end:Math.min(duration,len),kind:"context",score:0,reason:"no usable signals — review manually"});
 return chosen.sort((a,b)=>a.start-b.start);
}
function fromText(raw,filename){
 const transcript=parseSubtitles(raw);
 if(!transcript.length)throw Error("No timed subtitles found. Use SRT/VTT or CLIPIT context JSON.");
 return {format:"subtitle_only",source_filename:filename||"",duration_seconds:transcript[transcript.length-1].end,transcript,visuals:[]};
}
root.ClipitContextEngine={normalise,recommend,parseSubtitles,fromText};
})(typeof window!=="undefined"?window:globalThis);
