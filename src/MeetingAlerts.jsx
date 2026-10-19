import {useEffect} from 'react';
function meetingDate(m){const raw=String(m.date||'');const found=raw.match(/^(\d{4})-(\d\d)-(\d\d)$/);if(!found||!Number.isFinite(m.start))return null;const date=new Date(Number(found[1]),Number(found[2])-1,Number(found[3]));date.setHours(0,Number(m.start),0,0);return date}
export default function MeetingAlerts({meetings=[]}){
 useEffect(()=>{function check(){if(typeof Notification==='undefined'||Notification.permission!=='granted')return;const now=Date.now();for(const m of meetings){const when=meetingDate(m);if(!when||/(cancel|declin)/i.test(m.status||''))continue;const delta=when.getTime()-now;if(delta<=0||delta>10*60000)continue;const key='hunter-meeting-alert:'+m.title+':'+when.toISOString();if(sessionStorage.getItem(key))continue;try{new Notification('Hunter OS · Meeting starts soon',{body:String(m.title||'Meeting')+' starts in '+Math.max(1,Math.ceil(delta/60000))+' minutes'});sessionStorage.setItem(key,'1')}catch{}}}check();const timer=setInterval(check,60000);return()=>clearInterval(timer)},[meetings]);
 return null;
}
