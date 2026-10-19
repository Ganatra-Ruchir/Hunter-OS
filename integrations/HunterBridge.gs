/**
 * Hunter OS bridge — add as NEW HunterBridge.gs to your EXISTING Apps Script.
 * Leaves Rapido and Meeting automation functions unchanged.
 * Configure Script property HUNTER_BRIDGE_SECRET with a 32+ character secret.
 * Deploy Web App: Execute as Me; Access: Anyone (service-to-service proxy only).
 * NEVER call this URL from a browser: the Vercel API server alone holds the secret.
 * Script Properties are configured in Project Settings; do not paste secrets into code.
 */
const HUNTER_BRIDGE = Object.freeze({
  spreadsheetId:'1Z5WjRs5TJFhtZjFiOOKxV5TPbpgFbH8y0JzzTAkLRqc',
  collectionTab:'Hunter OS Data',
  firstTaskRow:4,
  maxReadRows:600,
  maxItems:450
});
function hunterJson_(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON)}
function hunterText_(v,max){const s=String(v==null?'':v).trim().slice(0,max||300);return /^[=+@\-]/.test(s)?"'"+s:s}
function hunterSheet_(){return SpreadsheetApp.openById(HUNTER_BRIDGE.spreadsheetId)}
function hunterCollectionTab_(ss){
  let sh=ss.getSheetByName(HUNTER_BRIDGE.collectionTab);
  if(!sh){sh=ss.insertSheet(HUNTER_BRIDGE.collectionTab);sh.getRange(1,1,1,7).setValues([['ID','Kind','Title','Payload JSON','Updated At','Status','Origin']]);sh.setFrozenRows(1)}
  return sh;
}
function hunterSnapshot_(){
  const ss=hunterSheet_(), get=(name,width)=>{
    const sh=ss.getSheetByName(name);
    if(!sh)return [];
    const bottom=Math.min(sh.getLastRow(),HUNTER_BRIDGE.maxReadRows);
    if(bottom<4)return [];
    return sh.getRange(4,1,bottom-3,width).getDisplayValues();
  };
  const tasks=get('Daily Tasks',13).filter(r=>r[1]).map((r,i)=>({id:'planner-'+i,title:r[1],date:r[0],category:r[2],priority:r[3],due:r[5],status:r[6],progress:r[7],notes:r[12]}));
  const monthly=get('Monthly Tasks',12).filter(r=>r[1]).map((r,i)=>({id:'monthly-'+i,title:r[1],category:r[2],priority:r[3],due:r[4],status:r[5],progress:r[9]}));
  const store=hunterCollectionTab_(ss), last=Math.min(store.getLastRow(),HUNTER_BRIDGE.maxItems+1), latest={};
  if(last>=2){store.getRange(2,1,last-1,7).getDisplayValues().forEach(row=>{
    if(!row[0])return;
    try{latest[row[0]]=Object.assign(JSON.parse(row[3]||'{}'),{id:row[0],kind:row[1],title:row[2],status:row[5]})}catch(e){}
  })}
  const travelSh=ss.getSheetByName('Travel & Outside Work');
  const travel=travelSh&&travelSh.getLastRow()>=10?travelSh.getRange(10,1,Math.min(travelSh.getLastRow()-9,900),16).getValues().filter(r=>r[0]&&r[14]).map(r=>({date:r[0] instanceof Date?Utilities.formatDate(r[0],'Asia/Kolkata','yyyy-MM-dd'):String(r[0]),route:String(r[1]||''),fare:Number(r[5])||0,rideId:String(r[14]||''),source:'Rapido'})):[];
  const meetingSh=ss.getSheetByName('Calendar');
  const meetings=meetingSh&&meetingSh.getLastRow()>=13?meetingSh.getRange(13,1,Math.min(meetingSh.getLastRow()-12,900),19).getValues().filter(r=>r[0]&&r[3]).map(r=>({
    date:r[0] instanceof Date?Utilities.formatDate(r[0],'Asia/Kolkata','yyyy-MM-dd'):String(r[0]),
    start:typeof r[1]==='number'?Math.round(r[1]*1440):r[1] instanceof Date?Number(Utilities.formatDate(r[1],'Asia/Kolkata','H'))*60+Number(Utilities.formatDate(r[1],'Asia/Kolkata','m')):null,
    title:String(r[3]||''),status:String(r[8]||''),link:String(r[7]||''),rsvp:String(r[16]||'')
  })):[];
  return {tasks,monthly,travel,meetings,records:Object.values(latest).filter(x=>!x.deleted),source:'Google Apps Script / Google Sheets'};
}
function hunterAppendRecord_(item){
  const allowed=['books','drama','anime','hentai','tasks','notes'];
  if(!allowed.includes(item.kind))throw Error('Unsupported kind');
  if(!/^[\w:./-]{5,150}$/.test(String(item.id||'')))throw Error('Invalid ID');
  if(!item.title||String(item.title).length>200)throw Error('Invalid title');
  const payload=item.payload;
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||JSON.stringify(payload).length>12000)throw Error('Invalid payload');
  const ss=hunterSheet_(),sh=hunterCollectionTab_(ss);
  if(sh.getLastRow()>HUNTER_BRIDGE.maxItems)throw Error('Hunter OS Data tab full; archive old events first');
  sh.appendRow([hunterText_(item.id,150),item.kind,hunterText_(item.title,200),JSON.stringify(payload),new Date(),hunterText_(item.status||'',60),'hunter-os']);
  return {ok:true};
}
function hunterCreateQuest_(item){
  const title=hunterText_(item.title||'',200);if(!title)throw Error('Title required');
  const category=['Personal','Work','Study','Health','Research'].includes(item.category)?item.category:'Personal';
  const priority=['High','Medium','Low'].includes(item.priority)?item.priority:'Medium';
  const sh=hunterSheet_().getSheetByName('Daily Tasks');
  if(!sh)throw Error('Daily Tasks not found');
  // Reuse first blank task row so formatting and row-aligned formulas are retained.
  const last=Math.max(sh.getLastRow(),HUNTER_BRIDGE.firstTaskRow);
  const vals=sh.getRange(HUNTER_BRIDGE.firstTaskRow,2,last-HUNTER_BRIDGE.firstTaskRow+1,1).getDisplayValues();
  let at=vals.findIndex(row=>!String(row[0]||'').trim());
  at=at>=0?HUNTER_BRIDGE.firstTaskRow+at:last+1;
  sh.getRange(at,1,1,7).setValues([[new Date(),title,category,priority,'',item.due||'','Not Started']]);
  sh.getRange(at,1).setNumberFormat('dd-mmm-yyyy');
  return {ok:true,updatedRange:'Daily Tasks!A'+at+':G'+at};
}
function doPost(e){
  try{
    const data=JSON.parse(e&&e.postData&&e.postData.contents||'{}');
    const expected=PropertiesService.getScriptProperties().getProperty('HUNTER_BRIDGE_SECRET');
    if(!expected||expected.length<32)throw Error('Bridge secret is not configured');
    if(typeof data.secret!=='string'||data.secret!==expected)throw Error('Unauthorized');
    if(data.action==='snapshot')return hunterJson_({ok:true,...hunterSnapshot_()});
    const lock=LockService.getScriptLock();if(!lock.tryLock(4000))throw Error('Bridge busy, retry');
    try{
      if(data.action==='createPlannerQuest')return hunterJson_(hunterCreateQuest_(data));
      if(data.action==='saveItem')return hunterJson_(hunterAppendRecord_(data));
      throw Error('Unsupported action');
    }finally{lock.releaseLock()}
  }catch(err){return hunterJson_({ok:false,error:String(err.message||err).slice(0,200)})}
}
function testHunterBridge(){
  // Read-only test. This will not create a quest or change any existing records.
  const ss=hunterSheet_();
  Logger.log('Hunter Bridge spreadsheet: '+ss.getName()+'; Daily Tasks present: '+!!ss.getSheetByName('Daily Tasks'));
}
