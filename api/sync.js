import{readRecords,readTasks,readMonthly,appendRecord,appendPlannerQuest}from './_sheets.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');\n const secret=process.env.HUNTER_SYNC_TOKEN;\n if(!secret)return res.status(503).json({error:'Configure HUNTER_SYNC_TOKEN to enable private sync.'});\n if(req.headers['x-hunter-token']!==secret)return res.status(401).json({error:'Incorrect Hunter sync token.'});
 // Secure this endpoint with deployment protection / user authentication before exposing publicly.
 if(!process.env.GOOGLE_SERVICE_ACCOUNT_JSON)return res.status(503).json({error:'Google Sheets connection not configured. Configure GOOGLE_SERVICE_ACCOUNT_JSON in Vercel.'});
 try{
 if(req.method==='GET'){const [records,tasks,monthly]=await Promise.all([readRecords(),readTasks(),readMonthly()]);return res.status(200).json({records,tasks,monthly,source:'Google Sheets'})}
 if(req.method==='POST'&&req.body?.action==='createPlannerQuest'){
 const title=String(req.body.title||'').trim();
 if(!title||title.length>200)return res.status(400).json({error:'A quest title is required (max 200 characters).'});
 const category=String(req.body.category||'Personal').slice(0,60),priority=['High','Medium','Low'].includes(req.body.priority)?req.body.priority:'Medium';
 const range=await appendPlannerQuest({title,category,priority,due:req.body.due||''});
 return res.status(201).json({ok:true,updatedRange:range});
 }
 if(req.method==='POST'){const item=req.body;if(!item||typeof item!=='object')return res.status(400).json({error:'Invalid item'});
 const kind=String(item.kind||'');if(!['books','drama','anime','tasks','notes'].includes(kind))return res.status(400).json({error:'Unsupported kind'});
 const title=String(item.title||'').slice(0,200);if(!title)return res.status(400).json({error:'Title required'});
 const payload=item.payload;if(!payload||typeof payload!=='object'||Array.isArray(payload)||JSON.stringify(payload).length>12000)return res.status(400).json({error:'Invalid payload'});
 const id=String(item.id||'').slice(0,150);if(!/^[-\w.:/]{5,150}$/.test(id))return res.status(400).json({error:'Invalid id'});
 await appendRecord({id,kind,title,payload,status:String(item.status||'').slice(0,60)});return res.status(201).json({ok:true})}
 return res.status(405).json({error:'Method not allowed'});
 }catch(e){return res.status(502).json({error:e.message||'Google Sheets unavailable'})}
}
