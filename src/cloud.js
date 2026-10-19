import {initializeApp,getApps,getApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'firebase/auth';
import {getFirestore,doc,getDoc,setDoc,onSnapshot,serverTimestamp} from 'firebase/firestore';
const options={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
export const cloudConfigured=Object.values(options).every(Boolean);
const app=cloudConfigured?(getApps().length?getApp():initializeApp(options)):null;
export const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
const provider=new GoogleAuthProvider();
provider.setCustomParameters({prompt:'select_account'});
export function watchAccount(onChange){return auth?onAuthStateChanged(auth,onChange):()=>{}}
export async function googleLogin(){if(!auth)throw Error('Firebase is not configured yet.');return signInWithPopup(auth,provider)}
export async function googleLogout(){if(auth)await signOut(auth)}
function accountDoc(user){if(!db||!user)throw Error('Not signed in');return doc(db,'users',user.uid,'hunter','workspace')}
export async function loadWorkspace(user){const snap=await getDoc(accountDoc(user));return snap.exists()?snap.data().workspace:null}
export function watchWorkspace(user,onChange,onError){return onSnapshot(accountDoc(user),snap=>onChange(snap.exists()?snap.data().workspace:null),onError)}
export async function saveWorkspace(user,workspace){if(!workspace||typeof workspace!=='object')throw Error('No data to save');await setDoc(accountDoc(user),{workspace,updatedAt:serverTimestamp(),ownerUid:user.uid},{merge:true})}
