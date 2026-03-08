/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ei=function(s){const i=[];let o=0;for(let u=0;u<s.length;u++){let p=s.charCodeAt(u);p<128?i[o++]=p:p<2048?(i[o++]=p>>6|192,i[o++]=p&63|128):(p&64512)===55296&&u+1<s.length&&(s.charCodeAt(u+1)&64512)===56320?(p=65536+((p&1023)<<10)+(s.charCodeAt(++u)&1023),i[o++]=p>>18|240,i[o++]=p>>12&63|128,i[o++]=p>>6&63|128,i[o++]=p&63|128):(i[o++]=p>>12|224,i[o++]=p>>6&63|128,i[o++]=p&63|128)}return i},vs=function(s){const i=[];let o=0,u=0;for(;o<s.length;){const p=s[o++];if(p<128)i[u++]=String.fromCharCode(p);else if(p>191&&p<224){const v=s[o++];i[u++]=String.fromCharCode((p&31)<<6|v&63)}else if(p>239&&p<365){const v=s[o++],_=s[o++],E=s[o++],w=((p&7)<<18|(v&63)<<12|(_&63)<<6|E&63)-65536;i[u++]=String.fromCharCode(55296+(w>>10)),i[u++]=String.fromCharCode(56320+(w&1023))}else{const v=s[o++],_=s[o++];i[u++]=String.fromCharCode((p&15)<<12|(v&63)<<6|_&63)}}return i.join("")},_s={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(s,i){if(!Array.isArray(s))throw Error("encodeByteArray takes an array as a parameter");this.init_();const o=i?this.byteToCharMapWebSafe_:this.byteToCharMap_,u=[];for(let p=0;p<s.length;p+=3){const v=s[p],_=p+1<s.length,E=_?s[p+1]:0,w=p+2<s.length,A=w?s[p+2]:0,B=v>>2,k=(v&3)<<4|E>>4;let D=(E&15)<<2|A>>6,U=A&63;w||(U=64,_||(D=64)),u.push(o[B],o[k],o[D],o[U])}return u.join("")},encodeString(s,i){return this.HAS_NATIVE_SUPPORT&&!i?btoa(s):this.encodeByteArray(Ei(s),i)},decodeString(s,i){return this.HAS_NATIVE_SUPPORT&&!i?atob(s):vs(this.decodeStringToByteArray(s,i))},decodeStringToByteArray(s,i){this.init_();const o=i?this.charToByteMapWebSafe_:this.charToByteMap_,u=[];for(let p=0;p<s.length;){const v=o[s.charAt(p++)],E=p<s.length?o[s.charAt(p)]:0;++p;const A=p<s.length?o[s.charAt(p)]:64;++p;const k=p<s.length?o[s.charAt(p)]:64;if(++p,v==null||E==null||A==null||k==null)throw new Es;const D=v<<2|E>>4;if(u.push(D),A!==64){const U=E<<4&240|A>>2;if(u.push(U),k!==64){const I=A<<6&192|k;u.push(I)}}}return u},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let s=0;s<this.ENCODED_VALS.length;s++)this.byteToCharMap_[s]=this.ENCODED_VALS.charAt(s),this.charToByteMap_[this.byteToCharMap_[s]]=s,this.byteToCharMapWebSafe_[s]=this.ENCODED_VALS_WEBSAFE.charAt(s),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[s]]=s,s>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(s)]=s,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(s)]=s)}}};class Es extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Ts=function(s){const i=Ei(s);return _s.encodeByteArray(i,!0)},Ti=function(s){return Ts(s).replace(/\./g,"")};function ws(){try{return typeof indexedDB=="object"}catch{return!1}}function As(){return new Promise((s,i)=>{try{let o=!0;const u="validate-browser-context-for-indexeddb-analytics-module",p=self.indexedDB.open(u);p.onsuccess=()=>{p.result.close(),o||self.indexedDB.deleteDatabase(u),s(!0)},p.onupgradeneeded=()=>{o=!1},p.onerror=()=>{var v;i(((v=p.error)===null||v===void 0?void 0:v.message)||"")}}catch(o){i(o)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Is="FirebaseError";class vt extends Error{constructor(i,o,u){super(o),this.code=i,this.customData=u,this.name=Is,Object.setPrototypeOf(this,vt.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,wi.prototype.create)}}class wi{constructor(i,o,u){this.service=i,this.serviceName=o,this.errors=u}create(i,...o){const u=o[0]||{},p=`${this.service}/${i}`,v=this.errors[i],_=v?Rs(v,u):"Error",E=`${this.serviceName}: ${_} (${p}).`;return new vt(p,E,u)}}function Rs(s,i){return s.replace(bs,(o,u)=>{const p=i[u];return p!=null?String(p):`<${u}?>`})}const bs=/\{\$([^}]+)}/g;class $t{constructor(i,o,u){this.name=i,this.instanceFactory=o,this.type=u,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(i){return this.instantiationMode=i,this}setMultipleInstances(i){return this.multipleInstances=i,this}setServiceProps(i){return this.serviceProps=i,this}setInstanceCreatedCallback(i){return this.onInstanceCreated=i,this}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var P;(function(s){s[s.DEBUG=0]="DEBUG",s[s.VERBOSE=1]="VERBOSE",s[s.INFO=2]="INFO",s[s.WARN=3]="WARN",s[s.ERROR=4]="ERROR",s[s.SILENT=5]="SILENT"})(P||(P={}));const Ss={debug:P.DEBUG,verbose:P.VERBOSE,info:P.INFO,warn:P.WARN,error:P.ERROR,silent:P.SILENT},Ds=P.INFO,Cs={[P.DEBUG]:"log",[P.VERBOSE]:"log",[P.INFO]:"info",[P.WARN]:"warn",[P.ERROR]:"error"},Ps=(s,i,...o)=>{if(i<s.logLevel)return;const u=new Date().toISOString(),p=Cs[i];if(p)console[p](`[${u}]  ${s.name}:`,...o);else throw new Error(`Attempted to log a message with an invalid logType (value: ${i})`)};class Ai{constructor(i){this.name=i,this._logLevel=Ds,this._logHandler=Ps,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(i){if(!(i in P))throw new TypeError(`Invalid value "${i}" assigned to \`logLevel\``);this._logLevel=i}setLogLevel(i){this._logLevel=typeof i=="string"?Ss[i]:i}get logHandler(){return this._logHandler}set logHandler(i){if(typeof i!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=i}get userLogHandler(){return this._userLogHandler}set userLogHandler(i){this._userLogHandler=i}debug(...i){this._userLogHandler&&this._userLogHandler(this,P.DEBUG,...i),this._logHandler(this,P.DEBUG,...i)}log(...i){this._userLogHandler&&this._userLogHandler(this,P.VERBOSE,...i),this._logHandler(this,P.VERBOSE,...i)}info(...i){this._userLogHandler&&this._userLogHandler(this,P.INFO,...i),this._logHandler(this,P.INFO,...i)}warn(...i){this._userLogHandler&&this._userLogHandler(this,P.WARN,...i),this._logHandler(this,P.WARN,...i)}error(...i){this._userLogHandler&&this._userLogHandler(this,P.ERROR,...i),this._logHandler(this,P.ERROR,...i)}}const Os=(s,i)=>i.some(o=>s instanceof o);let Qn,Zn;function ks(){return Qn||(Qn=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Ns(){return Zn||(Zn=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Ii=new WeakMap,We=new WeakMap,Ri=new WeakMap,He=new WeakMap,Ye=new WeakMap;function Ls(s){const i=new Promise((o,u)=>{const p=()=>{s.removeEventListener("success",v),s.removeEventListener("error",_)},v=()=>{o(pt(s.result)),p()},_=()=>{u(s.error),p()};s.addEventListener("success",v),s.addEventListener("error",_)});return i.then(o=>{o instanceof IDBCursor&&Ii.set(o,s)}).catch(()=>{}),Ye.set(i,s),i}function xs(s){if(We.has(s))return;const i=new Promise((o,u)=>{const p=()=>{s.removeEventListener("complete",v),s.removeEventListener("error",_),s.removeEventListener("abort",_)},v=()=>{o(),p()},_=()=>{u(s.error||new DOMException("AbortError","AbortError")),p()};s.addEventListener("complete",v),s.addEventListener("error",_),s.addEventListener("abort",_)});We.set(s,i)}let ze={get(s,i,o){if(s instanceof IDBTransaction){if(i==="done")return We.get(s);if(i==="objectStoreNames")return s.objectStoreNames||Ri.get(s);if(i==="store")return o.objectStoreNames[1]?void 0:o.objectStore(o.objectStoreNames[0])}return pt(s[i])},set(s,i,o){return s[i]=o,!0},has(s,i){return s instanceof IDBTransaction&&(i==="done"||i==="store")?!0:i in s}};function Ms(s){ze=s(ze)}function Bs(s){return s===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(i,...o){const u=s.call(Ve(this),i,...o);return Ri.set(u,i.sort?i.sort():[i]),pt(u)}:Ns().includes(s)?function(...i){return s.apply(Ve(this),i),pt(Ii.get(this))}:function(...i){return pt(s.apply(Ve(this),i))}}function Us(s){return typeof s=="function"?Bs(s):(s instanceof IDBTransaction&&xs(s),Os(s,ks())?new Proxy(s,ze):s)}function pt(s){if(s instanceof IDBRequest)return Ls(s);if(He.has(s))return He.get(s);const i=Us(s);return i!==s&&(He.set(s,i),Ye.set(i,s)),i}const Ve=s=>Ye.get(s);function Fs(s,i,{blocked:o,upgrade:u,blocking:p,terminated:v}={}){const _=indexedDB.open(s,i),E=pt(_);return u&&_.addEventListener("upgradeneeded",w=>{u(pt(_.result),w.oldVersion,w.newVersion,pt(_.transaction),w)}),o&&_.addEventListener("blocked",w=>o(w.oldVersion,w.newVersion,w)),E.then(w=>{v&&w.addEventListener("close",()=>v()),p&&w.addEventListener("versionchange",A=>p(A.oldVersion,A.newVersion,A))}).catch(()=>{}),E}const js=["get","getKey","getAll","getAllKeys","count"],Hs=["put","add","delete","clear"],$e=new Map;function ti(s,i){if(!(s instanceof IDBDatabase&&!(i in s)&&typeof i=="string"))return;if($e.get(i))return $e.get(i);const o=i.replace(/FromIndex$/,""),u=i!==o,p=Hs.includes(o);if(!(o in(u?IDBIndex:IDBObjectStore).prototype)||!(p||js.includes(o)))return;const v=async function(_,...E){const w=this.transaction(_,p?"readwrite":"readonly");let A=w.store;return u&&(A=A.index(E.shift())),(await Promise.all([A[o](...E),p&&w.done]))[0]};return $e.set(i,v),v}Ms(s=>({...s,get:(i,o,u)=>ti(i,o)||s.get(i,o,u),has:(i,o)=>!!ti(i,o)||s.has(i,o)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vs{constructor(i){this.container=i}getPlatformInfoString(){return this.container.getProviders().map(o=>{if($s(o)){const u=o.getImmediate();return`${u.library}/${u.version}`}else return null}).filter(o=>o).join(" ")}}function $s(s){const i=s.getComponent();return i?.type==="VERSION"}const qe="@firebase/app",ei="0.10.13";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const at=new Ai("@firebase/app"),Gs="@firebase/app-compat",Ks="@firebase/analytics-compat",Xs="@firebase/analytics",Ws="@firebase/app-check-compat",zs="@firebase/app-check",qs="@firebase/auth",Ys="@firebase/auth-compat",Js="@firebase/database",Qs="@firebase/data-connect",Zs="@firebase/database-compat",tr="@firebase/functions",er="@firebase/functions-compat",nr="@firebase/installations",ir="@firebase/installations-compat",sr="@firebase/messaging",rr="@firebase/messaging-compat",or="@firebase/performance",hr="@firebase/performance-compat",ar="@firebase/remote-config",lr="@firebase/remote-config-compat",ur="@firebase/storage",cr="@firebase/storage-compat",fr="@firebase/firestore",pr="@firebase/vertexai-preview",gr="@firebase/firestore-compat",dr="firebase",mr="10.14.1",yr={[qe]:"fire-core",[Gs]:"fire-core-compat",[Xs]:"fire-analytics",[Ks]:"fire-analytics-compat",[zs]:"fire-app-check",[Ws]:"fire-app-check-compat",[qs]:"fire-auth",[Ys]:"fire-auth-compat",[Js]:"fire-rtdb",[Qs]:"fire-data-connect",[Zs]:"fire-rtdb-compat",[tr]:"fire-fn",[er]:"fire-fn-compat",[nr]:"fire-iid",[ir]:"fire-iid-compat",[sr]:"fire-fcm",[rr]:"fire-fcm-compat",[or]:"fire-perf",[hr]:"fire-perf-compat",[ar]:"fire-rc",[lr]:"fire-rc-compat",[ur]:"fire-gcs",[cr]:"fire-gcs-compat",[fr]:"fire-fst",[gr]:"fire-fst-compat",[pr]:"fire-vertex","fire-js":"fire-js",[dr]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vr=new Map,_r=new Map,ni=new Map;function ii(s,i){try{s.container.addComponent(i)}catch(o){at.debug(`Component ${i.name} failed to register with FirebaseApp ${s.name}`,o)}}function Gt(s){const i=s.name;if(ni.has(i))return at.debug(`There were multiple attempts to register component ${i}.`),!1;ni.set(i,s);for(const o of vr.values())ii(o,s);for(const o of _r.values())ii(o,s);return!0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Er={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Je=new wi("app","Firebase",Er);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bi=mr;function gt(s,i,o){var u;let p=(u=yr[s])!==null&&u!==void 0?u:s;o&&(p+=`-${o}`);const v=p.match(/\s|\//),_=i.match(/\s|\//);if(v||_){const E=[`Unable to register library "${p}" with version "${i}":`];v&&E.push(`library name "${p}" contains illegal characters (whitespace or "/")`),v&&_&&E.push("and"),_&&E.push(`version name "${i}" contains illegal characters (whitespace or "/")`),at.warn(E.join(" "));return}Gt(new $t(`${p}-version`,()=>({library:p,version:i}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tr="firebase-heartbeat-database",wr=1,Kt="firebase-heartbeat-store";let Ge=null;function Si(){return Ge||(Ge=Fs(Tr,wr,{upgrade:(s,i)=>{switch(i){case 0:try{s.createObjectStore(Kt)}catch(o){console.warn(o)}}}}).catch(s=>{throw Je.create("idb-open",{originalErrorMessage:s.message})})),Ge}async function Ar(s){try{const o=(await Si()).transaction(Kt),u=await o.objectStore(Kt).get(Di(s));return await o.done,u}catch(i){if(i instanceof vt)at.warn(i.message);else{const o=Je.create("idb-get",{originalErrorMessage:i?.message});at.warn(o.message)}}}async function si(s,i){try{const u=(await Si()).transaction(Kt,"readwrite");await u.objectStore(Kt).put(i,Di(s)),await u.done}catch(o){if(o instanceof vt)at.warn(o.message);else{const u=Je.create("idb-set",{originalErrorMessage:o?.message});at.warn(u.message)}}}function Di(s){return`${s.name}!${s.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ir=1024,Rr=30*24*60*60*1e3;class br{constructor(i){this.container=i,this._heartbeatsCache=null;const o=this.container.getProvider("app").getImmediate();this._storage=new Dr(o),this._heartbeatsCachePromise=this._storage.read().then(u=>(this._heartbeatsCache=u,u))}async triggerHeartbeat(){var i,o;try{const p=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),v=ri();return((i=this._heartbeatsCache)===null||i===void 0?void 0:i.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((o=this._heartbeatsCache)===null||o===void 0?void 0:o.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===v||this._heartbeatsCache.heartbeats.some(_=>_.date===v)?void 0:(this._heartbeatsCache.heartbeats.push({date:v,agent:p}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(_=>{const E=new Date(_.date).valueOf();return Date.now()-E<=Rr}),this._storage.overwrite(this._heartbeatsCache))}catch(u){at.warn(u)}}async getHeartbeatsHeader(){var i;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((i=this._heartbeatsCache)===null||i===void 0?void 0:i.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const o=ri(),{heartbeatsToSend:u,unsentEntries:p}=Sr(this._heartbeatsCache.heartbeats),v=Ti(JSON.stringify({version:2,heartbeats:u}));return this._heartbeatsCache.lastSentHeartbeatDate=o,p.length>0?(this._heartbeatsCache.heartbeats=p,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),v}catch(o){return at.warn(o),""}}}function ri(){return new Date().toISOString().substring(0,10)}function Sr(s,i=Ir){const o=[];let u=s.slice();for(const p of s){const v=o.find(_=>_.agent===p.agent);if(v){if(v.dates.push(p.date),oi(o)>i){v.dates.pop();break}}else if(o.push({agent:p.agent,dates:[p.date]}),oi(o)>i){o.pop();break}u=u.slice(1)}return{heartbeatsToSend:o,unsentEntries:u}}class Dr{constructor(i){this.app=i,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return ws()?As().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const o=await Ar(this.app);return o?.heartbeats?o:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(i){var o;if(await this._canUseIndexedDBPromise){const p=await this.read();return si(this.app,{lastSentHeartbeatDate:(o=i.lastSentHeartbeatDate)!==null&&o!==void 0?o:p.lastSentHeartbeatDate,heartbeats:i.heartbeats})}else return}async add(i){var o;if(await this._canUseIndexedDBPromise){const p=await this.read();return si(this.app,{lastSentHeartbeatDate:(o=i.lastSentHeartbeatDate)!==null&&o!==void 0?o:p.lastSentHeartbeatDate,heartbeats:[...p.heartbeats,...i.heartbeats]})}else return}}function oi(s){return Ti(JSON.stringify({version:2,heartbeats:s})).length}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Cr(s){Gt(new $t("platform-logger",i=>new Vs(i),"PRIVATE")),Gt(new $t("heartbeat",i=>new br(i),"PRIVATE")),gt(qe,ei,s),gt(qe,ei,"esm2017"),gt("fire-js","")}Cr("");var Pr="firebase",Or="10.14.1";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */gt(Pr,Or,"app");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ci="firebasestorage.googleapis.com",kr="storageBucket",Nr=2*60*1e3,Lr=10*60*1e3;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class it extends vt{constructor(i,o,u=0){super(Ke(i),`Firebase Storage: ${o} (${Ke(i)})`),this.status_=u,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,it.prototype)}get status(){return this.status_}set status(i){this.status_=i}_codeEquals(i){return Ke(i)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(i){this.customData.serverResponse=i,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var nt;(function(s){s.UNKNOWN="unknown",s.OBJECT_NOT_FOUND="object-not-found",s.BUCKET_NOT_FOUND="bucket-not-found",s.PROJECT_NOT_FOUND="project-not-found",s.QUOTA_EXCEEDED="quota-exceeded",s.UNAUTHENTICATED="unauthenticated",s.UNAUTHORIZED="unauthorized",s.UNAUTHORIZED_APP="unauthorized-app",s.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",s.INVALID_CHECKSUM="invalid-checksum",s.CANCELED="canceled",s.INVALID_EVENT_NAME="invalid-event-name",s.INVALID_URL="invalid-url",s.INVALID_DEFAULT_BUCKET="invalid-default-bucket",s.NO_DEFAULT_BUCKET="no-default-bucket",s.CANNOT_SLICE_BLOB="cannot-slice-blob",s.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",s.NO_DOWNLOAD_URL="no-download-url",s.INVALID_ARGUMENT="invalid-argument",s.INVALID_ARGUMENT_COUNT="invalid-argument-count",s.APP_DELETED="app-deleted",s.INVALID_ROOT_OPERATION="invalid-root-operation",s.INVALID_FORMAT="invalid-format",s.INTERNAL_ERROR="internal-error",s.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(nt||(nt={}));function Ke(s){return"storage/"+s}function xr(){const s="An unknown error occurred, please check the error payload for server response.";return new it(nt.UNKNOWN,s)}function Mr(){return new it(nt.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function Br(){return new it(nt.CANCELED,"User canceled the upload/download.")}function Ur(s){return new it(nt.INVALID_URL,"Invalid URL '"+s+"'.")}function Fr(s){return new it(nt.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+s+"'.")}function hi(s){return new it(nt.INVALID_ARGUMENT,s)}function Pi(){return new it(nt.APP_DELETED,"The Firebase app was deleted.")}function jr(s){return new it(nt.INVALID_ROOT_OPERATION,"The operation '"+s+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tt{constructor(i,o){this.bucket=i,this.path_=o}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const i=encodeURIComponent;return"/b/"+i(this.bucket)+"/o/"+i(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(i,o){let u;try{u=tt.makeFromUrl(i,o)}catch{return new tt(i,"")}if(u.path==="")return u;throw Fr(i)}static makeFromUrl(i,o){let u=null;const p="([A-Za-z0-9.\\-_]+)";function v(x){x.path.charAt(x.path.length-1)==="/"&&(x.path_=x.path_.slice(0,-1))}const _="(/(.*))?$",E=new RegExp("^gs://"+p+_,"i"),w={bucket:1,path:3};function A(x){x.path_=decodeURIComponent(x.path)}const B="v[A-Za-z0-9_]+",k=o.replace(/[.]/g,"\\."),D="(/([^?#]*).*)?$",U=new RegExp(`^https?://${k}/${B}/b/${p}/o${D}`,"i"),I={bucket:1,path:3},N=o===Ci?"(?:storage.googleapis.com|storage.cloud.google.com)":o,b="([^?#]*)",Y=new RegExp(`^https?://${N}/${p}/${b}`,"i"),M=[{regex:E,indices:w,postModify:v},{regex:U,indices:I,postModify:A},{regex:Y,indices:{bucket:1,path:2},postModify:A}];for(let x=0;x<M.length;x++){const st=M[x],X=st.regex.exec(i);if(X){const g=X[st.indices.bucket];let h=X[st.indices.path];h||(h=""),u=new tt(g,h),st.postModify(u);break}}if(u==null)throw Ur(i);return u}}class Hr{constructor(i){this.promise_=Promise.reject(i)}getPromise(){return this.promise_}cancel(i=!1){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vr(s,i,o){let u=1,p=null,v=null,_=!1,E=0;function w(){return E===2}let A=!1;function B(...b){A||(A=!0,i.apply(null,b))}function k(b){p=setTimeout(()=>{p=null,s(U,w())},b)}function D(){v&&clearTimeout(v)}function U(b,...Y){if(A){D();return}if(b){D(),B.call(null,b,...Y);return}if(w()||_){D(),B.call(null,b,...Y);return}u<64&&(u*=2);let M;E===1?(E=2,M=0):M=(u+Math.random())*1e3,k(M)}let I=!1;function N(b){I||(I=!0,D(),!A&&(p!==null?(b||(E=2),clearTimeout(p),k(0)):b||(E=1)))}return k(0),v=setTimeout(()=>{_=!0,N(!0)},o),N}function $r(s){s(!1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gr(s){return s!==void 0}function ai(s,i,o,u){if(u<i)throw hi(`Invalid value for '${s}'. Expected ${i} or greater.`);if(u>o)throw hi(`Invalid value for '${s}'. Expected ${o} or less.`)}function Kr(s){const i=encodeURIComponent;let o="?";for(const u in s)if(s.hasOwnProperty(u)){const p=i(u)+"="+i(s[u]);o=o+p+"&"}return o=o.slice(0,-1),o}var ue;(function(s){s[s.NO_ERROR=0]="NO_ERROR",s[s.NETWORK_ERROR=1]="NETWORK_ERROR",s[s.ABORT=2]="ABORT"})(ue||(ue={}));/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xr(s,i){const o=s>=500&&s<600,p=[408,429].indexOf(s)!==-1,v=i.indexOf(s)!==-1;return o||p||v}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wr{constructor(i,o,u,p,v,_,E,w,A,B,k,D=!0){this.url_=i,this.method_=o,this.headers_=u,this.body_=p,this.successCodes_=v,this.additionalRetryCodes_=_,this.callback_=E,this.errorCallback_=w,this.timeout_=A,this.progressCallback_=B,this.connectionFactory_=k,this.retry=D,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((U,I)=>{this.resolve_=U,this.reject_=I,this.start_()})}start_(){const i=(u,p)=>{if(p){u(!1,new ae(!1,null,!0));return}const v=this.connectionFactory_();this.pendingConnection_=v;const _=E=>{const w=E.loaded,A=E.lengthComputable?E.total:-1;this.progressCallback_!==null&&this.progressCallback_(w,A)};this.progressCallback_!==null&&v.addUploadProgressListener(_),v.send(this.url_,this.method_,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&v.removeUploadProgressListener(_),this.pendingConnection_=null;const E=v.getErrorCode()===ue.NO_ERROR,w=v.getStatus();if(!E||Xr(w,this.additionalRetryCodes_)&&this.retry){const B=v.getErrorCode()===ue.ABORT;u(!1,new ae(!1,null,B));return}const A=this.successCodes_.indexOf(w)!==-1;u(!0,new ae(A,v))})},o=(u,p)=>{const v=this.resolve_,_=this.reject_,E=p.connection;if(p.wasSuccessCode)try{const w=this.callback_(E,E.getResponse());Gr(w)?v(w):v()}catch(w){_(w)}else if(E!==null){const w=xr();w.serverResponse=E.getErrorText(),this.errorCallback_?_(this.errorCallback_(E,w)):_(w)}else if(p.canceled){const w=this.appDelete_?Pi():Br();_(w)}else{const w=Mr();_(w)}};this.canceled_?o(!1,new ae(!1,null,!0)):this.backoffId_=Vr(i,o,this.timeout_)}getPromise(){return this.promise_}cancel(i){this.canceled_=!0,this.appDelete_=i||!1,this.backoffId_!==null&&$r(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class ae{constructor(i,o,u){this.wasSuccessCode=i,this.connection=o,this.canceled=!!u}}function zr(s,i){i!==null&&i.length>0&&(s.Authorization="Firebase "+i)}function qr(s,i){s["X-Firebase-Storage-Version"]="webjs/"+(i??"AppManager")}function Yr(s,i){i&&(s["X-Firebase-GMPID"]=i)}function Jr(s,i){i!==null&&(s["X-Firebase-AppCheck"]=i)}function Qr(s,i,o,u,p,v,_=!0){const E=Kr(s.urlParams),w=s.url+E,A=Object.assign({},s.headers);return Yr(A,i),zr(A,o),qr(A,v),Jr(A,u),new Wr(w,s.method,A,s.body,s.successCodes,s.additionalRetryCodes,s.handler,s.errorHandler,s.timeout,s.progressCallback,p,_)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zr(s){if(s.length===0)return null;const i=s.lastIndexOf("/");return i===-1?"":s.slice(0,i)}function to(s){const i=s.lastIndexOf("/",s.length-2);return i===-1?s:s.slice(i+1)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ce{constructor(i,o){this._service=i,o instanceof tt?this._location=o:this._location=tt.makeFromUrl(o,i.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(i,o){return new ce(i,o)}get root(){const i=new tt(this._location.bucket,"");return this._newRef(this._service,i)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return to(this._location.path)}get storage(){return this._service}get parent(){const i=Zr(this._location.path);if(i===null)return null;const o=new tt(this._location.bucket,i);return new ce(this._service,o)}_throwIfRoot(i){if(this._location.path==="")throw jr(i)}}function li(s,i){const o=i?.[kr];return o==null?null:tt.makeFromBucketSpec(o,s)}class eo{constructor(i,o,u,p,v){this.app=i,this._authProvider=o,this._appCheckProvider=u,this._url=p,this._firebaseVersion=v,this._bucket=null,this._host=Ci,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=Nr,this._maxUploadRetryTime=Lr,this._requests=new Set,p!=null?this._bucket=tt.makeFromBucketSpec(p,this._host):this._bucket=li(this._host,this.app.options)}get host(){return this._host}set host(i){this._host=i,this._url!=null?this._bucket=tt.makeFromBucketSpec(this._url,i):this._bucket=li(i,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(i){ai("time",0,Number.POSITIVE_INFINITY,i),this._maxUploadRetryTime=i}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(i){ai("time",0,Number.POSITIVE_INFINITY,i),this._maxOperationRetryTime=i}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const i=this._authProvider.getImmediate({optional:!0});if(i){const o=await i.getToken();if(o!==null)return o.accessToken}return null}async _getAppCheckToken(){const i=this._appCheckProvider.getImmediate({optional:!0});return i?(await i.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(i=>i.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(i){return new ce(this,i)}_makeRequest(i,o,u,p,v=!0){if(this._deleted)return new Hr(Pi());{const _=Qr(i,this._appId,u,p,o,this._firebaseVersion,v);return this._requests.add(_),_.getPromise().then(()=>this._requests.delete(_),()=>this._requests.delete(_)),_}}async makeRequestWithTokens(i,o){const[u,p]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(i,o,u,p).getPromise()}}const ui="@firebase/storage",ci="0.13.2";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const no="storage";function io(s,{instanceIdentifier:i}){const o=s.getProvider("app").getImmediate(),u=s.getProvider("auth-internal"),p=s.getProvider("app-check-internal");return new eo(o,u,p,i,bi)}function so(){Gt(new $t(no,io,"PUBLIC").setMultipleInstances(!0)),gt(ui,ci,""),gt(ui,ci,"esm2017")}so();var fi=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Oi;(function(){var s;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function i(g,h){function l(){}l.prototype=h.prototype,g.D=h.prototype,g.prototype=new l,g.prototype.constructor=g,g.C=function(c,f,m){for(var a=Array(arguments.length-2),rt=2;rt<arguments.length;rt++)a[rt-2]=arguments[rt];return h.prototype[f].apply(c,a)}}function o(){this.blockSize=-1}function u(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.B=Array(this.blockSize),this.o=this.h=0,this.s()}i(u,o),u.prototype.s=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function p(g,h,l){l||(l=0);var c=Array(16);if(typeof h=="string")for(var f=0;16>f;++f)c[f]=h.charCodeAt(l++)|h.charCodeAt(l++)<<8|h.charCodeAt(l++)<<16|h.charCodeAt(l++)<<24;else for(f=0;16>f;++f)c[f]=h[l++]|h[l++]<<8|h[l++]<<16|h[l++]<<24;h=g.g[0],l=g.g[1],f=g.g[2];var m=g.g[3],a=h+(m^l&(f^m))+c[0]+3614090360&4294967295;h=l+(a<<7&4294967295|a>>>25),a=m+(f^h&(l^f))+c[1]+3905402710&4294967295,m=h+(a<<12&4294967295|a>>>20),a=f+(l^m&(h^l))+c[2]+606105819&4294967295,f=m+(a<<17&4294967295|a>>>15),a=l+(h^f&(m^h))+c[3]+3250441966&4294967295,l=f+(a<<22&4294967295|a>>>10),a=h+(m^l&(f^m))+c[4]+4118548399&4294967295,h=l+(a<<7&4294967295|a>>>25),a=m+(f^h&(l^f))+c[5]+1200080426&4294967295,m=h+(a<<12&4294967295|a>>>20),a=f+(l^m&(h^l))+c[6]+2821735955&4294967295,f=m+(a<<17&4294967295|a>>>15),a=l+(h^f&(m^h))+c[7]+4249261313&4294967295,l=f+(a<<22&4294967295|a>>>10),a=h+(m^l&(f^m))+c[8]+1770035416&4294967295,h=l+(a<<7&4294967295|a>>>25),a=m+(f^h&(l^f))+c[9]+2336552879&4294967295,m=h+(a<<12&4294967295|a>>>20),a=f+(l^m&(h^l))+c[10]+4294925233&4294967295,f=m+(a<<17&4294967295|a>>>15),a=l+(h^f&(m^h))+c[11]+2304563134&4294967295,l=f+(a<<22&4294967295|a>>>10),a=h+(m^l&(f^m))+c[12]+1804603682&4294967295,h=l+(a<<7&4294967295|a>>>25),a=m+(f^h&(l^f))+c[13]+4254626195&4294967295,m=h+(a<<12&4294967295|a>>>20),a=f+(l^m&(h^l))+c[14]+2792965006&4294967295,f=m+(a<<17&4294967295|a>>>15),a=l+(h^f&(m^h))+c[15]+1236535329&4294967295,l=f+(a<<22&4294967295|a>>>10),a=h+(f^m&(l^f))+c[1]+4129170786&4294967295,h=l+(a<<5&4294967295|a>>>27),a=m+(l^f&(h^l))+c[6]+3225465664&4294967295,m=h+(a<<9&4294967295|a>>>23),a=f+(h^l&(m^h))+c[11]+643717713&4294967295,f=m+(a<<14&4294967295|a>>>18),a=l+(m^h&(f^m))+c[0]+3921069994&4294967295,l=f+(a<<20&4294967295|a>>>12),a=h+(f^m&(l^f))+c[5]+3593408605&4294967295,h=l+(a<<5&4294967295|a>>>27),a=m+(l^f&(h^l))+c[10]+38016083&4294967295,m=h+(a<<9&4294967295|a>>>23),a=f+(h^l&(m^h))+c[15]+3634488961&4294967295,f=m+(a<<14&4294967295|a>>>18),a=l+(m^h&(f^m))+c[4]+3889429448&4294967295,l=f+(a<<20&4294967295|a>>>12),a=h+(f^m&(l^f))+c[9]+568446438&4294967295,h=l+(a<<5&4294967295|a>>>27),a=m+(l^f&(h^l))+c[14]+3275163606&4294967295,m=h+(a<<9&4294967295|a>>>23),a=f+(h^l&(m^h))+c[3]+4107603335&4294967295,f=m+(a<<14&4294967295|a>>>18),a=l+(m^h&(f^m))+c[8]+1163531501&4294967295,l=f+(a<<20&4294967295|a>>>12),a=h+(f^m&(l^f))+c[13]+2850285829&4294967295,h=l+(a<<5&4294967295|a>>>27),a=m+(l^f&(h^l))+c[2]+4243563512&4294967295,m=h+(a<<9&4294967295|a>>>23),a=f+(h^l&(m^h))+c[7]+1735328473&4294967295,f=m+(a<<14&4294967295|a>>>18),a=l+(m^h&(f^m))+c[12]+2368359562&4294967295,l=f+(a<<20&4294967295|a>>>12),a=h+(l^f^m)+c[5]+4294588738&4294967295,h=l+(a<<4&4294967295|a>>>28),a=m+(h^l^f)+c[8]+2272392833&4294967295,m=h+(a<<11&4294967295|a>>>21),a=f+(m^h^l)+c[11]+1839030562&4294967295,f=m+(a<<16&4294967295|a>>>16),a=l+(f^m^h)+c[14]+4259657740&4294967295,l=f+(a<<23&4294967295|a>>>9),a=h+(l^f^m)+c[1]+2763975236&4294967295,h=l+(a<<4&4294967295|a>>>28),a=m+(h^l^f)+c[4]+1272893353&4294967295,m=h+(a<<11&4294967295|a>>>21),a=f+(m^h^l)+c[7]+4139469664&4294967295,f=m+(a<<16&4294967295|a>>>16),a=l+(f^m^h)+c[10]+3200236656&4294967295,l=f+(a<<23&4294967295|a>>>9),a=h+(l^f^m)+c[13]+681279174&4294967295,h=l+(a<<4&4294967295|a>>>28),a=m+(h^l^f)+c[0]+3936430074&4294967295,m=h+(a<<11&4294967295|a>>>21),a=f+(m^h^l)+c[3]+3572445317&4294967295,f=m+(a<<16&4294967295|a>>>16),a=l+(f^m^h)+c[6]+76029189&4294967295,l=f+(a<<23&4294967295|a>>>9),a=h+(l^f^m)+c[9]+3654602809&4294967295,h=l+(a<<4&4294967295|a>>>28),a=m+(h^l^f)+c[12]+3873151461&4294967295,m=h+(a<<11&4294967295|a>>>21),a=f+(m^h^l)+c[15]+530742520&4294967295,f=m+(a<<16&4294967295|a>>>16),a=l+(f^m^h)+c[2]+3299628645&4294967295,l=f+(a<<23&4294967295|a>>>9),a=h+(f^(l|~m))+c[0]+4096336452&4294967295,h=l+(a<<6&4294967295|a>>>26),a=m+(l^(h|~f))+c[7]+1126891415&4294967295,m=h+(a<<10&4294967295|a>>>22),a=f+(h^(m|~l))+c[14]+2878612391&4294967295,f=m+(a<<15&4294967295|a>>>17),a=l+(m^(f|~h))+c[5]+4237533241&4294967295,l=f+(a<<21&4294967295|a>>>11),a=h+(f^(l|~m))+c[12]+1700485571&4294967295,h=l+(a<<6&4294967295|a>>>26),a=m+(l^(h|~f))+c[3]+2399980690&4294967295,m=h+(a<<10&4294967295|a>>>22),a=f+(h^(m|~l))+c[10]+4293915773&4294967295,f=m+(a<<15&4294967295|a>>>17),a=l+(m^(f|~h))+c[1]+2240044497&4294967295,l=f+(a<<21&4294967295|a>>>11),a=h+(f^(l|~m))+c[8]+1873313359&4294967295,h=l+(a<<6&4294967295|a>>>26),a=m+(l^(h|~f))+c[15]+4264355552&4294967295,m=h+(a<<10&4294967295|a>>>22),a=f+(h^(m|~l))+c[6]+2734768916&4294967295,f=m+(a<<15&4294967295|a>>>17),a=l+(m^(f|~h))+c[13]+1309151649&4294967295,l=f+(a<<21&4294967295|a>>>11),a=h+(f^(l|~m))+c[4]+4149444226&4294967295,h=l+(a<<6&4294967295|a>>>26),a=m+(l^(h|~f))+c[11]+3174756917&4294967295,m=h+(a<<10&4294967295|a>>>22),a=f+(h^(m|~l))+c[2]+718787259&4294967295,f=m+(a<<15&4294967295|a>>>17),a=l+(m^(f|~h))+c[9]+3951481745&4294967295,g.g[0]=g.g[0]+h&4294967295,g.g[1]=g.g[1]+(f+(a<<21&4294967295|a>>>11))&4294967295,g.g[2]=g.g[2]+f&4294967295,g.g[3]=g.g[3]+m&4294967295}u.prototype.u=function(g,h){h===void 0&&(h=g.length);for(var l=h-this.blockSize,c=this.B,f=this.h,m=0;m<h;){if(f==0)for(;m<=l;)p(this,g,m),m+=this.blockSize;if(typeof g=="string"){for(;m<h;)if(c[f++]=g.charCodeAt(m++),f==this.blockSize){p(this,c),f=0;break}}else for(;m<h;)if(c[f++]=g[m++],f==this.blockSize){p(this,c),f=0;break}}this.h=f,this.o+=h},u.prototype.v=function(){var g=Array((56>this.h?this.blockSize:2*this.blockSize)-this.h);g[0]=128;for(var h=1;h<g.length-8;++h)g[h]=0;var l=8*this.o;for(h=g.length-8;h<g.length;++h)g[h]=l&255,l/=256;for(this.u(g),g=Array(16),h=l=0;4>h;++h)for(var c=0;32>c;c+=8)g[l++]=this.g[h]>>>c&255;return g};function v(g,h){var l=E;return Object.prototype.hasOwnProperty.call(l,g)?l[g]:l[g]=h(g)}function _(g,h){this.h=h;for(var l=[],c=!0,f=g.length-1;0<=f;f--){var m=g[f]|0;c&&m==h||(l[f]=m,c=!1)}this.g=l}var E={};function w(g){return-128<=g&&128>g?v(g,function(h){return new _([h|0],0>h?-1:0)}):new _([g|0],0>g?-1:0)}function A(g){if(isNaN(g)||!isFinite(g))return k;if(0>g)return b(A(-g));for(var h=[],l=1,c=0;g>=l;c++)h[c]=g/l|0,l*=4294967296;return new _(h,0)}function B(g,h){if(g.length==0)throw Error("number format error: empty string");if(h=h||10,2>h||36<h)throw Error("radix out of range: "+h);if(g.charAt(0)=="-")return b(B(g.substring(1),h));if(0<=g.indexOf("-"))throw Error('number format error: interior "-" character');for(var l=A(Math.pow(h,8)),c=k,f=0;f<g.length;f+=8){var m=Math.min(8,g.length-f),a=parseInt(g.substring(f,f+m),h);8>m?(m=A(Math.pow(h,m)),c=c.j(m).add(A(a))):(c=c.j(l),c=c.add(A(a)))}return c}var k=w(0),D=w(1),U=w(16777216);s=_.prototype,s.m=function(){if(N(this))return-b(this).m();for(var g=0,h=1,l=0;l<this.g.length;l++){var c=this.i(l);g+=(0<=c?c:4294967296+c)*h,h*=4294967296}return g},s.toString=function(g){if(g=g||10,2>g||36<g)throw Error("radix out of range: "+g);if(I(this))return"0";if(N(this))return"-"+b(this).toString(g);for(var h=A(Math.pow(g,6)),l=this,c="";;){var f=x(l,h).g;l=Y(l,f.j(h));var m=((0<l.g.length?l.g[0]:l.h)>>>0).toString(g);if(l=f,I(l))return m+c;for(;6>m.length;)m="0"+m;c=m+c}},s.i=function(g){return 0>g?0:g<this.g.length?this.g[g]:this.h};function I(g){if(g.h!=0)return!1;for(var h=0;h<g.g.length;h++)if(g.g[h]!=0)return!1;return!0}function N(g){return g.h==-1}s.l=function(g){return g=Y(this,g),N(g)?-1:I(g)?0:1};function b(g){for(var h=g.g.length,l=[],c=0;c<h;c++)l[c]=~g.g[c];return new _(l,~g.h).add(D)}s.abs=function(){return N(this)?b(this):this},s.add=function(g){for(var h=Math.max(this.g.length,g.g.length),l=[],c=0,f=0;f<=h;f++){var m=c+(this.i(f)&65535)+(g.i(f)&65535),a=(m>>>16)+(this.i(f)>>>16)+(g.i(f)>>>16);c=a>>>16,m&=65535,a&=65535,l[f]=a<<16|m}return new _(l,l[l.length-1]&-2147483648?-1:0)};function Y(g,h){return g.add(b(h))}s.j=function(g){if(I(this)||I(g))return k;if(N(this))return N(g)?b(this).j(b(g)):b(b(this).j(g));if(N(g))return b(this.j(b(g)));if(0>this.l(U)&&0>g.l(U))return A(this.m()*g.m());for(var h=this.g.length+g.g.length,l=[],c=0;c<2*h;c++)l[c]=0;for(c=0;c<this.g.length;c++)for(var f=0;f<g.g.length;f++){var m=this.i(c)>>>16,a=this.i(c)&65535,rt=g.i(f)>>>16,It=g.i(f)&65535;l[2*c+2*f]+=a*It,z(l,2*c+2*f),l[2*c+2*f+1]+=m*It,z(l,2*c+2*f+1),l[2*c+2*f+1]+=a*rt,z(l,2*c+2*f+1),l[2*c+2*f+2]+=m*rt,z(l,2*c+2*f+2)}for(c=0;c<h;c++)l[c]=l[2*c+1]<<16|l[2*c];for(c=h;c<2*h;c++)l[c]=0;return new _(l,0)};function z(g,h){for(;(g[h]&65535)!=g[h];)g[h+1]+=g[h]>>>16,g[h]&=65535,h++}function M(g,h){this.g=g,this.h=h}function x(g,h){if(I(h))throw Error("division by zero");if(I(g))return new M(k,k);if(N(g))return h=x(b(g),h),new M(b(h.g),b(h.h));if(N(h))return h=x(g,b(h)),new M(b(h.g),h.h);if(30<g.g.length){if(N(g)||N(h))throw Error("slowDivide_ only works with positive integers.");for(var l=D,c=h;0>=c.l(g);)l=st(l),c=st(c);var f=X(l,1),m=X(c,1);for(c=X(c,2),l=X(l,2);!I(c);){var a=m.add(c);0>=a.l(g)&&(f=f.add(l),m=a),c=X(c,1),l=X(l,1)}return h=Y(g,f.j(h)),new M(f,h)}for(f=k;0<=g.l(h);){for(l=Math.max(1,Math.floor(g.m()/h.m())),c=Math.ceil(Math.log(l)/Math.LN2),c=48>=c?1:Math.pow(2,c-48),m=A(l),a=m.j(h);N(a)||0<a.l(g);)l-=c,m=A(l),a=m.j(h);I(m)&&(m=D),f=f.add(m),g=Y(g,a)}return new M(f,g)}s.A=function(g){return x(this,g).h},s.and=function(g){for(var h=Math.max(this.g.length,g.g.length),l=[],c=0;c<h;c++)l[c]=this.i(c)&g.i(c);return new _(l,this.h&g.h)},s.or=function(g){for(var h=Math.max(this.g.length,g.g.length),l=[],c=0;c<h;c++)l[c]=this.i(c)|g.i(c);return new _(l,this.h|g.h)},s.xor=function(g){for(var h=Math.max(this.g.length,g.g.length),l=[],c=0;c<h;c++)l[c]=this.i(c)^g.i(c);return new _(l,this.h^g.h)};function st(g){for(var h=g.g.length+1,l=[],c=0;c<h;c++)l[c]=g.i(c)<<1|g.i(c-1)>>>31;return new _(l,g.h)}function X(g,h){var l=h>>5;h%=32;for(var c=g.g.length-l,f=[],m=0;m<c;m++)f[m]=0<h?g.i(m+l)>>>h|g.i(m+l+1)<<32-h:g.i(m+l);return new _(f,g.h)}u.prototype.digest=u.prototype.v,u.prototype.reset=u.prototype.s,u.prototype.update=u.prototype.u,_.prototype.add=_.prototype.add,_.prototype.multiply=_.prototype.j,_.prototype.modulo=_.prototype.A,_.prototype.compare=_.prototype.l,_.prototype.toNumber=_.prototype.m,_.prototype.toString=_.prototype.toString,_.prototype.getBits=_.prototype.i,_.fromNumber=A,_.fromString=B,Oi=_}).apply(typeof fi<"u"?fi:typeof self<"u"?self:typeof window<"u"?window:{});var le=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};(function(){var s,i=typeof Object.defineProperties=="function"?Object.defineProperty:function(t,e,n){return t==Array.prototype||t==Object.prototype||(t[e]=n.value),t};function o(t){t=[typeof globalThis=="object"&&globalThis,t,typeof window=="object"&&window,typeof self=="object"&&self,typeof le=="object"&&le];for(var e=0;e<t.length;++e){var n=t[e];if(n&&n.Math==Math)return n}throw Error("Cannot find global object")}var u=o(this);function p(t,e){if(e)t:{var n=u;t=t.split(".");for(var r=0;r<t.length-1;r++){var d=t[r];if(!(d in n))break t;n=n[d]}t=t[t.length-1],r=n[t],e=e(r),e!=r&&e!=null&&i(n,t,{configurable:!0,writable:!0,value:e})}}function v(t,e){t instanceof String&&(t+="");var n=0,r=!1,d={next:function(){if(!r&&n<t.length){var y=n++;return{value:e(y,t[y]),done:!1}}return r=!0,{done:!0,value:void 0}}};return d[Symbol.iterator]=function(){return d},d}p("Array.prototype.values",function(t){return t||function(){return v(this,function(e,n){return n})}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var _=_||{},E=this||self;function w(t){var e=typeof t;return e=e!="object"?e:t?Array.isArray(t)?"array":e:"null",e=="array"||e=="object"&&typeof t.length=="number"}function A(t){var e=typeof t;return e=="object"&&t!=null||e=="function"}function B(t,e,n){return t.call.apply(t.bind,arguments)}function k(t,e,n){if(!t)throw Error();if(2<arguments.length){var r=Array.prototype.slice.call(arguments,2);return function(){var d=Array.prototype.slice.call(arguments);return Array.prototype.unshift.apply(d,r),t.apply(e,d)}}return function(){return t.apply(e,arguments)}}function D(t,e,n){return D=Function.prototype.bind&&Function.prototype.bind.toString().indexOf("native code")!=-1?B:k,D.apply(null,arguments)}function U(t,e){var n=Array.prototype.slice.call(arguments,1);return function(){var r=n.slice();return r.push.apply(r,arguments),t.apply(this,r)}}function I(t,e){function n(){}n.prototype=e.prototype,t.aa=e.prototype,t.prototype=new n,t.prototype.constructor=t,t.Qb=function(r,d,y){for(var T=Array(arguments.length-2),C=2;C<arguments.length;C++)T[C-2]=arguments[C];return e.prototype[d].apply(r,T)}}function N(t){const e=t.length;if(0<e){const n=Array(e);for(let r=0;r<e;r++)n[r]=t[r];return n}return[]}function b(t,e){for(let n=1;n<arguments.length;n++){const r=arguments[n];if(w(r)){const d=t.length||0,y=r.length||0;t.length=d+y;for(let T=0;T<y;T++)t[d+T]=r[T]}else t.push(r)}}class Y{constructor(e,n){this.i=e,this.j=n,this.h=0,this.g=null}get(){let e;return 0<this.h?(this.h--,e=this.g,this.g=e.next,e.next=null):e=this.i(),e}}function z(t){return/^[\s\xa0]*$/.test(t)}function M(){var t=E.navigator;return t&&(t=t.userAgent)?t:""}function x(t){return x[" "](t),t}x[" "]=function(){};var st=M().indexOf("Gecko")!=-1&&!(M().toLowerCase().indexOf("webkit")!=-1&&M().indexOf("Edge")==-1)&&!(M().indexOf("Trident")!=-1||M().indexOf("MSIE")!=-1)&&M().indexOf("Edge")==-1;function X(t,e,n){for(const r in t)e.call(n,t[r],r,t)}function g(t,e){for(const n in t)e.call(void 0,t[n],n,t)}function h(t){const e={};for(const n in t)e[n]=t[n];return e}const l="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function c(t,e){let n,r;for(let d=1;d<arguments.length;d++){r=arguments[d];for(n in r)t[n]=r[n];for(let y=0;y<l.length;y++)n=l[y],Object.prototype.hasOwnProperty.call(r,n)&&(t[n]=r[n])}}function f(t){var e=1;t=t.split(":");const n=[];for(;0<e&&t.length;)n.push(t.shift()),e--;return t.length&&n.push(t.join(":")),n}function m(t){E.setTimeout(()=>{throw t},0)}function a(){var t=de;let e=null;return t.g&&(e=t.g,t.g=t.g.next,t.g||(t.h=null),e.next=null),e}class rt{constructor(){this.h=this.g=null}add(e,n){const r=It.get();r.set(e,n),this.h?this.h.next=r:this.g=r,this.h=r}}var It=new Y(()=>new xi,t=>t.reset());class xi{constructor(){this.next=this.g=this.h=null}set(e,n){this.h=e,this.g=n,this.next=null}reset(){this.next=this.g=this.h=null}}let Rt,bt=!1,de=new rt,Ze=()=>{const t=E.Promise.resolve(void 0);Rt=()=>{t.then(Mi)}};var Mi=()=>{for(var t;t=a();){try{t.h.call(t.g)}catch(n){m(n)}var e=It;e.j(t),100>e.h&&(e.h++,t.next=e.g,e.g=t)}bt=!1};function lt(){this.s=this.s,this.C=this.C}lt.prototype.s=!1,lt.prototype.ma=function(){this.s||(this.s=!0,this.N())},lt.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function j(t,e){this.type=t,this.g=this.target=e,this.defaultPrevented=!1}j.prototype.h=function(){this.defaultPrevented=!0};var Bi=function(){if(!E.addEventListener||!Object.defineProperty)return!1;var t=!1,e=Object.defineProperty({},"passive",{get:function(){t=!0}});try{const n=()=>{};E.addEventListener("test",n,e),E.removeEventListener("test",n,e)}catch{}return t}();function St(t,e){if(j.call(this,t?t.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,t){var n=this.type=t.type,r=t.changedTouches&&t.changedTouches.length?t.changedTouches[0]:null;if(this.target=t.target||t.srcElement,this.g=e,e=t.relatedTarget){if(st){t:{try{x(e.nodeName);var d=!0;break t}catch{}d=!1}d||(e=null)}}else n=="mouseover"?e=t.fromElement:n=="mouseout"&&(e=t.toElement);this.relatedTarget=e,r?(this.clientX=r.clientX!==void 0?r.clientX:r.pageX,this.clientY=r.clientY!==void 0?r.clientY:r.pageY,this.screenX=r.screenX||0,this.screenY=r.screenY||0):(this.clientX=t.clientX!==void 0?t.clientX:t.pageX,this.clientY=t.clientY!==void 0?t.clientY:t.pageY,this.screenX=t.screenX||0,this.screenY=t.screenY||0),this.button=t.button,this.key=t.key||"",this.ctrlKey=t.ctrlKey,this.altKey=t.altKey,this.shiftKey=t.shiftKey,this.metaKey=t.metaKey,this.pointerId=t.pointerId||0,this.pointerType=typeof t.pointerType=="string"?t.pointerType:Ui[t.pointerType]||"",this.state=t.state,this.i=t,t.defaultPrevented&&St.aa.h.call(this)}}I(St,j);var Ui={2:"touch",3:"pen",4:"mouse"};St.prototype.h=function(){St.aa.h.call(this);var t=this.i;t.preventDefault?t.preventDefault():t.returnValue=!1};var Xt="closure_listenable_"+(1e6*Math.random()|0),Fi=0;function ji(t,e,n,r,d){this.listener=t,this.proxy=null,this.src=e,this.type=n,this.capture=!!r,this.ha=d,this.key=++Fi,this.da=this.fa=!1}function Wt(t){t.da=!0,t.listener=null,t.proxy=null,t.src=null,t.ha=null}function zt(t){this.src=t,this.g={},this.h=0}zt.prototype.add=function(t,e,n,r,d){var y=t.toString();t=this.g[y],t||(t=this.g[y]=[],this.h++);var T=ye(t,e,r,d);return-1<T?(e=t[T],n||(e.fa=!1)):(e=new ji(e,this.src,y,!!r,d),e.fa=n,t.push(e)),e};function me(t,e){var n=e.type;if(n in t.g){var r=t.g[n],d=Array.prototype.indexOf.call(r,e,void 0),y;(y=0<=d)&&Array.prototype.splice.call(r,d,1),y&&(Wt(e),t.g[n].length==0&&(delete t.g[n],t.h--))}}function ye(t,e,n,r){for(var d=0;d<t.length;++d){var y=t[d];if(!y.da&&y.listener==e&&y.capture==!!n&&y.ha==r)return d}return-1}var ve="closure_lm_"+(1e6*Math.random()|0),_e={};function tn(t,e,n,r,d){if(Array.isArray(e)){for(var y=0;y<e.length;y++)tn(t,e[y],n,r,d);return null}return n=sn(n),t&&t[Xt]?t.K(e,n,A(r)?!!r.capture:!1,d):Hi(t,e,n,!1,r,d)}function Hi(t,e,n,r,d,y){if(!e)throw Error("Invalid event type");var T=A(d)?!!d.capture:!!d,C=Te(t);if(C||(t[ve]=C=new zt(t)),n=C.add(e,n,r,T,y),n.proxy)return n;if(r=Vi(),n.proxy=r,r.src=t,r.listener=n,t.addEventListener)Bi||(d=T),d===void 0&&(d=!1),t.addEventListener(e.toString(),r,d);else if(t.attachEvent)t.attachEvent(nn(e.toString()),r);else if(t.addListener&&t.removeListener)t.addListener(r);else throw Error("addEventListener and attachEvent are unavailable.");return n}function Vi(){function t(n){return e.call(t.src,t.listener,n)}const e=$i;return t}function en(t,e,n,r,d){if(Array.isArray(e))for(var y=0;y<e.length;y++)en(t,e[y],n,r,d);else r=A(r)?!!r.capture:!!r,n=sn(n),t&&t[Xt]?(t=t.i,e=String(e).toString(),e in t.g&&(y=t.g[e],n=ye(y,n,r,d),-1<n&&(Wt(y[n]),Array.prototype.splice.call(y,n,1),y.length==0&&(delete t.g[e],t.h--)))):t&&(t=Te(t))&&(e=t.g[e.toString()],t=-1,e&&(t=ye(e,n,r,d)),(n=-1<t?e[t]:null)&&Ee(n))}function Ee(t){if(typeof t!="number"&&t&&!t.da){var e=t.src;if(e&&e[Xt])me(e.i,t);else{var n=t.type,r=t.proxy;e.removeEventListener?e.removeEventListener(n,r,t.capture):e.detachEvent?e.detachEvent(nn(n),r):e.addListener&&e.removeListener&&e.removeListener(r),(n=Te(e))?(me(n,t),n.h==0&&(n.src=null,e[ve]=null)):Wt(t)}}}function nn(t){return t in _e?_e[t]:_e[t]="on"+t}function $i(t,e){if(t.da)t=!0;else{e=new St(e,this);var n=t.listener,r=t.ha||t.src;t.fa&&Ee(t),t=n.call(r,e)}return t}function Te(t){return t=t[ve],t instanceof zt?t:null}var we="__closure_events_fn_"+(1e9*Math.random()>>>0);function sn(t){return typeof t=="function"?t:(t[we]||(t[we]=function(e){return t.handleEvent(e)}),t[we])}function H(){lt.call(this),this.i=new zt(this),this.M=this,this.F=null}I(H,lt),H.prototype[Xt]=!0,H.prototype.removeEventListener=function(t,e,n,r){en(this,t,e,n,r)};function G(t,e){var n,r=t.F;if(r)for(n=[];r;r=r.F)n.push(r);if(t=t.M,r=e.type||e,typeof e=="string")e=new j(e,t);else if(e instanceof j)e.target=e.target||t;else{var d=e;e=new j(r,t),c(e,d)}if(d=!0,n)for(var y=n.length-1;0<=y;y--){var T=e.g=n[y];d=qt(T,r,!0,e)&&d}if(T=e.g=t,d=qt(T,r,!0,e)&&d,d=qt(T,r,!1,e)&&d,n)for(y=0;y<n.length;y++)T=e.g=n[y],d=qt(T,r,!1,e)&&d}H.prototype.N=function(){if(H.aa.N.call(this),this.i){var t=this.i,e;for(e in t.g){for(var n=t.g[e],r=0;r<n.length;r++)Wt(n[r]);delete t.g[e],t.h--}}this.F=null},H.prototype.K=function(t,e,n,r){return this.i.add(String(t),e,!1,n,r)},H.prototype.L=function(t,e,n,r){return this.i.add(String(t),e,!0,n,r)};function qt(t,e,n,r){if(e=t.i.g[String(e)],!e)return!0;e=e.concat();for(var d=!0,y=0;y<e.length;++y){var T=e[y];if(T&&!T.da&&T.capture==n){var C=T.listener,F=T.ha||T.src;T.fa&&me(t.i,T),d=C.call(F,r)!==!1&&d}}return d&&!r.defaultPrevented}function rn(t,e,n){if(typeof t=="function")n&&(t=D(t,n));else if(t&&typeof t.handleEvent=="function")t=D(t.handleEvent,t);else throw Error("Invalid listener argument");return 2147483647<Number(e)?-1:E.setTimeout(t,e||0)}function on(t){t.g=rn(()=>{t.g=null,t.i&&(t.i=!1,on(t))},t.l);const e=t.h;t.h=null,t.m.apply(null,e)}class Gi extends lt{constructor(e,n){super(),this.m=e,this.l=n,this.h=null,this.i=!1,this.g=null}j(e){this.h=arguments,this.g?this.i=!0:on(this)}N(){super.N(),this.g&&(E.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Dt(t){lt.call(this),this.h=t,this.g={}}I(Dt,lt);var hn=[];function an(t){X(t.g,function(e,n){this.g.hasOwnProperty(n)&&Ee(e)},t),t.g={}}Dt.prototype.N=function(){Dt.aa.N.call(this),an(this)},Dt.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Ae=E.JSON.stringify,Ki=E.JSON.parse,Xi=class{stringify(t){return E.JSON.stringify(t,void 0)}parse(t){return E.JSON.parse(t,void 0)}};function Ie(){}Ie.prototype.h=null;function ln(t){return t.h||(t.h=t.i())}function Wi(){}var Ct={OPEN:"a",kb:"b",Ja:"c",wb:"d"};function Re(){j.call(this,"d")}I(Re,j);function be(){j.call(this,"c")}I(be,j);var _t={},un=null;function Se(){return un=un||new H}_t.La="serverreachability";function cn(t){j.call(this,_t.La,t)}I(cn,j);function Pt(t){const e=Se();G(e,new cn(e))}_t.STAT_EVENT="statevent";function fn(t,e){j.call(this,_t.STAT_EVENT,t),this.stat=e}I(fn,j);function K(t){const e=Se();G(e,new fn(e,t))}_t.Ma="timingevent";function pn(t,e){j.call(this,_t.Ma,t),this.size=e}I(pn,j);function Ot(t,e){if(typeof t!="function")throw Error("Fn must not be null and must be a function");return E.setTimeout(function(){t()},e)}function kt(){this.g=!0}kt.prototype.xa=function(){this.g=!1};function zi(t,e,n,r,d,y){t.info(function(){if(t.g)if(y)for(var T="",C=y.split("&"),F=0;F<C.length;F++){var S=C[F].split("=");if(1<S.length){var V=S[0];S=S[1];var $=V.split("_");T=2<=$.length&&$[1]=="type"?T+(V+"="+S+"&"):T+(V+"=redacted&")}}else T=null;else T=y;return"XMLHTTP REQ ("+r+") [attempt "+d+"]: "+e+`
`+n+`
`+T})}function qi(t,e,n,r,d,y,T){t.info(function(){return"XMLHTTP RESP ("+r+") [ attempt "+d+"]: "+e+`
`+n+`
`+y+" "+T})}function Et(t,e,n,r){t.info(function(){return"XMLHTTP TEXT ("+e+"): "+Ji(t,n)+(r?" "+r:"")})}function Yi(t,e){t.info(function(){return"TIMEOUT: "+e})}kt.prototype.info=function(){};function Ji(t,e){if(!t.g)return e;if(!e)return null;try{var n=JSON.parse(e);if(n){for(t=0;t<n.length;t++)if(Array.isArray(n[t])){var r=n[t];if(!(2>r.length)){var d=r[1];if(Array.isArray(d)&&!(1>d.length)){var y=d[0];if(y!="noop"&&y!="stop"&&y!="close")for(var T=1;T<d.length;T++)d[T]=""}}}}return Ae(n)}catch{return e}}var De={NO_ERROR:0,TIMEOUT:8},Qi={},Ce;function Yt(){}I(Yt,Ie),Yt.prototype.g=function(){return new XMLHttpRequest},Yt.prototype.i=function(){return{}},Ce=new Yt;function ut(t,e,n,r){this.j=t,this.i=e,this.l=n,this.R=r||1,this.U=new Dt(this),this.I=45e3,this.H=null,this.o=!1,this.m=this.A=this.v=this.L=this.F=this.S=this.B=null,this.D=[],this.g=null,this.C=0,this.s=this.u=null,this.X=-1,this.J=!1,this.O=0,this.M=null,this.W=this.K=this.T=this.P=!1,this.h=new gn}function gn(){this.i=null,this.g="",this.h=!1}var dn={},Pe={};function Oe(t,e,n){t.L=1,t.v=te(ot(e)),t.m=n,t.P=!0,mn(t,null)}function mn(t,e){t.F=Date.now(),Jt(t),t.A=ot(t.v);var n=t.A,r=t.R;Array.isArray(r)||(r=[String(r)]),Pn(n.i,"t",r),t.C=0,n=t.j.J,t.h=new gn,t.g=zn(t.j,n?e:null,!t.m),0<t.O&&(t.M=new Gi(D(t.Y,t,t.g),t.O)),e=t.U,n=t.g,r=t.ca;var d="readystatechange";Array.isArray(d)||(d&&(hn[0]=d.toString()),d=hn);for(var y=0;y<d.length;y++){var T=tn(n,d[y],r||e.handleEvent,!1,e.h||e);if(!T)break;e.g[T.key]=T}e=t.H?h(t.H):{},t.m?(t.u||(t.u="POST"),e["Content-Type"]="application/x-www-form-urlencoded",t.g.ea(t.A,t.u,t.m,e)):(t.u="GET",t.g.ea(t.A,t.u,null,e)),Pt(),zi(t.i,t.u,t.A,t.l,t.R,t.m)}ut.prototype.ca=function(t){t=t.target;const e=this.M;e&&ht(t)==3?e.j():this.Y(t)},ut.prototype.Y=function(t){try{if(t==this.g)t:{const $=ht(this.g);var e=this.g.Ba();const At=this.g.Z();if(!(3>$)&&($!=3||this.g&&(this.h.h||this.g.oa()||Bn(this.g)))){this.J||$!=4||e==7||(e==8||0>=At?Pt(3):Pt(2)),ke(this);var n=this.g.Z();this.X=n;e:if(yn(this)){var r=Bn(this.g);t="";var d=r.length,y=ht(this.g)==4;if(!this.h.i){if(typeof TextDecoder>"u"){dt(this),Nt(this);var T="";break e}this.h.i=new E.TextDecoder}for(e=0;e<d;e++)this.h.h=!0,t+=this.h.i.decode(r[e],{stream:!(y&&e==d-1)});r.length=0,this.h.g+=t,this.C=0,T=this.h.g}else T=this.g.oa();if(this.o=n==200,qi(this.i,this.u,this.A,this.l,this.R,$,n),this.o){if(this.T&&!this.K){e:{if(this.g){var C,F=this.g;if((C=F.g?F.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!z(C)){var S=C;break e}}S=null}if(n=S)Et(this.i,this.l,n,"Initial handshake response via X-HTTP-Initial-Response"),this.K=!0,Ne(this,n);else{this.o=!1,this.s=3,K(12),dt(this),Nt(this);break t}}if(this.P){n=!0;let J;for(;!this.J&&this.C<T.length;)if(J=Zi(this,T),J==Pe){$==4&&(this.s=4,K(14),n=!1),Et(this.i,this.l,null,"[Incomplete Response]");break}else if(J==dn){this.s=4,K(15),Et(this.i,this.l,T,"[Invalid Chunk]"),n=!1;break}else Et(this.i,this.l,J,null),Ne(this,J);if(yn(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),$!=4||T.length!=0||this.h.h||(this.s=1,K(16),n=!1),this.o=this.o&&n,!n)Et(this.i,this.l,T,"[Invalid Chunked Response]"),dt(this),Nt(this);else if(0<T.length&&!this.W){this.W=!0;var V=this.j;V.g==this&&V.ba&&!V.M&&(V.j.info("Great, no buffering proxy detected. Bytes received: "+T.length),Fe(V),V.M=!0,K(11))}}else Et(this.i,this.l,T,null),Ne(this,T);$==4&&dt(this),this.o&&!this.J&&($==4?Gn(this.j,this):(this.o=!1,Jt(this)))}else ms(this.g),n==400&&0<T.indexOf("Unknown SID")?(this.s=3,K(12)):(this.s=0,K(13)),dt(this),Nt(this)}}}catch{}finally{}};function yn(t){return t.g?t.u=="GET"&&t.L!=2&&t.j.Ca:!1}function Zi(t,e){var n=t.C,r=e.indexOf(`
`,n);return r==-1?Pe:(n=Number(e.substring(n,r)),isNaN(n)?dn:(r+=1,r+n>e.length?Pe:(e=e.slice(r,r+n),t.C=r+n,e)))}ut.prototype.cancel=function(){this.J=!0,dt(this)};function Jt(t){t.S=Date.now()+t.I,vn(t,t.I)}function vn(t,e){if(t.B!=null)throw Error("WatchDog timer not null");t.B=Ot(D(t.ba,t),e)}function ke(t){t.B&&(E.clearTimeout(t.B),t.B=null)}ut.prototype.ba=function(){this.B=null;const t=Date.now();0<=t-this.S?(Yi(this.i,this.A),this.L!=2&&(Pt(),K(17)),dt(this),this.s=2,Nt(this)):vn(this,this.S-t)};function Nt(t){t.j.G==0||t.J||Gn(t.j,t)}function dt(t){ke(t);var e=t.M;e&&typeof e.ma=="function"&&e.ma(),t.M=null,an(t.U),t.g&&(e=t.g,t.g=null,e.abort(),e.ma())}function Ne(t,e){try{var n=t.j;if(n.G!=0&&(n.g==t||Le(n.h,t))){if(!t.K&&Le(n.h,t)&&n.G==3){try{var r=n.Da.g.parse(e)}catch{r=null}if(Array.isArray(r)&&r.length==3){var d=r;if(d[0]==0){t:if(!n.u){if(n.g)if(n.g.F+3e3<t.F)oe(n),se(n);else break t;Ue(n),K(18)}}else n.za=d[1],0<n.za-n.T&&37500>d[2]&&n.F&&n.v==0&&!n.C&&(n.C=Ot(D(n.Za,n),6e3));if(1>=Tn(n.h)&&n.ca){try{n.ca()}catch{}n.ca=void 0}}else yt(n,11)}else if((t.K||n.g==t)&&oe(n),!z(e))for(d=n.Da.g.parse(e),e=0;e<d.length;e++){let S=d[e];if(n.T=S[0],S=S[1],n.G==2)if(S[0]=="c"){n.K=S[1],n.ia=S[2];const V=S[3];V!=null&&(n.la=V,n.j.info("VER="+n.la));const $=S[4];$!=null&&(n.Aa=$,n.j.info("SVER="+n.Aa));const At=S[5];At!=null&&typeof At=="number"&&0<At&&(r=1.5*At,n.L=r,n.j.info("backChannelRequestTimeoutMs_="+r)),r=n;const J=t.g;if(J){const he=J.g?J.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(he){var y=r.h;y.g||he.indexOf("spdy")==-1&&he.indexOf("quic")==-1&&he.indexOf("h2")==-1||(y.j=y.l,y.g=new Set,y.h&&(xe(y,y.h),y.h=null))}if(r.D){const je=J.g?J.g.getResponseHeader("X-HTTP-Session-Id"):null;je&&(r.ya=je,O(r.I,r.D,je))}}n.G=3,n.l&&n.l.ua(),n.ba&&(n.R=Date.now()-t.F,n.j.info("Handshake RTT: "+n.R+"ms")),r=n;var T=t;if(r.qa=Wn(r,r.J?r.ia:null,r.W),T.K){wn(r.h,T);var C=T,F=r.L;F&&(C.I=F),C.B&&(ke(C),Jt(C)),r.g=T}else Vn(r);0<n.i.length&&re(n)}else S[0]!="stop"&&S[0]!="close"||yt(n,7);else n.G==3&&(S[0]=="stop"||S[0]=="close"?S[0]=="stop"?yt(n,7):Be(n):S[0]!="noop"&&n.l&&n.l.ta(S),n.v=0)}}Pt(4)}catch{}}var ts=class{constructor(t,e){this.g=t,this.map=e}};function _n(t){this.l=t||10,E.PerformanceNavigationTiming?(t=E.performance.getEntriesByType("navigation"),t=0<t.length&&(t[0].nextHopProtocol=="hq"||t[0].nextHopProtocol=="h2")):t=!!(E.chrome&&E.chrome.loadTimes&&E.chrome.loadTimes()&&E.chrome.loadTimes().wasFetchedViaSpdy),this.j=t?this.l:1,this.g=null,1<this.j&&(this.g=new Set),this.h=null,this.i=[]}function En(t){return t.h?!0:t.g?t.g.size>=t.j:!1}function Tn(t){return t.h?1:t.g?t.g.size:0}function Le(t,e){return t.h?t.h==e:t.g?t.g.has(e):!1}function xe(t,e){t.g?t.g.add(e):t.h=e}function wn(t,e){t.h&&t.h==e?t.h=null:t.g&&t.g.has(e)&&t.g.delete(e)}_n.prototype.cancel=function(){if(this.i=An(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const t of this.g.values())t.cancel();this.g.clear()}};function An(t){if(t.h!=null)return t.i.concat(t.h.D);if(t.g!=null&&t.g.size!==0){let e=t.i;for(const n of t.g.values())e=e.concat(n.D);return e}return N(t.i)}function es(t){if(t.V&&typeof t.V=="function")return t.V();if(typeof Map<"u"&&t instanceof Map||typeof Set<"u"&&t instanceof Set)return Array.from(t.values());if(typeof t=="string")return t.split("");if(w(t)){for(var e=[],n=t.length,r=0;r<n;r++)e.push(t[r]);return e}e=[],n=0;for(r in t)e[n++]=t[r];return e}function ns(t){if(t.na&&typeof t.na=="function")return t.na();if(!t.V||typeof t.V!="function"){if(typeof Map<"u"&&t instanceof Map)return Array.from(t.keys());if(!(typeof Set<"u"&&t instanceof Set)){if(w(t)||typeof t=="string"){var e=[];t=t.length;for(var n=0;n<t;n++)e.push(n);return e}e=[],n=0;for(const r in t)e[n++]=r;return e}}}function In(t,e){if(t.forEach&&typeof t.forEach=="function")t.forEach(e,void 0);else if(w(t)||typeof t=="string")Array.prototype.forEach.call(t,e,void 0);else for(var n=ns(t),r=es(t),d=r.length,y=0;y<d;y++)e.call(void 0,r[y],n&&n[y],t)}var Rn=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function is(t,e){if(t){t=t.split("&");for(var n=0;n<t.length;n++){var r=t[n].indexOf("="),d=null;if(0<=r){var y=t[n].substring(0,r);d=t[n].substring(r+1)}else y=t[n];e(y,d?decodeURIComponent(d.replace(/\+/g," ")):"")}}}function mt(t){if(this.g=this.o=this.j="",this.s=null,this.m=this.l="",this.h=!1,t instanceof mt){this.h=t.h,Qt(this,t.j),this.o=t.o,this.g=t.g,Zt(this,t.s),this.l=t.l;var e=t.i,n=new Mt;n.i=e.i,e.g&&(n.g=new Map(e.g),n.h=e.h),bn(this,n),this.m=t.m}else t&&(e=String(t).match(Rn))?(this.h=!1,Qt(this,e[1]||"",!0),this.o=Lt(e[2]||""),this.g=Lt(e[3]||"",!0),Zt(this,e[4]),this.l=Lt(e[5]||"",!0),bn(this,e[6]||"",!0),this.m=Lt(e[7]||"")):(this.h=!1,this.i=new Mt(null,this.h))}mt.prototype.toString=function(){var t=[],e=this.j;e&&t.push(xt(e,Sn,!0),":");var n=this.g;return(n||e=="file")&&(t.push("//"),(e=this.o)&&t.push(xt(e,Sn,!0),"@"),t.push(encodeURIComponent(String(n)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),n=this.s,n!=null&&t.push(":",String(n))),(n=this.l)&&(this.g&&n.charAt(0)!="/"&&t.push("/"),t.push(xt(n,n.charAt(0)=="/"?os:rs,!0))),(n=this.i.toString())&&t.push("?",n),(n=this.m)&&t.push("#",xt(n,as)),t.join("")};function ot(t){return new mt(t)}function Qt(t,e,n){t.j=n?Lt(e,!0):e,t.j&&(t.j=t.j.replace(/:$/,""))}function Zt(t,e){if(e){if(e=Number(e),isNaN(e)||0>e)throw Error("Bad port number "+e);t.s=e}else t.s=null}function bn(t,e,n){e instanceof Mt?(t.i=e,ls(t.i,t.h)):(n||(e=xt(e,hs)),t.i=new Mt(e,t.h))}function O(t,e,n){t.i.set(e,n)}function te(t){return O(t,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36)),t}function Lt(t,e){return t?e?decodeURI(t.replace(/%25/g,"%2525")):decodeURIComponent(t):""}function xt(t,e,n){return typeof t=="string"?(t=encodeURI(t).replace(e,ss),n&&(t=t.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),t):null}function ss(t){return t=t.charCodeAt(0),"%"+(t>>4&15).toString(16)+(t&15).toString(16)}var Sn=/[#\/\?@]/g,rs=/[#\?:]/g,os=/[#\?]/g,hs=/[#\?@]/g,as=/#/g;function Mt(t,e){this.h=this.g=null,this.i=t||null,this.j=!!e}function ct(t){t.g||(t.g=new Map,t.h=0,t.i&&is(t.i,function(e,n){t.add(decodeURIComponent(e.replace(/\+/g," ")),n)}))}s=Mt.prototype,s.add=function(t,e){ct(this),this.i=null,t=Tt(this,t);var n=this.g.get(t);return n||this.g.set(t,n=[]),n.push(e),this.h+=1,this};function Dn(t,e){ct(t),e=Tt(t,e),t.g.has(e)&&(t.i=null,t.h-=t.g.get(e).length,t.g.delete(e))}function Cn(t,e){return ct(t),e=Tt(t,e),t.g.has(e)}s.forEach=function(t,e){ct(this),this.g.forEach(function(n,r){n.forEach(function(d){t.call(e,d,r,this)},this)},this)},s.na=function(){ct(this);const t=Array.from(this.g.values()),e=Array.from(this.g.keys()),n=[];for(let r=0;r<e.length;r++){const d=t[r];for(let y=0;y<d.length;y++)n.push(e[r])}return n},s.V=function(t){ct(this);let e=[];if(typeof t=="string")Cn(this,t)&&(e=e.concat(this.g.get(Tt(this,t))));else{t=Array.from(this.g.values());for(let n=0;n<t.length;n++)e=e.concat(t[n])}return e},s.set=function(t,e){return ct(this),this.i=null,t=Tt(this,t),Cn(this,t)&&(this.h-=this.g.get(t).length),this.g.set(t,[e]),this.h+=1,this},s.get=function(t,e){return t?(t=this.V(t),0<t.length?String(t[0]):e):e};function Pn(t,e,n){Dn(t,e),0<n.length&&(t.i=null,t.g.set(Tt(t,e),N(n)),t.h+=n.length)}s.toString=function(){if(this.i)return this.i;if(!this.g)return"";const t=[],e=Array.from(this.g.keys());for(var n=0;n<e.length;n++){var r=e[n];const y=encodeURIComponent(String(r)),T=this.V(r);for(r=0;r<T.length;r++){var d=y;T[r]!==""&&(d+="="+encodeURIComponent(String(T[r]))),t.push(d)}}return this.i=t.join("&")};function Tt(t,e){return e=String(e),t.j&&(e=e.toLowerCase()),e}function ls(t,e){e&&!t.j&&(ct(t),t.i=null,t.g.forEach(function(n,r){var d=r.toLowerCase();r!=d&&(Dn(this,r),Pn(this,d,n))},t)),t.j=e}function us(t,e){const n=new kt;if(E.Image){const r=new Image;r.onload=U(ft,n,"TestLoadImage: loaded",!0,e,r),r.onerror=U(ft,n,"TestLoadImage: error",!1,e,r),r.onabort=U(ft,n,"TestLoadImage: abort",!1,e,r),r.ontimeout=U(ft,n,"TestLoadImage: timeout",!1,e,r),E.setTimeout(function(){r.ontimeout&&r.ontimeout()},1e4),r.src=t}else e(!1)}function cs(t,e){const n=new kt,r=new AbortController,d=setTimeout(()=>{r.abort(),ft(n,"TestPingServer: timeout",!1,e)},1e4);fetch(t,{signal:r.signal}).then(y=>{clearTimeout(d),y.ok?ft(n,"TestPingServer: ok",!0,e):ft(n,"TestPingServer: server error",!1,e)}).catch(()=>{clearTimeout(d),ft(n,"TestPingServer: error",!1,e)})}function ft(t,e,n,r,d){try{d&&(d.onload=null,d.onerror=null,d.onabort=null,d.ontimeout=null),r(n)}catch{}}function fs(){this.g=new Xi}function ps(t,e,n){const r=n||"";try{In(t,function(d,y){let T=d;A(d)&&(T=Ae(d)),e.push(r+y+"="+encodeURIComponent(T))})}catch(d){throw e.push(r+"type="+encodeURIComponent("_badmap")),d}}function ee(t){this.l=t.Ub||null,this.j=t.eb||!1}I(ee,Ie),ee.prototype.g=function(){return new ne(this.l,this.j)},ee.prototype.i=function(t){return function(){return t}}({});function ne(t,e){H.call(this),this.D=t,this.o=e,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.u=new Headers,this.h=null,this.B="GET",this.A="",this.g=!1,this.v=this.j=this.l=null}I(ne,H),s=ne.prototype,s.open=function(t,e){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.B=t,this.A=e,this.readyState=1,Ut(this)},s.send=function(t){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");this.g=!0;const e={headers:this.u,method:this.B,credentials:this.m,cache:void 0};t&&(e.body=t),(this.D||E).fetch(new Request(this.A,e)).then(this.Sa.bind(this),this.ga.bind(this))},s.abort=function(){this.response=this.responseText="",this.u=new Headers,this.status=0,this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),1<=this.readyState&&this.g&&this.readyState!=4&&(this.g=!1,Bt(this)),this.readyState=0},s.Sa=function(t){if(this.g&&(this.l=t,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=t.headers,this.readyState=2,Ut(this)),this.g&&(this.readyState=3,Ut(this),this.g)))if(this.responseType==="arraybuffer")t.arrayBuffer().then(this.Qa.bind(this),this.ga.bind(this));else if(typeof E.ReadableStream<"u"&&"body"in t){if(this.j=t.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.v=new TextDecoder;On(this)}else t.text().then(this.Ra.bind(this),this.ga.bind(this))};function On(t){t.j.read().then(t.Pa.bind(t)).catch(t.ga.bind(t))}s.Pa=function(t){if(this.g){if(this.o&&t.value)this.response.push(t.value);else if(!this.o){var e=t.value?t.value:new Uint8Array(0);(e=this.v.decode(e,{stream:!t.done}))&&(this.response=this.responseText+=e)}t.done?Bt(this):Ut(this),this.readyState==3&&On(this)}},s.Ra=function(t){this.g&&(this.response=this.responseText=t,Bt(this))},s.Qa=function(t){this.g&&(this.response=t,Bt(this))},s.ga=function(){this.g&&Bt(this)};function Bt(t){t.readyState=4,t.l=null,t.j=null,t.v=null,Ut(t)}s.setRequestHeader=function(t,e){this.u.append(t,e)},s.getResponseHeader=function(t){return this.h&&this.h.get(t.toLowerCase())||""},s.getAllResponseHeaders=function(){if(!this.h)return"";const t=[],e=this.h.entries();for(var n=e.next();!n.done;)n=n.value,t.push(n[0]+": "+n[1]),n=e.next();return t.join(`\r
`)};function Ut(t){t.onreadystatechange&&t.onreadystatechange.call(t)}Object.defineProperty(ne.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(t){this.m=t?"include":"same-origin"}});function kn(t){let e="";return X(t,function(n,r){e+=r,e+=":",e+=n,e+=`\r
`}),e}function Me(t,e,n){t:{for(r in n){var r=!1;break t}r=!0}r||(n=kn(n),typeof t=="string"?n!=null&&encodeURIComponent(String(n)):O(t,e,n))}function L(t){H.call(this),this.headers=new Map,this.o=t||null,this.h=!1,this.v=this.g=null,this.D="",this.m=0,this.l="",this.j=this.B=this.u=this.A=!1,this.I=null,this.H="",this.J=!1}I(L,H);var gs=/^https?$/i,ds=["POST","PUT"];s=L.prototype,s.Ha=function(t){this.J=t},s.ea=function(t,e,n,r){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+t);e=e?e.toUpperCase():"GET",this.D=t,this.l="",this.m=0,this.A=!1,this.h=!0,this.g=this.o?this.o.g():Ce.g(),this.v=this.o?ln(this.o):ln(Ce),this.g.onreadystatechange=D(this.Ea,this);try{this.B=!0,this.g.open(e,String(t),!0),this.B=!1}catch(y){Nn(this,y);return}if(t=n||"",n=new Map(this.headers),r)if(Object.getPrototypeOf(r)===Object.prototype)for(var d in r)n.set(d,r[d]);else if(typeof r.keys=="function"&&typeof r.get=="function")for(const y of r.keys())n.set(y,r.get(y));else throw Error("Unknown input type for opt_headers: "+String(r));r=Array.from(n.keys()).find(y=>y.toLowerCase()=="content-type"),d=E.FormData&&t instanceof E.FormData,!(0<=Array.prototype.indexOf.call(ds,e,void 0))||r||d||n.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[y,T]of n)this.g.setRequestHeader(y,T);this.H&&(this.g.responseType=this.H),"withCredentials"in this.g&&this.g.withCredentials!==this.J&&(this.g.withCredentials=this.J);try{Mn(this),this.u=!0,this.g.send(t),this.u=!1}catch(y){Nn(this,y)}};function Nn(t,e){t.h=!1,t.g&&(t.j=!0,t.g.abort(),t.j=!1),t.l=e,t.m=5,Ln(t),ie(t)}function Ln(t){t.A||(t.A=!0,G(t,"complete"),G(t,"error"))}s.abort=function(t){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.m=t||7,G(this,"complete"),G(this,"abort"),ie(this))},s.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),ie(this,!0)),L.aa.N.call(this)},s.Ea=function(){this.s||(this.B||this.u||this.j?xn(this):this.bb())},s.bb=function(){xn(this)};function xn(t){if(t.h&&typeof _<"u"&&(!t.v[1]||ht(t)!=4||t.Z()!=2)){if(t.u&&ht(t)==4)rn(t.Ea,0,t);else if(G(t,"readystatechange"),ht(t)==4){t.h=!1;try{const T=t.Z();t:switch(T){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var e=!0;break t;default:e=!1}var n;if(!(n=e)){var r;if(r=T===0){var d=String(t.D).match(Rn)[1]||null;!d&&E.self&&E.self.location&&(d=E.self.location.protocol.slice(0,-1)),r=!gs.test(d?d.toLowerCase():"")}n=r}if(n)G(t,"complete"),G(t,"success");else{t.m=6;try{var y=2<ht(t)?t.g.statusText:""}catch{y=""}t.l=y+" ["+t.Z()+"]",Ln(t)}}finally{ie(t)}}}}function ie(t,e){if(t.g){Mn(t);const n=t.g,r=t.v[0]?()=>{}:null;t.g=null,t.v=null,e||G(t,"ready");try{n.onreadystatechange=r}catch{}}}function Mn(t){t.I&&(E.clearTimeout(t.I),t.I=null)}s.isActive=function(){return!!this.g};function ht(t){return t.g?t.g.readyState:0}s.Z=function(){try{return 2<ht(this)?this.g.status:-1}catch{return-1}},s.oa=function(){try{return this.g?this.g.responseText:""}catch{return""}},s.Oa=function(t){if(this.g){var e=this.g.responseText;return t&&e.indexOf(t)==0&&(e=e.substring(t.length)),Ki(e)}};function Bn(t){try{if(!t.g)return null;if("response"in t.g)return t.g.response;switch(t.H){case"":case"text":return t.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in t.g)return t.g.mozResponseArrayBuffer}return null}catch{return null}}function ms(t){const e={};t=(t.g&&2<=ht(t)&&t.g.getAllResponseHeaders()||"").split(`\r
`);for(let r=0;r<t.length;r++){if(z(t[r]))continue;var n=f(t[r]);const d=n[0];if(n=n[1],typeof n!="string")continue;n=n.trim();const y=e[d]||[];e[d]=y,y.push(n)}g(e,function(r){return r.join(", ")})}s.Ba=function(){return this.m},s.Ka=function(){return typeof this.l=="string"?this.l:String(this.l)};function Ft(t,e,n){return n&&n.internalChannelParams&&n.internalChannelParams[t]||e}function Un(t){this.Aa=0,this.i=[],this.j=new kt,this.ia=this.qa=this.I=this.W=this.g=this.ya=this.D=this.H=this.m=this.S=this.o=null,this.Ya=this.U=0,this.Va=Ft("failFast",!1,t),this.F=this.C=this.u=this.s=this.l=null,this.X=!0,this.za=this.T=-1,this.Y=this.v=this.B=0,this.Ta=Ft("baseRetryDelayMs",5e3,t),this.cb=Ft("retryDelaySeedMs",1e4,t),this.Wa=Ft("forwardChannelMaxRetries",2,t),this.wa=Ft("forwardChannelRequestTimeoutMs",2e4,t),this.pa=t&&t.xmlHttpFactory||void 0,this.Xa=t&&t.Tb||void 0,this.Ca=t&&t.useFetchStreams||!1,this.L=void 0,this.J=t&&t.supportsCrossDomainXhr||!1,this.K="",this.h=new _n(t&&t.concurrentRequestLimit),this.Da=new fs,this.P=t&&t.fastHandshake||!1,this.O=t&&t.encodeInitMessageHeaders||!1,this.P&&this.O&&(this.O=!1),this.Ua=t&&t.Rb||!1,t&&t.xa&&this.j.xa(),t&&t.forceLongPolling&&(this.X=!1),this.ba=!this.P&&this.X&&t&&t.detectBufferingProxy||!1,this.ja=void 0,t&&t.longPollingTimeout&&0<t.longPollingTimeout&&(this.ja=t.longPollingTimeout),this.ca=void 0,this.R=0,this.M=!1,this.ka=this.A=null}s=Un.prototype,s.la=8,s.G=1,s.connect=function(t,e,n,r){K(0),this.W=t,this.H=e||{},n&&r!==void 0&&(this.H.OSID=n,this.H.OAID=r),this.F=this.X,this.I=Wn(this,null,this.W),re(this)};function Be(t){if(Fn(t),t.G==3){var e=t.U++,n=ot(t.I);if(O(n,"SID",t.K),O(n,"RID",e),O(n,"TYPE","terminate"),jt(t,n),e=new ut(t,t.j,e),e.L=2,e.v=te(ot(n)),n=!1,E.navigator&&E.navigator.sendBeacon)try{n=E.navigator.sendBeacon(e.v.toString(),"")}catch{}!n&&E.Image&&(new Image().src=e.v,n=!0),n||(e.g=zn(e.j,null),e.g.ea(e.v)),e.F=Date.now(),Jt(e)}Xn(t)}function se(t){t.g&&(Fe(t),t.g.cancel(),t.g=null)}function Fn(t){se(t),t.u&&(E.clearTimeout(t.u),t.u=null),oe(t),t.h.cancel(),t.s&&(typeof t.s=="number"&&E.clearTimeout(t.s),t.s=null)}function re(t){if(!En(t.h)&&!t.s){t.s=!0;var e=t.Ga;Rt||Ze(),bt||(Rt(),bt=!0),de.add(e,t),t.B=0}}function ys(t,e){return Tn(t.h)>=t.h.j-(t.s?1:0)?!1:t.s?(t.i=e.D.concat(t.i),!0):t.G==1||t.G==2||t.B>=(t.Va?0:t.Wa)?!1:(t.s=Ot(D(t.Ga,t,e),Kn(t,t.B)),t.B++,!0)}s.Ga=function(t){if(this.s)if(this.s=null,this.G==1){if(!t){this.U=Math.floor(1e5*Math.random()),t=this.U++;const d=new ut(this,this.j,t);let y=this.o;if(this.S&&(y?(y=h(y),c(y,this.S)):y=this.S),this.m!==null||this.O||(d.H=y,y=null),this.P)t:{for(var e=0,n=0;n<this.i.length;n++){e:{var r=this.i[n];if("__data__"in r.map&&(r=r.map.__data__,typeof r=="string")){r=r.length;break e}r=void 0}if(r===void 0)break;if(e+=r,4096<e){e=n;break t}if(e===4096||n===this.i.length-1){e=n+1;break t}}e=1e3}else e=1e3;e=Hn(this,d,e),n=ot(this.I),O(n,"RID",t),O(n,"CVER",22),this.D&&O(n,"X-HTTP-Session-Id",this.D),jt(this,n),y&&(this.O?e="headers="+encodeURIComponent(String(kn(y)))+"&"+e:this.m&&Me(n,this.m,y)),xe(this.h,d),this.Ua&&O(n,"TYPE","init"),this.P?(O(n,"$req",e),O(n,"SID","null"),d.T=!0,Oe(d,n,null)):Oe(d,n,e),this.G=2}}else this.G==3&&(t?jn(this,t):this.i.length==0||En(this.h)||jn(this))};function jn(t,e){var n;e?n=e.l:n=t.U++;const r=ot(t.I);O(r,"SID",t.K),O(r,"RID",n),O(r,"AID",t.T),jt(t,r),t.m&&t.o&&Me(r,t.m,t.o),n=new ut(t,t.j,n,t.B+1),t.m===null&&(n.H=t.o),e&&(t.i=e.D.concat(t.i)),e=Hn(t,n,1e3),n.I=Math.round(.5*t.wa)+Math.round(.5*t.wa*Math.random()),xe(t.h,n),Oe(n,r,e)}function jt(t,e){t.H&&X(t.H,function(n,r){O(e,r,n)}),t.l&&In({},function(n,r){O(e,r,n)})}function Hn(t,e,n){n=Math.min(t.i.length,n);var r=t.l?D(t.l.Na,t.l,t):null;t:{var d=t.i;let y=-1;for(;;){const T=["count="+n];y==-1?0<n?(y=d[0].g,T.push("ofs="+y)):y=0:T.push("ofs="+y);let C=!0;for(let F=0;F<n;F++){let S=d[F].g;const V=d[F].map;if(S-=y,0>S)y=Math.max(0,d[F].g-100),C=!1;else try{ps(V,T,"req"+S+"_")}catch{r&&r(V)}}if(C){r=T.join("&");break t}}}return t=t.i.splice(0,n),e.D=t,r}function Vn(t){if(!t.g&&!t.u){t.Y=1;var e=t.Fa;Rt||Ze(),bt||(Rt(),bt=!0),de.add(e,t),t.v=0}}function Ue(t){return t.g||t.u||3<=t.v?!1:(t.Y++,t.u=Ot(D(t.Fa,t),Kn(t,t.v)),t.v++,!0)}s.Fa=function(){if(this.u=null,$n(this),this.ba&&!(this.M||this.g==null||0>=this.R)){var t=2*this.R;this.j.info("BP detection timer enabled: "+t),this.A=Ot(D(this.ab,this),t)}},s.ab=function(){this.A&&(this.A=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.M=!0,K(10),se(this),$n(this))};function Fe(t){t.A!=null&&(E.clearTimeout(t.A),t.A=null)}function $n(t){t.g=new ut(t,t.j,"rpc",t.Y),t.m===null&&(t.g.H=t.o),t.g.O=0;var e=ot(t.qa);O(e,"RID","rpc"),O(e,"SID",t.K),O(e,"AID",t.T),O(e,"CI",t.F?"0":"1"),!t.F&&t.ja&&O(e,"TO",t.ja),O(e,"TYPE","xmlhttp"),jt(t,e),t.m&&t.o&&Me(e,t.m,t.o),t.L&&(t.g.I=t.L);var n=t.g;t=t.ia,n.L=1,n.v=te(ot(e)),n.m=null,n.P=!0,mn(n,t)}s.Za=function(){this.C!=null&&(this.C=null,se(this),Ue(this),K(19))};function oe(t){t.C!=null&&(E.clearTimeout(t.C),t.C=null)}function Gn(t,e){var n=null;if(t.g==e){oe(t),Fe(t),t.g=null;var r=2}else if(Le(t.h,e))n=e.D,wn(t.h,e),r=1;else return;if(t.G!=0){if(e.o)if(r==1){n=e.m?e.m.length:0,e=Date.now()-e.F;var d=t.B;r=Se(),G(r,new pn(r,n)),re(t)}else Vn(t);else if(d=e.s,d==3||d==0&&0<e.X||!(r==1&&ys(t,e)||r==2&&Ue(t)))switch(n&&0<n.length&&(e=t.h,e.i=e.i.concat(n)),d){case 1:yt(t,5);break;case 4:yt(t,10);break;case 3:yt(t,6);break;default:yt(t,2)}}}function Kn(t,e){let n=t.Ta+Math.floor(Math.random()*t.cb);return t.isActive()||(n*=2),n*e}function yt(t,e){if(t.j.info("Error code "+e),e==2){var n=D(t.fb,t),r=t.Xa;const d=!r;r=new mt(r||"//www.google.com/images/cleardot.gif"),E.location&&E.location.protocol=="http"||Qt(r,"https"),te(r),d?us(r.toString(),n):cs(r.toString(),n)}else K(2);t.G=0,t.l&&t.l.sa(e),Xn(t),Fn(t)}s.fb=function(t){t?(this.j.info("Successfully pinged google.com"),K(2)):(this.j.info("Failed to ping google.com"),K(1))};function Xn(t){if(t.G=0,t.ka=[],t.l){const e=An(t.h);(e.length!=0||t.i.length!=0)&&(b(t.ka,e),b(t.ka,t.i),t.h.i.length=0,N(t.i),t.i.length=0),t.l.ra()}}function Wn(t,e,n){var r=n instanceof mt?ot(n):new mt(n);if(r.g!="")e&&(r.g=e+"."+r.g),Zt(r,r.s);else{var d=E.location;r=d.protocol,e=e?e+"."+d.hostname:d.hostname,d=+d.port;var y=new mt(null);r&&Qt(y,r),e&&(y.g=e),d&&Zt(y,d),n&&(y.l=n),r=y}return n=t.D,e=t.ya,n&&e&&O(r,n,e),O(r,"VER",t.la),jt(t,r),r}function zn(t,e,n){if(e&&!t.J)throw Error("Can't create secondary domain capable XhrIo object.");return e=t.Ca&&!t.pa?new L(new ee({eb:n})):new L(t.pa),e.Ha(t.J),e}s.isActive=function(){return!!this.l&&this.l.isActive(this)};function qn(){}s=qn.prototype,s.ua=function(){},s.ta=function(){},s.sa=function(){},s.ra=function(){},s.isActive=function(){return!0},s.Na=function(){};function q(t,e){H.call(this),this.g=new Un(e),this.l=t,this.h=e&&e.messageUrlParams||null,t=e&&e.messageHeaders||null,e&&e.clientProtocolHeaderRequired&&(t?t["X-Client-Protocol"]="webchannel":t={"X-Client-Protocol":"webchannel"}),this.g.o=t,t=e&&e.initMessageHeaders||null,e&&e.messageContentType&&(t?t["X-WebChannel-Content-Type"]=e.messageContentType:t={"X-WebChannel-Content-Type":e.messageContentType}),e&&e.va&&(t?t["X-WebChannel-Client-Profile"]=e.va:t={"X-WebChannel-Client-Profile":e.va}),this.g.S=t,(t=e&&e.Sb)&&!z(t)&&(this.g.m=t),this.v=e&&e.supportsCrossDomainXhr||!1,this.u=e&&e.sendRawJson||!1,(e=e&&e.httpSessionIdParam)&&!z(e)&&(this.g.D=e,t=this.h,t!==null&&e in t&&(t=this.h,e in t&&delete t[e])),this.j=new wt(this)}I(q,H),q.prototype.m=function(){this.g.l=this.j,this.v&&(this.g.J=!0),this.g.connect(this.l,this.h||void 0)},q.prototype.close=function(){Be(this.g)},q.prototype.o=function(t){var e=this.g;if(typeof t=="string"){var n={};n.__data__=t,t=n}else this.u&&(n={},n.__data__=Ae(t),t=n);e.i.push(new ts(e.Ya++,t)),e.G==3&&re(e)},q.prototype.N=function(){this.g.l=null,delete this.j,Be(this.g),delete this.g,q.aa.N.call(this)};function Yn(t){Re.call(this),t.__headers__&&(this.headers=t.__headers__,this.statusCode=t.__status__,delete t.__headers__,delete t.__status__);var e=t.__sm__;if(e){t:{for(const n in e){t=n;break t}t=void 0}(this.i=t)&&(t=this.i,e=e!==null&&t in e?e[t]:void 0),this.data=e}else this.data=t}I(Yn,Re);function Jn(){be.call(this),this.status=1}I(Jn,be);function wt(t){this.g=t}I(wt,qn),wt.prototype.ua=function(){G(this.g,"a")},wt.prototype.ta=function(t){G(this.g,new Yn(t))},wt.prototype.sa=function(t){G(this.g,new Jn)},wt.prototype.ra=function(){G(this.g,"b")},q.prototype.send=q.prototype.o,q.prototype.open=q.prototype.m,q.prototype.close=q.prototype.close,De.NO_ERROR=0,De.TIMEOUT=8,De.HTTP_ERROR=6,Qi.COMPLETE="complete",Wi.EventType=Ct,Ct.OPEN="a",Ct.CLOSE="b",Ct.ERROR="c",Ct.MESSAGE="d",H.prototype.listen=H.prototype.K,L.prototype.listenOnce=L.prototype.L,L.prototype.getLastError=L.prototype.Ka,L.prototype.getLastErrorCode=L.prototype.Ba,L.prototype.getStatus=L.prototype.Z,L.prototype.getResponseJson=L.prototype.Oa,L.prototype.getResponseText=L.prototype.oa,L.prototype.send=L.prototype.ea,L.prototype.setWithCredentials=L.prototype.Ha}).apply(typeof le<"u"?le:typeof self<"u"?self:typeof window<"u"?window:{});const pi="@firebase/firestore";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class W{constructor(i){this.uid=i}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(i){return i.uid===this.uid}}W.UNAUTHENTICATED=new W(null),W.GOOGLE_CREDENTIALS=new W("google-credentials-uid"),W.FIRST_PARTY=new W("first-party-uid"),W.MOCK_USER=new W("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ge="10.14.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fe=new Ai("@firebase/firestore");function et(s,...i){if(fe.logLevel<=P.DEBUG){const o=i.map(Ni);fe.debug(`Firestore (${ge}): ${s}`,...o)}}function ki(s,...i){if(fe.logLevel<=P.ERROR){const o=i.map(Ni);fe.error(`Firestore (${ge}): ${s}`,...o)}}function Ni(s){if(typeof s=="string")return s;try{/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/return function(o){return JSON.stringify(o)}(s)}catch{return s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Li(s="Unexpected state"){const i=`FIRESTORE (${ge}) INTERNAL ASSERTION FAILED: `+s;throw ki(i),new Error(i)}function Ht(s,i){s||Li()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Q={CANCELLED:"cancelled",INVALID_ARGUMENT:"invalid-argument",FAILED_PRECONDITION:"failed-precondition"};class Z extends vt{constructor(i,o){super(i,o),this.code=i,this.message=o,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vt{constructor(){this.promise=new Promise((i,o)=>{this.resolve=i,this.reject=o})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ro{constructor(i,o){this.user=o,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${i}`)}}class oo{getToken(){return Promise.resolve(null)}invalidateToken(){}start(i,o){i.enqueueRetryable(()=>o(W.UNAUTHENTICATED))}shutdown(){}}class ho{constructor(i){this.t=i,this.currentUser=W.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(i,o){Ht(this.o===void 0);let u=this.i;const p=w=>this.i!==u?(u=this.i,o(w)):Promise.resolve();let v=new Vt;this.o=()=>{this.i++,this.currentUser=this.u(),v.resolve(),v=new Vt,i.enqueueRetryable(()=>p(this.currentUser))};const _=()=>{const w=v;i.enqueueRetryable(async()=>{await w.promise,await p(this.currentUser)})},E=w=>{et("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=w,this.o&&(this.auth.addAuthTokenListener(this.o),_())};this.t.onInit(w=>E(w)),setTimeout(()=>{if(!this.auth){const w=this.t.getImmediate({optional:!0});w?E(w):(et("FirebaseAuthCredentialsProvider","Auth not yet detected"),v.resolve(),v=new Vt)}},0),_()}getToken(){const i=this.i,o=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(o).then(u=>this.i!==i?(et("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):u?(Ht(typeof u.accessToken=="string"),new ro(u.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const i=this.auth&&this.auth.getUid();return Ht(i===null||typeof i=="string"),new W(i)}}class ao{constructor(i,o,u){this.l=i,this.h=o,this.P=u,this.type="FirstParty",this.user=W.FIRST_PARTY,this.I=new Map}T(){return this.P?this.P():null}get headers(){this.I.set("X-Goog-AuthUser",this.l);const i=this.T();return i&&this.I.set("Authorization",i),this.h&&this.I.set("X-Goog-Iam-Authorization-Token",this.h),this.I}}class lo{constructor(i,o,u){this.l=i,this.h=o,this.P=u}getToken(){return Promise.resolve(new ao(this.l,this.h,this.P))}start(i,o){i.enqueueRetryable(()=>o(W.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class uo{constructor(i){this.value=i,this.type="AppCheck",this.headers=new Map,i&&i.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class co{constructor(i){this.A=i,this.forceRefresh=!1,this.appCheck=null,this.R=null}start(i,o){Ht(this.o===void 0);const u=v=>{v.error!=null&&et("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${v.error.message}`);const _=v.token!==this.R;return this.R=v.token,et("FirebaseAppCheckTokenProvider",`Received ${_?"new":"existing"} token.`),_?o(v.token):Promise.resolve()};this.o=v=>{i.enqueueRetryable(()=>u(v))};const p=v=>{et("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=v,this.o&&this.appCheck.addTokenListener(this.o)};this.A.onInit(v=>p(v)),setTimeout(()=>{if(!this.appCheck){const v=this.A.getImmediate({optional:!0});v?p(v):et("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){const i=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(i).then(o=>o?(Ht(typeof o.token=="string"),this.R=o.token,new uo(o.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}function fo(s){return s.name==="IndexedDbTransactionError"}class pe{constructor(i,o){this.projectId=i,this.database=o||"(default)"}static empty(){return new pe("","")}get isDefaultDatabase(){return this.database==="(default)"}isEqual(i){return i instanceof pe&&i.projectId===this.projectId&&i.database===this.database}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var gi,R;(R=gi||(gi={}))[R.OK=0]="OK",R[R.CANCELLED=1]="CANCELLED",R[R.UNKNOWN=2]="UNKNOWN",R[R.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",R[R.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",R[R.NOT_FOUND=5]="NOT_FOUND",R[R.ALREADY_EXISTS=6]="ALREADY_EXISTS",R[R.PERMISSION_DENIED=7]="PERMISSION_DENIED",R[R.UNAUTHENTICATED=16]="UNAUTHENTICATED",R[R.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",R[R.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",R[R.ABORTED=10]="ABORTED",R[R.OUT_OF_RANGE=11]="OUT_OF_RANGE",R[R.UNIMPLEMENTED=12]="UNIMPLEMENTED",R[R.INTERNAL=13]="INTERNAL",R[R.UNAVAILABLE=14]="UNAVAILABLE",R[R.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */new Oi([4294967295,4294967295],0);function Xe(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class po{constructor(i,o,u=1e3,p=1.5,v=6e4){this.ui=i,this.timerId=o,this.ko=u,this.qo=p,this.Qo=v,this.Ko=0,this.$o=null,this.Uo=Date.now(),this.reset()}reset(){this.Ko=0}Wo(){this.Ko=this.Qo}Go(i){this.cancel();const o=Math.floor(this.Ko+this.zo()),u=Math.max(0,Date.now()-this.Uo),p=Math.max(0,o-u);p>0&&et("ExponentialBackoff",`Backing off for ${p} ms (base delay: ${this.Ko} ms, delay with jitter: ${o} ms, last attempt: ${u} ms ago)`),this.$o=this.ui.enqueueAfterDelay(this.timerId,p,()=>(this.Uo=Date.now(),i())),this.Ko*=this.qo,this.Ko<this.ko&&(this.Ko=this.ko),this.Ko>this.Qo&&(this.Ko=this.Qo)}jo(){this.$o!==null&&(this.$o.skipDelay(),this.$o=null)}cancel(){this.$o!==null&&(this.$o.cancel(),this.$o=null)}zo(){return(Math.random()-.5)*this.Ko}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qe{constructor(i,o,u,p,v){this.asyncQueue=i,this.timerId=o,this.targetTimeMs=u,this.op=p,this.removalCallback=v,this.deferred=new Vt,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(_=>{})}get promise(){return this.deferred.promise}static createAndSchedule(i,o,u,p,v){const _=Date.now()+u,E=new Qe(i,o,_,p,v);return E.start(u),E}start(i){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),i)}skipDelay(){return this.handleDelayElapsed()}cancel(i){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new Z(Q.CANCELLED,"Operation cancelled"+(i?": "+i:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(i=>this.deferred.resolve(i))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}var di,mi;(mi=di||(di={})).ea="default",mi.Cache="cache";/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function go(s){const i={};return s.timeoutSeconds!==void 0&&(i.timeoutSeconds=s.timeoutSeconds),i}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yi=new Map;function mo(s,i,o,u){if(i===!0&&u===!0)throw new Z(Q.INVALID_ARGUMENT,`${s} and ${o} cannot be used together.`)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vi{constructor(i){var o,u;if(i.host===void 0){if(i.ssl!==void 0)throw new Z(Q.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host="firestore.googleapis.com",this.ssl=!0}else this.host=i.host,this.ssl=(o=i.ssl)===null||o===void 0||o;if(this.credentials=i.credentials,this.ignoreUndefinedProperties=!!i.ignoreUndefinedProperties,this.localCache=i.localCache,i.cacheSizeBytes===void 0)this.cacheSizeBytes=41943040;else{if(i.cacheSizeBytes!==-1&&i.cacheSizeBytes<1048576)throw new Z(Q.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=i.cacheSizeBytes}mo("experimentalForceLongPolling",i.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",i.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!i.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:i.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!i.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=go((u=i.experimentalLongPollingOptions)!==null&&u!==void 0?u:{}),function(v){if(v.timeoutSeconds!==void 0){if(isNaN(v.timeoutSeconds))throw new Z(Q.INVALID_ARGUMENT,`invalid long polling timeout: ${v.timeoutSeconds} (must not be NaN)`);if(v.timeoutSeconds<5)throw new Z(Q.INVALID_ARGUMENT,`invalid long polling timeout: ${v.timeoutSeconds} (minimum allowed value is 5)`);if(v.timeoutSeconds>30)throw new Z(Q.INVALID_ARGUMENT,`invalid long polling timeout: ${v.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!i.useFetchStreams}isEqual(i){return this.host===i.host&&this.ssl===i.ssl&&this.credentials===i.credentials&&this.cacheSizeBytes===i.cacheSizeBytes&&this.experimentalForceLongPolling===i.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===i.experimentalAutoDetectLongPolling&&function(u,p){return u.timeoutSeconds===p.timeoutSeconds}(this.experimentalLongPollingOptions,i.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===i.ignoreUndefinedProperties&&this.useFetchStreams===i.useFetchStreams}}class yo{constructor(i,o,u,p){this._authCredentials=i,this._appCheckCredentials=o,this._databaseId=u,this._app=p,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new vi({}),this._settingsFrozen=!1,this._terminateTask="notTerminated"}get app(){if(!this._app)throw new Z(Q.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(i){if(this._settingsFrozen)throw new Z(Q.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new vi(i),i.credentials!==void 0&&(this._authCredentials=function(u){if(!u)return new oo;switch(u.type){case"firstParty":return new lo(u.sessionIndex||"0",u.iamToken||null,u.authTokenFactory||null);case"provider":return u.client;default:throw new Z(Q.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(i.credentials))}_getSettings(){return this._settings}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(o){const u=yi.get(o);u&&(et("ComponentProvider","Removing Datastore"),yi.delete(o),u.terminate())}(this),Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _i{constructor(i=Promise.resolve()){this.Pu=[],this.Iu=!1,this.Tu=[],this.Eu=null,this.du=!1,this.Au=!1,this.Ru=[],this.t_=new po(this,"async_queue_retry"),this.Vu=()=>{const u=Xe();u&&et("AsyncQueue","Visibility state changed to "+u.visibilityState),this.t_.jo()},this.mu=i;const o=Xe();o&&typeof o.addEventListener=="function"&&o.addEventListener("visibilitychange",this.Vu)}get isShuttingDown(){return this.Iu}enqueueAndForget(i){this.enqueue(i)}enqueueAndForgetEvenWhileRestricted(i){this.fu(),this.gu(i)}enterRestrictedMode(i){if(!this.Iu){this.Iu=!0,this.Au=i||!1;const o=Xe();o&&typeof o.removeEventListener=="function"&&o.removeEventListener("visibilitychange",this.Vu)}}enqueue(i){if(this.fu(),this.Iu)return new Promise(()=>{});const o=new Vt;return this.gu(()=>this.Iu&&this.Au?Promise.resolve():(i().then(o.resolve,o.reject),o.promise)).then(()=>o.promise)}enqueueRetryable(i){this.enqueueAndForget(()=>(this.Pu.push(i),this.pu()))}async pu(){if(this.Pu.length!==0){try{await this.Pu[0](),this.Pu.shift(),this.t_.reset()}catch(i){if(!fo(i))throw i;et("AsyncQueue","Operation failed with retryable error: "+i)}this.Pu.length>0&&this.t_.Go(()=>this.pu())}}gu(i){const o=this.mu.then(()=>(this.du=!0,i().catch(u=>{this.Eu=u,this.du=!1;const p=function(_){let E=_.message||"";return _.stack&&(E=_.stack.includes(_.message)?_.stack:_.message+`
`+_.stack),E}(u);throw ki("INTERNAL UNHANDLED ERROR: ",p),u}).then(u=>(this.du=!1,u))));return this.mu=o,o}enqueueAfterDelay(i,o,u){this.fu(),this.Ru.indexOf(i)>-1&&(o=0);const p=Qe.createAndSchedule(this,i,o,u,v=>this.yu(v));return this.Tu.push(p),p}fu(){this.Eu&&Li()}verifyOperationInProgress(){}async wu(){let i;do i=this.mu,await i;while(i!==this.mu)}Su(i){for(const o of this.Tu)if(o.timerId===i)return!0;return!1}bu(i){return this.wu().then(()=>{this.Tu.sort((o,u)=>o.targetTimeMs-u.targetTimeMs);for(const o of this.Tu)if(o.skipDelay(),i!=="all"&&o.timerId===i)break;return this.wu()})}Du(i){this.Ru.push(i)}yu(i){const o=this.Tu.indexOf(i);this.Tu.splice(o,1)}}class vo extends yo{constructor(i,o,u,p){super(i,o,u,p),this.type="firestore",this._queue=new _i,this._persistenceKey=p?.name||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const i=this._firestoreClient.terminate();this._queue=new _i(i),this._firestoreClient=void 0,await i}}}(function(i,o=!0){(function(p){ge=p})(bi),Gt(new $t("firestore",(u,{instanceIdentifier:p,options:v})=>{const _=u.getProvider("app").getImmediate(),E=new vo(new ho(u.getProvider("auth-internal")),new co(u.getProvider("app-check-internal")),function(A,B){if(!Object.prototype.hasOwnProperty.apply(A.options,["projectId"]))throw new Z(Q.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new pe(A.options.projectId,B)}(_,p),_);return v=Object.assign({useFetchStreams:o},v),E._setSettings(v),E},"PUBLIC").setMultipleInstances(!0)),gt(pi,"4.7.3",i),gt(pi,"4.7.3","esm2017")})();
