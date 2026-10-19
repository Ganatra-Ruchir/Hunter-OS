import {createSign} from 'node:crypto';
const SHEET=process.env.GOOGLE_SHEET_ID||'1Z5WjRs5TJFhtZjFiOOKxV5TPbpgFbH8y0JzzTAkLRqc';
const TAB='Hunter OS Data';
function b64(obj){return Buffer.from(JSON.stringify(obj)).toString('base64url')}
let cached;
async function token(){if(cached&&cached.expires>Date.now()+60000)return cached.value;
const raw=process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if(!raw)throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured.');
let creds;try{creds=JSON.parse(raw)}catch{throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON')}
if(!creds.client_email||!creds.private_key)throw new Error('Service account credentials missing fields.');
const now=Math.floor(Date.now()/1000),head=b64({alg:'RS256',typ:'JWT'}),body=b64({iss:creds.client_email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3500});
const data=head+'.'+body;const signer=createSign('RSA-SHA256');signer.update(data);signer.end();
const jwt=data+'.'+signer.sign(creds.private_key).toString('base64url');
const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt})});
const j=await r.json();if(!r.ok)throw Error('Google authentication failed: '+(j.error_description||j.error));cached={value:j.access_token,expires:Date.now()+(j.expires_in||3600)*1000};return cached.value}
export async function request(path,opts={}){const access=await token();const r=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+SHEET+path,{...opts,headers:{Authorization:'Bearer '+access,'Content-Type':'application/json',...(opts.headers||{})}});const j=await r.json();if(!r.ok)throw Error(j.error?.message||'Google Sheets request failed');return j}
const quote=s=>encodeURIComponent("'"+s.replaceAll("'","''")+"'!A1:G");
export async function ensureTab(){const meta=await request('?fields=sheets.properties.title');if(!meta.sheets?.some(s=>s.properties?.title===TAB)){await request(':batchUpdate',{method:'POST',body:JSON.stringify({requests:[{addSheet:{properties:{title:TAB}}}]})});await request('/values/'+encodeURIComponent("'"+TAB+"'!A1:G1")+'?valueInputOption=RAW',{method:'PUT',body:JSON.stringify({values:[['ID','Kind','Title','Payload JSON','Updated At','Status','Origin']]})})}}
export async function readRecords(){await ensureTab();const r=await request('/values/'+quote(TAB)+'?majorDimension=ROWS');return (r.values||[]).slice(1).filter(row=>row[0]&&row[1]).map(row=>{try{return{...JSON.parse(row[3]||'{}'),id:row[0],kind:row[1],title:row[2],updatedAt:row[4],status:row[5]}}catch{return null}}).filter(Boolean)}
export async function appendRecord(item){await ensureTab();await request('/values/'+encodeURIComponent("'"+TAB+"'!A:G")+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',{method:'POST',body:JSON.stringify({values:[[item.id,item.kind,item.title,JSON.stringify(item.payload),new Date().toISOString(),item.status||'', 'hunter-os']]})})}
export async function readTasks(){const r=await request('/values/'+encodeURIComponent("'Daily Tasks'!A3:M250")+'?valueRenderOption=FORMATTED_VALUE');return(r.values||[]).slice(1).filter(x=>x[1]).map((x,i)=>({id:'planner-'+i,title:x[1],date:x[0],category:x[2],priority:x[3],due:x[5],status:x[6],progress:x[7],notes:x[12]}))}
export async function readMonthly(){const r=await request('/values/'+encodeURIComponent("'Monthly Tasks'!A3:L150")+'?valueRenderOption=FORMATTED_VALUE');return(r.values||[]).slice(1).filter(x=>x[1]).map((x,i)=>({id:'monthly-'+i,title:x[1],category:x[2],priority:x[3],due:x[4],status:x[5],progress:x[9]}))}
