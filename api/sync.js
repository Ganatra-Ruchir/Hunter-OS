/**
 * Hunter OS → Vercel secure API → Google Apps Script → existing Planner.
 * Only the server knows HUNTER_BRIDGE_SECRET and the script deployment URL.
 */
async function callBridge(payload){
  const url=process.env.HUNTER_BRIDGE_URL,secret=process.env.HUNTER_BRIDGE_SECRET;
  if(!url||!secret)return {http:503,data:{error:'Configure HUNTER_BRIDGE_URL and HUNTER_BRIDGE_SECRET in Vercel.'}};
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url))return {http:503,data:{error:'Invalid Google Apps Script deployment URL.'}};
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),22000);
  try{
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...payload,secret}),redirect:'follow',signal:controller.signal});
    const txt=await response.text();let data;
    try{data=JSON.parse(txt)}catch{throw Error('Apps Script returned a non-JSON response. Check web app deployment access.')}
    if(!response.ok||!data.ok)return {http:502,data:{error:data.error||'Apps Script request failed'}};
    return {http:200,data};
  }finally{clearTimeout(timeout)}
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const token=process.env.HUNTER_SYNC_TOKEN;
  if(!token||token.length<32)return res.status(503).json({error:'Configure a strong HUNTER_SYNC_TOKEN in Vercel.'});
  if(req.headers['x-hunter-token']!==token)return res.status(401).json({error:'Incorrect private Hunter sync token.'});
  try{
    if(req.method==='GET'){
      const result=await callBridge({action:'snapshot'});
      return res.status(result.http).json(result.data);
    }
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
    const body=req.body||{};
    if(body.action==='createPlannerQuest'){
      const title=String(body.title||'').trim();
      if(!title||title.length>200)return res.status(400).json({error:'Quest title required (max 200 characters)'});
      const category=['Personal','Work','Study','Health','Research'].includes(body.category)?body.category:'Personal';
      const priority=['High','Medium','Low'].includes(body.priority)?body.priority:'Medium';
      const result=await callBridge({action:'createPlannerQuest',title,category,priority,due:''});
      return res.status(result.http===200?201:result.http).json(result.data);
    }
    const kind=String(body.kind||''),title=String(body.title||''),id=String(body.id||''),payload=body.payload;
    if(!['books','drama','anime','tasks','notes'].includes(kind)||!title||title.length>200||!payload||typeof payload!=='object'||Array.isArray(payload)||JSON.stringify(payload).length>12000||!nodeSafeId(id))return res.status(400).json({error:'Invalid item'});
    const result=await callBridge({action:'saveItem',kind,id,title,payload,status:String(body.status||'').slice(0,60)});
    return res.status(result.http===200?201:result.http).json(result.data);
  }catch(e){return res.status(502).json({error:e.name==='AbortError'?'Bridge timed out':e.message||'Bridge connection failed'})}
}
function nodeSafeId(id){return /^[\w:./-]{5,150}$/.test(id)}
