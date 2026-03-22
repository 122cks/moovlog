var Zn={};/**
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
 */const wi=function(s){const n=[];let o=0;for(let l=0;l<s.length;l++){let c=s.charCodeAt(l);c<128?n[o++]=c:c<2048?(n[o++]=c>>6|192,n[o++]=c&63|128):(c&64512)===55296&&l+1<s.length&&(s.charCodeAt(l+1)&64512)===56320?(c=65536+((c&1023)<<10)+(s.charCodeAt(++l)&1023),n[o++]=c>>18|240,n[o++]=c>>12&63|128,n[o++]=c>>6&63|128,n[o++]=c&63|128):(n[o++]=c>>12|224,n[o++]=c>>6&63|128,n[o++]=c&63|128)}return n},Ts=function(s){const n=[];let o=0,l=0;for(;o<s.length;){const c=s[o++];if(c<128)n[l++]=String.fromCharCode(c);else if(c>191&&c<224){const v=s[o++];n[l++]=String.fromCharCode((c&31)<<6|v&63)}else if(c>239&&c<365){const v=s[o++],_=s[o++],E=s[o++],w=((c&7)<<18|(v&63)<<12|(_&63)<<6|E&63)-65536;n[l++]=String.fromCharCode(55296+(w>>10)),n[l++]=String.fromCharCode(56320+(w&1023))}else{const v=s[o++],_=s[o++];n[l++]=String.fromCharCode((c&15)<<12|(v&63)<<6|_&63)}}return n.join("")},Ai={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(s,n){if(!Array.isArray(s))throw Error("encodeByteArray takes an array as a parameter");this.init_();const o=n?this.byteToCharMapWebSafe_:this.byteToCharMap_,l=[];for(let c=0;c<s.length;c+=3){const v=s[c],_=c+1<s.length,E=_?s[c+1]:0,w=c+2<s.length,A=w?s[c+2]:0,B=v>>2,k=(v&3)<<4|E>>4;let D=(E&15)<<2|A>>6,U=A&63;w||(U=64,_||(D=64)),l.push(o[B],o[k],o[D],o[U])}return l.join("")},encodeString(s,n){return this.HAS_NATIVE_SUPPORT&&!n?btoa(s):this.encodeByteArray(wi(s),n)},decodeString(s,n){return this.HAS_NATIVE_SUPPORT&&!n?atob(s):Ts(this.decodeStringToByteArray(s,n))},decodeStringToByteArray(s,n){this.init_();const o=n?this.charToByteMapWebSafe_:this.charToByteMap_,l=[];for(let c=0;c<s.length;){const v=o[s.charAt(c++)],E=c<s.length?o[s.charAt(c)]:0;++c;const A=c<s.length?o[s.charAt(c)]:64;++c;const k=c<s.length?o[s.charAt(c)]:64;if(++c,v==null||E==null||A==null||k==null)throw new ws;const D=v<<2|E>>4;if(l.push(D),A!==64){const U=E<<4&240|A>>2;if(l.push(U),k!==64){const b=A<<6&192|k;l.push(b)}}}return l},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let s=0;s<this.ENCODED_VALS.length;s++)this.byteToCharMap_[s]=this.ENCODED_VALS.charAt(s),this.charToByteMap_[this.byteToCharMap_[s]]=s,this.byteToCharMapWebSafe_[s]=this.ENCODED_VALS_WEBSAFE.charAt(s),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[s]]=s,s>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(s)]=s,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(s)]=s)}}};class ws extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const As=function(s){const n=wi(s);return Ai.encodeByteArray(n,!0)},bi=function(s){return As(s).replace(/\./g,"")},bs=function(s){try{return Ai.decodeString(s,!0)}catch(n){console.error("base64Decode failed: ",n)}return null};/**
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
 */function Is(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const Rs=()=>Is().__FIREBASE_DEFAULTS__,Ss=()=>{if(typeof process>"u"||typeof Zn>"u")return;const s=Zn.__FIREBASE_DEFAULTS__;if(s)return JSON.parse(s)},Ds=()=>{if(typeof document>"u")return;let s;try{s=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const n=s&&bs(s[1]);return n&&JSON.parse(n)},Cs=()=>{try{return Rs()||Ss()||Ds()}catch(s){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${s}`);return}},Po=s=>{var n;return(n=Cs())===null||n===void 0?void 0:n[`_${s}`]};/**
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
 */function Ps(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Oo(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(Ps())}function ko(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function No(){const s=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof s=="object"&&s.id!==void 0}function Lo(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Os(){try{return typeof indexedDB=="object"}catch{return!1}}function ks(){return new Promise((s,n)=>{try{let o=!0;const l="validate-browser-context-for-indexeddb-analytics-module",c=self.indexedDB.open(l);c.onsuccess=()=>{c.result.close(),o||self.indexedDB.deleteDatabase(l),s(!0)},c.onupgradeneeded=()=>{o=!1},c.onerror=()=>{var v;n(((v=c.error)===null||v===void 0?void 0:v.message)||"")}}catch(o){n(o)}})}/**
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
 */const Ns="FirebaseError";class vt extends Error{constructor(n,o,l){super(o),this.code=n,this.customData=l,this.name=Ns,Object.setPrototypeOf(this,vt.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Ii.prototype.create)}}class Ii{constructor(n,o,l){this.service=n,this.serviceName=o,this.errors=l}create(n,...o){const l=o[0]||{},c=`${this.service}/${n}`,v=this.errors[n],_=v?Ls(v,l):"Error",E=`${this.serviceName}: ${_} (${c}).`;return new vt(c,E,l)}}function Ls(s,n){return s.replace(xs,(o,l)=>{const c=n[l];return c!=null?String(c):`<${l}?>`})}const xs=/\{\$([^}]+)}/g;/**
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
 */function xo(s){const n=[];for(const[o,l]of Object.entries(s))Array.isArray(l)?l.forEach(c=>{n.push(encodeURIComponent(o)+"="+encodeURIComponent(c))}):n.push(encodeURIComponent(o)+"="+encodeURIComponent(l));return n.length?"&"+n.join("&"):""}function Mo(s,n){const o=new Ms(s,n);return o.subscribe.bind(o)}class Ms{constructor(n,o){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=o,this.task.then(()=>{n(this)}).catch(l=>{this.error(l)})}next(n){this.forEachObserver(o=>{o.next(n)})}error(n){this.forEachObserver(o=>{o.error(n)}),this.close(n)}complete(){this.forEachObserver(n=>{n.complete()}),this.close()}subscribe(n,o,l){let c;if(n===void 0&&o===void 0&&l===void 0)throw new Error("Missing Observer.");Bs(n,["next","error","complete"])?c=n:c={next:n,error:o,complete:l},c.next===void 0&&(c.next=He),c.error===void 0&&(c.error=He),c.complete===void 0&&(c.complete=He);const v=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?c.error(this.finalError):c.complete()}catch{}}),this.observers.push(c),v}unsubscribeOne(n){this.observers===void 0||this.observers[n]===void 0||(delete this.observers[n],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(n){if(!this.finalized)for(let o=0;o<this.observers.length;o++)this.sendOne(o,n)}sendOne(n,o){this.task.then(()=>{if(this.observers!==void 0&&this.observers[n]!==void 0)try{o(this.observers[n])}catch(l){typeof console<"u"&&console.error&&console.error(l)}})}close(n){this.finalized||(this.finalized=!0,n!==void 0&&(this.finalError=n),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Bs(s,n){if(typeof s!="object"||s===null)return!1;for(const o of n)if(o in s&&typeof s[o]=="function")return!0;return!1}function He(){}/**
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
 */function Bo(s){return s&&s._delegate?s._delegate:s}class Vt{constructor(n,o,l){this.name=n,this.instanceFactory=o,this.type=l,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(n){return this.instantiationMode=n,this}setMultipleInstances(n){return this.multipleInstances=n,this}setServiceProps(n){return this.serviceProps=n,this}setInstanceCreatedCallback(n){return this.onInstanceCreated=n,this}}/**
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
 */var P;(function(s){s[s.DEBUG=0]="DEBUG",s[s.VERBOSE=1]="VERBOSE",s[s.INFO=2]="INFO",s[s.WARN=3]="WARN",s[s.ERROR=4]="ERROR",s[s.SILENT=5]="SILENT"})(P||(P={}));const Us={debug:P.DEBUG,verbose:P.VERBOSE,info:P.INFO,warn:P.WARN,error:P.ERROR,silent:P.SILENT},Fs=P.INFO,js={[P.DEBUG]:"log",[P.VERBOSE]:"log",[P.INFO]:"info",[P.WARN]:"warn",[P.ERROR]:"error"},Hs=(s,n,...o)=>{if(n<s.logLevel)return;const l=new Date().toISOString(),c=js[n];if(c)console[c](`[${l}]  ${s.name}:`,...o);else throw new Error(`Attempted to log a message with an invalid logType (value: ${n})`)};class Ri{constructor(n){this.name=n,this._logLevel=Fs,this._logHandler=Hs,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(n){if(!(n in P))throw new TypeError(`Invalid value "${n}" assigned to \`logLevel\``);this._logLevel=n}setLogLevel(n){this._logLevel=typeof n=="string"?Us[n]:n}get logHandler(){return this._logHandler}set logHandler(n){if(typeof n!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=n}get userLogHandler(){return this._userLogHandler}set userLogHandler(n){this._userLogHandler=n}debug(...n){this._userLogHandler&&this._userLogHandler(this,P.DEBUG,...n),this._logHandler(this,P.DEBUG,...n)}log(...n){this._userLogHandler&&this._userLogHandler(this,P.VERBOSE,...n),this._logHandler(this,P.VERBOSE,...n)}info(...n){this._userLogHandler&&this._userLogHandler(this,P.INFO,...n),this._logHandler(this,P.INFO,...n)}warn(...n){this._userLogHandler&&this._userLogHandler(this,P.WARN,...n),this._logHandler(this,P.WARN,...n)}error(...n){this._userLogHandler&&this._userLogHandler(this,P.ERROR,...n),this._logHandler(this,P.ERROR,...n)}}const $s=(s,n)=>n.some(o=>s instanceof o);let ti,ei;function Vs(){return ti||(ti=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Gs(){return ei||(ei=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Si=new WeakMap,We=new WeakMap,Di=new WeakMap,$e=new WeakMap,Je=new WeakMap;function Ks(s){const n=new Promise((o,l)=>{const c=()=>{s.removeEventListener("success",v),s.removeEventListener("error",_)},v=()=>{o(pt(s.result)),c()},_=()=>{l(s.error),c()};s.addEventListener("success",v),s.addEventListener("error",_)});return n.then(o=>{o instanceof IDBCursor&&Si.set(o,s)}).catch(()=>{}),Je.set(n,s),n}function Xs(s){if(We.has(s))return;const n=new Promise((o,l)=>{const c=()=>{s.removeEventListener("complete",v),s.removeEventListener("error",_),s.removeEventListener("abort",_)},v=()=>{o(),c()},_=()=>{l(s.error||new DOMException("AbortError","AbortError")),c()};s.addEventListener("complete",v),s.addEventListener("error",_),s.addEventListener("abort",_)});We.set(s,n)}let qe={get(s,n,o){if(s instanceof IDBTransaction){if(n==="done")return We.get(s);if(n==="objectStoreNames")return s.objectStoreNames||Di.get(s);if(n==="store")return o.objectStoreNames[1]?void 0:o.objectStore(o.objectStoreNames[0])}return pt(s[n])},set(s,n,o){return s[n]=o,!0},has(s,n){return s instanceof IDBTransaction&&(n==="done"||n==="store")?!0:n in s}};function zs(s){qe=s(qe)}function Ws(s){return s===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(n,...o){const l=s.call(Ve(this),n,...o);return Di.set(l,n.sort?n.sort():[n]),pt(l)}:Gs().includes(s)?function(...n){return s.apply(Ve(this),n),pt(Si.get(this))}:function(...n){return pt(s.apply(Ve(this),n))}}function qs(s){return typeof s=="function"?Ws(s):(s instanceof IDBTransaction&&Xs(s),$s(s,Vs())?new Proxy(s,qe):s)}function pt(s){if(s instanceof IDBRequest)return Ks(s);if($e.has(s))return $e.get(s);const n=qs(s);return n!==s&&($e.set(s,n),Je.set(n,s)),n}const Ve=s=>Je.get(s);function Ys(s,n,{blocked:o,upgrade:l,blocking:c,terminated:v}={}){const _=indexedDB.open(s,n),E=pt(_);return l&&_.addEventListener("upgradeneeded",w=>{l(pt(_.result),w.oldVersion,w.newVersion,pt(_.transaction),w)}),o&&_.addEventListener("blocked",w=>o(w.oldVersion,w.newVersion,w)),E.then(w=>{v&&w.addEventListener("close",()=>v()),c&&w.addEventListener("versionchange",A=>c(A.oldVersion,A.newVersion,A))}).catch(()=>{}),E}const Js=["get","getKey","getAll","getAllKeys","count"],Qs=["put","add","delete","clear"],Ge=new Map;function ni(s,n){if(!(s instanceof IDBDatabase&&!(n in s)&&typeof n=="string"))return;if(Ge.get(n))return Ge.get(n);const o=n.replace(/FromIndex$/,""),l=n!==o,c=Qs.includes(o);if(!(o in(l?IDBIndex:IDBObjectStore).prototype)||!(c||Js.includes(o)))return;const v=async function(_,...E){const w=this.transaction(_,c?"readwrite":"readonly");let A=w.store;return l&&(A=A.index(E.shift())),(await Promise.all([A[o](...E),c&&w.done]))[0]};return Ge.set(n,v),v}zs(s=>({...s,get:(n,o,l)=>ni(n,o)||s.get(n,o,l),has:(n,o)=>!!ni(n,o)||s.has(n,o)}));/**
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
 */class Zs{constructor(n){this.container=n}getPlatformInfoString(){return this.container.getProviders().map(o=>{if(tr(o)){const l=o.getImmediate();return`${l.library}/${l.version}`}else return null}).filter(o=>o).join(" ")}}function tr(s){const n=s.getComponent();return n?.type==="VERSION"}const Ye="@firebase/app",ii="0.10.13";/**
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
 */const at=new Ri("@firebase/app"),er="@firebase/app-compat",nr="@firebase/analytics-compat",ir="@firebase/analytics",sr="@firebase/app-check-compat",rr="@firebase/app-check",or="@firebase/auth",hr="@firebase/auth-compat",ar="@firebase/database",lr="@firebase/data-connect",ur="@firebase/database-compat",cr="@firebase/functions",fr="@firebase/functions-compat",pr="@firebase/installations",dr="@firebase/installations-compat",gr="@firebase/messaging",mr="@firebase/messaging-compat",yr="@firebase/performance",vr="@firebase/performance-compat",_r="@firebase/remote-config",Er="@firebase/remote-config-compat",Tr="@firebase/storage",wr="@firebase/storage-compat",Ar="@firebase/firestore",br="@firebase/vertexai-preview",Ir="@firebase/firestore-compat",Rr="firebase",Sr="10.14.1",Dr={[Ye]:"fire-core",[er]:"fire-core-compat",[ir]:"fire-analytics",[nr]:"fire-analytics-compat",[rr]:"fire-app-check",[sr]:"fire-app-check-compat",[or]:"fire-auth",[hr]:"fire-auth-compat",[ar]:"fire-rtdb",[lr]:"fire-data-connect",[ur]:"fire-rtdb-compat",[cr]:"fire-fn",[fr]:"fire-fn-compat",[pr]:"fire-iid",[dr]:"fire-iid-compat",[gr]:"fire-fcm",[mr]:"fire-fcm-compat",[yr]:"fire-perf",[vr]:"fire-perf-compat",[_r]:"fire-rc",[Er]:"fire-rc-compat",[Tr]:"fire-gcs",[wr]:"fire-gcs-compat",[Ar]:"fire-fst",[Ir]:"fire-fst-compat",[br]:"fire-vertex","fire-js":"fire-js",[Rr]:"fire-js-all"};/**
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
 */const Cr=new Map,Pr=new Map,si=new Map;function ri(s,n){try{s.container.addComponent(n)}catch(o){at.debug(`Component ${n.name} failed to register with FirebaseApp ${s.name}`,o)}}function Gt(s){const n=s.name;if(si.has(n))return at.debug(`There were multiple attempts to register component ${n}.`),!1;si.set(n,s);for(const o of Cr.values())ri(o,s);for(const o of Pr.values())ri(o,s);return!0}function Uo(s){return s.settings!==void 0}/**
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
 */const Or={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Qe=new Ii("app","Firebase",Or);/**
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
 */const Ci=Sr;function dt(s,n,o){var l;let c=(l=Dr[s])!==null&&l!==void 0?l:s;o&&(c+=`-${o}`);const v=c.match(/\s|\//),_=n.match(/\s|\//);if(v||_){const E=[`Unable to register library "${c}" with version "${n}":`];v&&E.push(`library name "${c}" contains illegal characters (whitespace or "/")`),v&&_&&E.push("and"),_&&E.push(`version name "${n}" contains illegal characters (whitespace or "/")`),at.warn(E.join(" "));return}Gt(new Vt(`${c}-version`,()=>({library:c,version:n}),"VERSION"))}/**
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
 */const kr="firebase-heartbeat-database",Nr=1,Kt="firebase-heartbeat-store";let Ke=null;function Pi(){return Ke||(Ke=Ys(kr,Nr,{upgrade:(s,n)=>{switch(n){case 0:try{s.createObjectStore(Kt)}catch(o){console.warn(o)}}}}).catch(s=>{throw Qe.create("idb-open",{originalErrorMessage:s.message})})),Ke}async function Lr(s){try{const o=(await Pi()).transaction(Kt),l=await o.objectStore(Kt).get(Oi(s));return await o.done,l}catch(n){if(n instanceof vt)at.warn(n.message);else{const o=Qe.create("idb-get",{originalErrorMessage:n?.message});at.warn(o.message)}}}async function oi(s,n){try{const l=(await Pi()).transaction(Kt,"readwrite");await l.objectStore(Kt).put(n,Oi(s)),await l.done}catch(o){if(o instanceof vt)at.warn(o.message);else{const l=Qe.create("idb-set",{originalErrorMessage:o?.message});at.warn(l.message)}}}function Oi(s){return`${s.name}!${s.options.appId}`}/**
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
 */const xr=1024,Mr=30*24*60*60*1e3;class Br{constructor(n){this.container=n,this._heartbeatsCache=null;const o=this.container.getProvider("app").getImmediate();this._storage=new Fr(o),this._heartbeatsCachePromise=this._storage.read().then(l=>(this._heartbeatsCache=l,l))}async triggerHeartbeat(){var n,o;try{const c=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),v=hi();return((n=this._heartbeatsCache)===null||n===void 0?void 0:n.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((o=this._heartbeatsCache)===null||o===void 0?void 0:o.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===v||this._heartbeatsCache.heartbeats.some(_=>_.date===v)?void 0:(this._heartbeatsCache.heartbeats.push({date:v,agent:c}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(_=>{const E=new Date(_.date).valueOf();return Date.now()-E<=Mr}),this._storage.overwrite(this._heartbeatsCache))}catch(l){at.warn(l)}}async getHeartbeatsHeader(){var n;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((n=this._heartbeatsCache)===null||n===void 0?void 0:n.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const o=hi(),{heartbeatsToSend:l,unsentEntries:c}=Ur(this._heartbeatsCache.heartbeats),v=bi(JSON.stringify({version:2,heartbeats:l}));return this._heartbeatsCache.lastSentHeartbeatDate=o,c.length>0?(this._heartbeatsCache.heartbeats=c,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),v}catch(o){return at.warn(o),""}}}function hi(){return new Date().toISOString().substring(0,10)}function Ur(s,n=xr){const o=[];let l=s.slice();for(const c of s){const v=o.find(_=>_.agent===c.agent);if(v){if(v.dates.push(c.date),ai(o)>n){v.dates.pop();break}}else if(o.push({agent:c.agent,dates:[c.date]}),ai(o)>n){o.pop();break}l=l.slice(1)}return{heartbeatsToSend:o,unsentEntries:l}}class Fr{constructor(n){this.app=n,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Os()?ks().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const o=await Lr(this.app);return o?.heartbeats?o:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(n){var o;if(await this._canUseIndexedDBPromise){const c=await this.read();return oi(this.app,{lastSentHeartbeatDate:(o=n.lastSentHeartbeatDate)!==null&&o!==void 0?o:c.lastSentHeartbeatDate,heartbeats:n.heartbeats})}else return}async add(n){var o;if(await this._canUseIndexedDBPromise){const c=await this.read();return oi(this.app,{lastSentHeartbeatDate:(o=n.lastSentHeartbeatDate)!==null&&o!==void 0?o:c.lastSentHeartbeatDate,heartbeats:[...c.heartbeats,...n.heartbeats]})}else return}}function ai(s){return bi(JSON.stringify({version:2,heartbeats:s})).length}/**
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
 */function jr(s){Gt(new Vt("platform-logger",n=>new Zs(n),"PRIVATE")),Gt(new Vt("heartbeat",n=>new Br(n),"PRIVATE")),dt(Ye,ii,s),dt(Ye,ii,"esm2017"),dt("fire-js","")}jr("");var Hr="firebase",$r="10.14.1";/**
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
 */dt(Hr,$r,"app");/**
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
 */const ki="firebasestorage.googleapis.com",Vr="storageBucket",Gr=2*60*1e3,Kr=10*60*1e3;/**
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
 */class it extends vt{constructor(n,o,l=0){super(Xe(n),`Firebase Storage: ${o} (${Xe(n)})`),this.status_=l,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,it.prototype)}get status(){return this.status_}set status(n){this.status_=n}_codeEquals(n){return Xe(n)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(n){this.customData.serverResponse=n,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var nt;(function(s){s.UNKNOWN="unknown",s.OBJECT_NOT_FOUND="object-not-found",s.BUCKET_NOT_FOUND="bucket-not-found",s.PROJECT_NOT_FOUND="project-not-found",s.QUOTA_EXCEEDED="quota-exceeded",s.UNAUTHENTICATED="unauthenticated",s.UNAUTHORIZED="unauthorized",s.UNAUTHORIZED_APP="unauthorized-app",s.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",s.INVALID_CHECKSUM="invalid-checksum",s.CANCELED="canceled",s.INVALID_EVENT_NAME="invalid-event-name",s.INVALID_URL="invalid-url",s.INVALID_DEFAULT_BUCKET="invalid-default-bucket",s.NO_DEFAULT_BUCKET="no-default-bucket",s.CANNOT_SLICE_BLOB="cannot-slice-blob",s.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",s.NO_DOWNLOAD_URL="no-download-url",s.INVALID_ARGUMENT="invalid-argument",s.INVALID_ARGUMENT_COUNT="invalid-argument-count",s.APP_DELETED="app-deleted",s.INVALID_ROOT_OPERATION="invalid-root-operation",s.INVALID_FORMAT="invalid-format",s.INTERNAL_ERROR="internal-error",s.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(nt||(nt={}));function Xe(s){return"storage/"+s}function Xr(){const s="An unknown error occurred, please check the error payload for server response.";return new it(nt.UNKNOWN,s)}function zr(){return new it(nt.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function Wr(){return new it(nt.CANCELED,"User canceled the upload/download.")}function qr(s){return new it(nt.INVALID_URL,"Invalid URL '"+s+"'.")}function Yr(s){return new it(nt.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+s+"'.")}function li(s){return new it(nt.INVALID_ARGUMENT,s)}function Ni(){return new it(nt.APP_DELETED,"The Firebase app was deleted.")}function Jr(s){return new it(nt.INVALID_ROOT_OPERATION,"The operation '"+s+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}/**
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
 */class tt{constructor(n,o){this.bucket=n,this.path_=o}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const n=encodeURIComponent;return"/b/"+n(this.bucket)+"/o/"+n(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(n,o){let l;try{l=tt.makeFromUrl(n,o)}catch{return new tt(n,"")}if(l.path==="")return l;throw Yr(n)}static makeFromUrl(n,o){let l=null;const c="([A-Za-z0-9.\\-_]+)";function v(x){x.path.charAt(x.path.length-1)==="/"&&(x.path_=x.path_.slice(0,-1))}const _="(/(.*))?$",E=new RegExp("^gs://"+c+_,"i"),w={bucket:1,path:3};function A(x){x.path_=decodeURIComponent(x.path)}const B="v[A-Za-z0-9_]+",k=o.replace(/[.]/g,"\\."),D="(/([^?#]*).*)?$",U=new RegExp(`^https?://${k}/${B}/b/${c}/o${D}`,"i"),b={bucket:1,path:3},N=o===ki?"(?:storage.googleapis.com|storage.cloud.google.com)":o,R="([^?#]*)",Y=new RegExp(`^https?://${N}/${c}/${R}`,"i"),M=[{regex:E,indices:w,postModify:v},{regex:U,indices:b,postModify:A},{regex:Y,indices:{bucket:1,path:2},postModify:A}];for(let x=0;x<M.length;x++){const st=M[x],X=st.regex.exec(n);if(X){const d=X[st.indices.bucket];let h=X[st.indices.path];h||(h=""),l=new tt(d,h),st.postModify(l);break}}if(l==null)throw qr(n);return l}}class Qr{constructor(n){this.promise_=Promise.reject(n)}getPromise(){return this.promise_}cancel(n=!1){}}/**
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
 */function Zr(s,n,o){let l=1,c=null,v=null,_=!1,E=0;function w(){return E===2}let A=!1;function B(...R){A||(A=!0,n.apply(null,R))}function k(R){c=setTimeout(()=>{c=null,s(U,w())},R)}function D(){v&&clearTimeout(v)}function U(R,...Y){if(A){D();return}if(R){D(),B.call(null,R,...Y);return}if(w()||_){D(),B.call(null,R,...Y);return}l<64&&(l*=2);let M;E===1?(E=2,M=0):M=(l+Math.random())*1e3,k(M)}let b=!1;function N(R){b||(b=!0,D(),!A&&(c!==null?(R||(E=2),clearTimeout(c),k(0)):R||(E=1)))}return k(0),v=setTimeout(()=>{_=!0,N(!0)},o),N}function to(s){s(!1)}/**
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
 */function eo(s){return s!==void 0}function ui(s,n,o,l){if(l<n)throw li(`Invalid value for '${s}'. Expected ${n} or greater.`);if(l>o)throw li(`Invalid value for '${s}'. Expected ${o} or less.`)}function no(s){const n=encodeURIComponent;let o="?";for(const l in s)if(s.hasOwnProperty(l)){const c=n(l)+"="+n(s[l]);o=o+c+"&"}return o=o.slice(0,-1),o}var ue;(function(s){s[s.NO_ERROR=0]="NO_ERROR",s[s.NETWORK_ERROR=1]="NETWORK_ERROR",s[s.ABORT=2]="ABORT"})(ue||(ue={}));/**
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
 */function io(s,n){const o=s>=500&&s<600,c=[408,429].indexOf(s)!==-1,v=n.indexOf(s)!==-1;return o||c||v}/**
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
 */class so{constructor(n,o,l,c,v,_,E,w,A,B,k,D=!0){this.url_=n,this.method_=o,this.headers_=l,this.body_=c,this.successCodes_=v,this.additionalRetryCodes_=_,this.callback_=E,this.errorCallback_=w,this.timeout_=A,this.progressCallback_=B,this.connectionFactory_=k,this.retry=D,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((U,b)=>{this.resolve_=U,this.reject_=b,this.start_()})}start_(){const n=(l,c)=>{if(c){l(!1,new ae(!1,null,!0));return}const v=this.connectionFactory_();this.pendingConnection_=v;const _=E=>{const w=E.loaded,A=E.lengthComputable?E.total:-1;this.progressCallback_!==null&&this.progressCallback_(w,A)};this.progressCallback_!==null&&v.addUploadProgressListener(_),v.send(this.url_,this.method_,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&v.removeUploadProgressListener(_),this.pendingConnection_=null;const E=v.getErrorCode()===ue.NO_ERROR,w=v.getStatus();if(!E||io(w,this.additionalRetryCodes_)&&this.retry){const B=v.getErrorCode()===ue.ABORT;l(!1,new ae(!1,null,B));return}const A=this.successCodes_.indexOf(w)!==-1;l(!0,new ae(A,v))})},o=(l,c)=>{const v=this.resolve_,_=this.reject_,E=c.connection;if(c.wasSuccessCode)try{const w=this.callback_(E,E.getResponse());eo(w)?v(w):v()}catch(w){_(w)}else if(E!==null){const w=Xr();w.serverResponse=E.getErrorText(),this.errorCallback_?_(this.errorCallback_(E,w)):_(w)}else if(c.canceled){const w=this.appDelete_?Ni():Wr();_(w)}else{const w=zr();_(w)}};this.canceled_?o(!1,new ae(!1,null,!0)):this.backoffId_=Zr(n,o,this.timeout_)}getPromise(){return this.promise_}cancel(n){this.canceled_=!0,this.appDelete_=n||!1,this.backoffId_!==null&&to(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class ae{constructor(n,o,l){this.wasSuccessCode=n,this.connection=o,this.canceled=!!l}}function ro(s,n){n!==null&&n.length>0&&(s.Authorization="Firebase "+n)}function oo(s,n){s["X-Firebase-Storage-Version"]="webjs/"+(n??"AppManager")}function ho(s,n){n&&(s["X-Firebase-GMPID"]=n)}function ao(s,n){n!==null&&(s["X-Firebase-AppCheck"]=n)}function lo(s,n,o,l,c,v,_=!0){const E=no(s.urlParams),w=s.url+E,A=Object.assign({},s.headers);return ho(A,n),ro(A,o),oo(A,v),ao(A,l),new so(w,s.method,A,s.body,s.successCodes,s.additionalRetryCodes,s.handler,s.errorHandler,s.timeout,s.progressCallback,c,_)}/**
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
 */function uo(s){if(s.length===0)return null;const n=s.lastIndexOf("/");return n===-1?"":s.slice(0,n)}function co(s){const n=s.lastIndexOf("/",s.length-2);return n===-1?s:s.slice(n+1)}/**
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
 */class ce{constructor(n,o){this._service=n,o instanceof tt?this._location=o:this._location=tt.makeFromUrl(o,n.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(n,o){return new ce(n,o)}get root(){const n=new tt(this._location.bucket,"");return this._newRef(this._service,n)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return co(this._location.path)}get storage(){return this._service}get parent(){const n=uo(this._location.path);if(n===null)return null;const o=new tt(this._location.bucket,n);return new ce(this._service,o)}_throwIfRoot(n){if(this._location.path==="")throw Jr(n)}}function ci(s,n){const o=n?.[Vr];return o==null?null:tt.makeFromBucketSpec(o,s)}class fo{constructor(n,o,l,c,v){this.app=n,this._authProvider=o,this._appCheckProvider=l,this._url=c,this._firebaseVersion=v,this._bucket=null,this._host=ki,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=Gr,this._maxUploadRetryTime=Kr,this._requests=new Set,c!=null?this._bucket=tt.makeFromBucketSpec(c,this._host):this._bucket=ci(this._host,this.app.options)}get host(){return this._host}set host(n){this._host=n,this._url!=null?this._bucket=tt.makeFromBucketSpec(this._url,n):this._bucket=ci(n,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(n){ui("time",0,Number.POSITIVE_INFINITY,n),this._maxUploadRetryTime=n}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(n){ui("time",0,Number.POSITIVE_INFINITY,n),this._maxOperationRetryTime=n}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const n=this._authProvider.getImmediate({optional:!0});if(n){const o=await n.getToken();if(o!==null)return o.accessToken}return null}async _getAppCheckToken(){const n=this._appCheckProvider.getImmediate({optional:!0});return n?(await n.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(n=>n.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(n){return new ce(this,n)}_makeRequest(n,o,l,c,v=!0){if(this._deleted)return new Qr(Ni());{const _=lo(n,this._appId,l,c,o,this._firebaseVersion,v);return this._requests.add(_),_.getPromise().then(()=>this._requests.delete(_),()=>this._requests.delete(_)),_}}async makeRequestWithTokens(n,o){const[l,c]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(n,o,l,c).getPromise()}}const fi="@firebase/storage",pi="0.13.2";/**
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
 */const po="storage";function go(s,{instanceIdentifier:n}){const o=s.getProvider("app").getImmediate(),l=s.getProvider("auth-internal"),c=s.getProvider("app-check-internal");return new fo(o,l,c,n,Ci)}function mo(){Gt(new Vt(po,go,"PUBLIC").setMultipleInstances(!0)),dt(fi,pi,""),dt(fi,pi,"esm2017")}mo();var di=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Li;(function(){var s;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function n(d,h){function u(){}u.prototype=h.prototype,d.D=h.prototype,d.prototype=new u,d.prototype.constructor=d,d.C=function(f,p,m){for(var a=Array(arguments.length-2),rt=2;rt<arguments.length;rt++)a[rt-2]=arguments[rt];return h.prototype[p].apply(f,a)}}function o(){this.blockSize=-1}function l(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.B=Array(this.blockSize),this.o=this.h=0,this.s()}n(l,o),l.prototype.s=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function c(d,h,u){u||(u=0);var f=Array(16);if(typeof h=="string")for(var p=0;16>p;++p)f[p]=h.charCodeAt(u++)|h.charCodeAt(u++)<<8|h.charCodeAt(u++)<<16|h.charCodeAt(u++)<<24;else for(p=0;16>p;++p)f[p]=h[u++]|h[u++]<<8|h[u++]<<16|h[u++]<<24;h=d.g[0],u=d.g[1],p=d.g[2];var m=d.g[3],a=h+(m^u&(p^m))+f[0]+3614090360&4294967295;h=u+(a<<7&4294967295|a>>>25),a=m+(p^h&(u^p))+f[1]+3905402710&4294967295,m=h+(a<<12&4294967295|a>>>20),a=p+(u^m&(h^u))+f[2]+606105819&4294967295,p=m+(a<<17&4294967295|a>>>15),a=u+(h^p&(m^h))+f[3]+3250441966&4294967295,u=p+(a<<22&4294967295|a>>>10),a=h+(m^u&(p^m))+f[4]+4118548399&4294967295,h=u+(a<<7&4294967295|a>>>25),a=m+(p^h&(u^p))+f[5]+1200080426&4294967295,m=h+(a<<12&4294967295|a>>>20),a=p+(u^m&(h^u))+f[6]+2821735955&4294967295,p=m+(a<<17&4294967295|a>>>15),a=u+(h^p&(m^h))+f[7]+4249261313&4294967295,u=p+(a<<22&4294967295|a>>>10),a=h+(m^u&(p^m))+f[8]+1770035416&4294967295,h=u+(a<<7&4294967295|a>>>25),a=m+(p^h&(u^p))+f[9]+2336552879&4294967295,m=h+(a<<12&4294967295|a>>>20),a=p+(u^m&(h^u))+f[10]+4294925233&4294967295,p=m+(a<<17&4294967295|a>>>15),a=u+(h^p&(m^h))+f[11]+2304563134&4294967295,u=p+(a<<22&4294967295|a>>>10),a=h+(m^u&(p^m))+f[12]+1804603682&4294967295,h=u+(a<<7&4294967295|a>>>25),a=m+(p^h&(u^p))+f[13]+4254626195&4294967295,m=h+(a<<12&4294967295|a>>>20),a=p+(u^m&(h^u))+f[14]+2792965006&4294967295,p=m+(a<<17&4294967295|a>>>15),a=u+(h^p&(m^h))+f[15]+1236535329&4294967295,u=p+(a<<22&4294967295|a>>>10),a=h+(p^m&(u^p))+f[1]+4129170786&4294967295,h=u+(a<<5&4294967295|a>>>27),a=m+(u^p&(h^u))+f[6]+3225465664&4294967295,m=h+(a<<9&4294967295|a>>>23),a=p+(h^u&(m^h))+f[11]+643717713&4294967295,p=m+(a<<14&4294967295|a>>>18),a=u+(m^h&(p^m))+f[0]+3921069994&4294967295,u=p+(a<<20&4294967295|a>>>12),a=h+(p^m&(u^p))+f[5]+3593408605&4294967295,h=u+(a<<5&4294967295|a>>>27),a=m+(u^p&(h^u))+f[10]+38016083&4294967295,m=h+(a<<9&4294967295|a>>>23),a=p+(h^u&(m^h))+f[15]+3634488961&4294967295,p=m+(a<<14&4294967295|a>>>18),a=u+(m^h&(p^m))+f[4]+3889429448&4294967295,u=p+(a<<20&4294967295|a>>>12),a=h+(p^m&(u^p))+f[9]+568446438&4294967295,h=u+(a<<5&4294967295|a>>>27),a=m+(u^p&(h^u))+f[14]+3275163606&4294967295,m=h+(a<<9&4294967295|a>>>23),a=p+(h^u&(m^h))+f[3]+4107603335&4294967295,p=m+(a<<14&4294967295|a>>>18),a=u+(m^h&(p^m))+f[8]+1163531501&4294967295,u=p+(a<<20&4294967295|a>>>12),a=h+(p^m&(u^p))+f[13]+2850285829&4294967295,h=u+(a<<5&4294967295|a>>>27),a=m+(u^p&(h^u))+f[2]+4243563512&4294967295,m=h+(a<<9&4294967295|a>>>23),a=p+(h^u&(m^h))+f[7]+1735328473&4294967295,p=m+(a<<14&4294967295|a>>>18),a=u+(m^h&(p^m))+f[12]+2368359562&4294967295,u=p+(a<<20&4294967295|a>>>12),a=h+(u^p^m)+f[5]+4294588738&4294967295,h=u+(a<<4&4294967295|a>>>28),a=m+(h^u^p)+f[8]+2272392833&4294967295,m=h+(a<<11&4294967295|a>>>21),a=p+(m^h^u)+f[11]+1839030562&4294967295,p=m+(a<<16&4294967295|a>>>16),a=u+(p^m^h)+f[14]+4259657740&4294967295,u=p+(a<<23&4294967295|a>>>9),a=h+(u^p^m)+f[1]+2763975236&4294967295,h=u+(a<<4&4294967295|a>>>28),a=m+(h^u^p)+f[4]+1272893353&4294967295,m=h+(a<<11&4294967295|a>>>21),a=p+(m^h^u)+f[7]+4139469664&4294967295,p=m+(a<<16&4294967295|a>>>16),a=u+(p^m^h)+f[10]+3200236656&4294967295,u=p+(a<<23&4294967295|a>>>9),a=h+(u^p^m)+f[13]+681279174&4294967295,h=u+(a<<4&4294967295|a>>>28),a=m+(h^u^p)+f[0]+3936430074&4294967295,m=h+(a<<11&4294967295|a>>>21),a=p+(m^h^u)+f[3]+3572445317&4294967295,p=m+(a<<16&4294967295|a>>>16),a=u+(p^m^h)+f[6]+76029189&4294967295,u=p+(a<<23&4294967295|a>>>9),a=h+(u^p^m)+f[9]+3654602809&4294967295,h=u+(a<<4&4294967295|a>>>28),a=m+(h^u^p)+f[12]+3873151461&4294967295,m=h+(a<<11&4294967295|a>>>21),a=p+(m^h^u)+f[15]+530742520&4294967295,p=m+(a<<16&4294967295|a>>>16),a=u+(p^m^h)+f[2]+3299628645&4294967295,u=p+(a<<23&4294967295|a>>>9),a=h+(p^(u|~m))+f[0]+4096336452&4294967295,h=u+(a<<6&4294967295|a>>>26),a=m+(u^(h|~p))+f[7]+1126891415&4294967295,m=h+(a<<10&4294967295|a>>>22),a=p+(h^(m|~u))+f[14]+2878612391&4294967295,p=m+(a<<15&4294967295|a>>>17),a=u+(m^(p|~h))+f[5]+4237533241&4294967295,u=p+(a<<21&4294967295|a>>>11),a=h+(p^(u|~m))+f[12]+1700485571&4294967295,h=u+(a<<6&4294967295|a>>>26),a=m+(u^(h|~p))+f[3]+2399980690&4294967295,m=h+(a<<10&4294967295|a>>>22),a=p+(h^(m|~u))+f[10]+4293915773&4294967295,p=m+(a<<15&4294967295|a>>>17),a=u+(m^(p|~h))+f[1]+2240044497&4294967295,u=p+(a<<21&4294967295|a>>>11),a=h+(p^(u|~m))+f[8]+1873313359&4294967295,h=u+(a<<6&4294967295|a>>>26),a=m+(u^(h|~p))+f[15]+4264355552&4294967295,m=h+(a<<10&4294967295|a>>>22),a=p+(h^(m|~u))+f[6]+2734768916&4294967295,p=m+(a<<15&4294967295|a>>>17),a=u+(m^(p|~h))+f[13]+1309151649&4294967295,u=p+(a<<21&4294967295|a>>>11),a=h+(p^(u|~m))+f[4]+4149444226&4294967295,h=u+(a<<6&4294967295|a>>>26),a=m+(u^(h|~p))+f[11]+3174756917&4294967295,m=h+(a<<10&4294967295|a>>>22),a=p+(h^(m|~u))+f[2]+718787259&4294967295,p=m+(a<<15&4294967295|a>>>17),a=u+(m^(p|~h))+f[9]+3951481745&4294967295,d.g[0]=d.g[0]+h&4294967295,d.g[1]=d.g[1]+(p+(a<<21&4294967295|a>>>11))&4294967295,d.g[2]=d.g[2]+p&4294967295,d.g[3]=d.g[3]+m&4294967295}l.prototype.u=function(d,h){h===void 0&&(h=d.length);for(var u=h-this.blockSize,f=this.B,p=this.h,m=0;m<h;){if(p==0)for(;m<=u;)c(this,d,m),m+=this.blockSize;if(typeof d=="string"){for(;m<h;)if(f[p++]=d.charCodeAt(m++),p==this.blockSize){c(this,f),p=0;break}}else for(;m<h;)if(f[p++]=d[m++],p==this.blockSize){c(this,f),p=0;break}}this.h=p,this.o+=h},l.prototype.v=function(){var d=Array((56>this.h?this.blockSize:2*this.blockSize)-this.h);d[0]=128;for(var h=1;h<d.length-8;++h)d[h]=0;var u=8*this.o;for(h=d.length-8;h<d.length;++h)d[h]=u&255,u/=256;for(this.u(d),d=Array(16),h=u=0;4>h;++h)for(var f=0;32>f;f+=8)d[u++]=this.g[h]>>>f&255;return d};function v(d,h){var u=E;return Object.prototype.hasOwnProperty.call(u,d)?u[d]:u[d]=h(d)}function _(d,h){this.h=h;for(var u=[],f=!0,p=d.length-1;0<=p;p--){var m=d[p]|0;f&&m==h||(u[p]=m,f=!1)}this.g=u}var E={};function w(d){return-128<=d&&128>d?v(d,function(h){return new _([h|0],0>h?-1:0)}):new _([d|0],0>d?-1:0)}function A(d){if(isNaN(d)||!isFinite(d))return k;if(0>d)return R(A(-d));for(var h=[],u=1,f=0;d>=u;f++)h[f]=d/u|0,u*=4294967296;return new _(h,0)}function B(d,h){if(d.length==0)throw Error("number format error: empty string");if(h=h||10,2>h||36<h)throw Error("radix out of range: "+h);if(d.charAt(0)=="-")return R(B(d.substring(1),h));if(0<=d.indexOf("-"))throw Error('number format error: interior "-" character');for(var u=A(Math.pow(h,8)),f=k,p=0;p<d.length;p+=8){var m=Math.min(8,d.length-p),a=parseInt(d.substring(p,p+m),h);8>m?(m=A(Math.pow(h,m)),f=f.j(m).add(A(a))):(f=f.j(u),f=f.add(A(a)))}return f}var k=w(0),D=w(1),U=w(16777216);s=_.prototype,s.m=function(){if(N(this))return-R(this).m();for(var d=0,h=1,u=0;u<this.g.length;u++){var f=this.i(u);d+=(0<=f?f:4294967296+f)*h,h*=4294967296}return d},s.toString=function(d){if(d=d||10,2>d||36<d)throw Error("radix out of range: "+d);if(b(this))return"0";if(N(this))return"-"+R(this).toString(d);for(var h=A(Math.pow(d,6)),u=this,f="";;){var p=x(u,h).g;u=Y(u,p.j(h));var m=((0<u.g.length?u.g[0]:u.h)>>>0).toString(d);if(u=p,b(u))return m+f;for(;6>m.length;)m="0"+m;f=m+f}},s.i=function(d){return 0>d?0:d<this.g.length?this.g[d]:this.h};function b(d){if(d.h!=0)return!1;for(var h=0;h<d.g.length;h++)if(d.g[h]!=0)return!1;return!0}function N(d){return d.h==-1}s.l=function(d){return d=Y(this,d),N(d)?-1:b(d)?0:1};function R(d){for(var h=d.g.length,u=[],f=0;f<h;f++)u[f]=~d.g[f];return new _(u,~d.h).add(D)}s.abs=function(){return N(this)?R(this):this},s.add=function(d){for(var h=Math.max(this.g.length,d.g.length),u=[],f=0,p=0;p<=h;p++){var m=f+(this.i(p)&65535)+(d.i(p)&65535),a=(m>>>16)+(this.i(p)>>>16)+(d.i(p)>>>16);f=a>>>16,m&=65535,a&=65535,u[p]=a<<16|m}return new _(u,u[u.length-1]&-2147483648?-1:0)};function Y(d,h){return d.add(R(h))}s.j=function(d){if(b(this)||b(d))return k;if(N(this))return N(d)?R(this).j(R(d)):R(R(this).j(d));if(N(d))return R(this.j(R(d)));if(0>this.l(U)&&0>d.l(U))return A(this.m()*d.m());for(var h=this.g.length+d.g.length,u=[],f=0;f<2*h;f++)u[f]=0;for(f=0;f<this.g.length;f++)for(var p=0;p<d.g.length;p++){var m=this.i(f)>>>16,a=this.i(f)&65535,rt=d.i(p)>>>16,bt=d.i(p)&65535;u[2*f+2*p]+=a*bt,W(u,2*f+2*p),u[2*f+2*p+1]+=m*bt,W(u,2*f+2*p+1),u[2*f+2*p+1]+=a*rt,W(u,2*f+2*p+1),u[2*f+2*p+2]+=m*rt,W(u,2*f+2*p+2)}for(f=0;f<h;f++)u[f]=u[2*f+1]<<16|u[2*f];for(f=h;f<2*h;f++)u[f]=0;return new _(u,0)};function W(d,h){for(;(d[h]&65535)!=d[h];)d[h+1]+=d[h]>>>16,d[h]&=65535,h++}function M(d,h){this.g=d,this.h=h}function x(d,h){if(b(h))throw Error("division by zero");if(b(d))return new M(k,k);if(N(d))return h=x(R(d),h),new M(R(h.g),R(h.h));if(N(h))return h=x(d,R(h)),new M(R(h.g),h.h);if(30<d.g.length){if(N(d)||N(h))throw Error("slowDivide_ only works with positive integers.");for(var u=D,f=h;0>=f.l(d);)u=st(u),f=st(f);var p=X(u,1),m=X(f,1);for(f=X(f,2),u=X(u,2);!b(f);){var a=m.add(f);0>=a.l(d)&&(p=p.add(u),m=a),f=X(f,1),u=X(u,1)}return h=Y(d,p.j(h)),new M(p,h)}for(p=k;0<=d.l(h);){for(u=Math.max(1,Math.floor(d.m()/h.m())),f=Math.ceil(Math.log(u)/Math.LN2),f=48>=f?1:Math.pow(2,f-48),m=A(u),a=m.j(h);N(a)||0<a.l(d);)u-=f,m=A(u),a=m.j(h);b(m)&&(m=D),p=p.add(m),d=Y(d,a)}return new M(p,d)}s.A=function(d){return x(this,d).h},s.and=function(d){for(var h=Math.max(this.g.length,d.g.length),u=[],f=0;f<h;f++)u[f]=this.i(f)&d.i(f);return new _(u,this.h&d.h)},s.or=function(d){for(var h=Math.max(this.g.length,d.g.length),u=[],f=0;f<h;f++)u[f]=this.i(f)|d.i(f);return new _(u,this.h|d.h)},s.xor=function(d){for(var h=Math.max(this.g.length,d.g.length),u=[],f=0;f<h;f++)u[f]=this.i(f)^d.i(f);return new _(u,this.h^d.h)};function st(d){for(var h=d.g.length+1,u=[],f=0;f<h;f++)u[f]=d.i(f)<<1|d.i(f-1)>>>31;return new _(u,d.h)}function X(d,h){var u=h>>5;h%=32;for(var f=d.g.length-u,p=[],m=0;m<f;m++)p[m]=0<h?d.i(m+u)>>>h|d.i(m+u+1)<<32-h:d.i(m+u);return new _(p,d.h)}l.prototype.digest=l.prototype.v,l.prototype.reset=l.prototype.s,l.prototype.update=l.prototype.u,_.prototype.add=_.prototype.add,_.prototype.multiply=_.prototype.j,_.prototype.modulo=_.prototype.A,_.prototype.compare=_.prototype.l,_.prototype.toNumber=_.prototype.m,_.prototype.toString=_.prototype.toString,_.prototype.getBits=_.prototype.i,_.fromNumber=A,_.fromString=B,Li=_}).apply(typeof di<"u"?di:typeof self<"u"?self:typeof window<"u"?window:{});var le=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};(function(){var s,n=typeof Object.defineProperties=="function"?Object.defineProperty:function(t,e,i){return t==Array.prototype||t==Object.prototype||(t[e]=i.value),t};function o(t){t=[typeof globalThis=="object"&&globalThis,t,typeof window=="object"&&window,typeof self=="object"&&self,typeof le=="object"&&le];for(var e=0;e<t.length;++e){var i=t[e];if(i&&i.Math==Math)return i}throw Error("Cannot find global object")}var l=o(this);function c(t,e){if(e)t:{var i=l;t=t.split(".");for(var r=0;r<t.length-1;r++){var g=t[r];if(!(g in i))break t;i=i[g]}t=t[t.length-1],r=i[t],e=e(r),e!=r&&e!=null&&n(i,t,{configurable:!0,writable:!0,value:e})}}function v(t,e){t instanceof String&&(t+="");var i=0,r=!1,g={next:function(){if(!r&&i<t.length){var y=i++;return{value:e(y,t[y]),done:!1}}return r=!0,{done:!0,value:void 0}}};return g[Symbol.iterator]=function(){return g},g}c("Array.prototype.values",function(t){return t||function(){return v(this,function(e,i){return i})}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var _=_||{},E=this||self;function w(t){var e=typeof t;return e=e!="object"?e:t?Array.isArray(t)?"array":e:"null",e=="array"||e=="object"&&typeof t.length=="number"}function A(t){var e=typeof t;return e=="object"&&t!=null||e=="function"}function B(t,e,i){return t.call.apply(t.bind,arguments)}function k(t,e,i){if(!t)throw Error();if(2<arguments.length){var r=Array.prototype.slice.call(arguments,2);return function(){var g=Array.prototype.slice.call(arguments);return Array.prototype.unshift.apply(g,r),t.apply(e,g)}}return function(){return t.apply(e,arguments)}}function D(t,e,i){return D=Function.prototype.bind&&Function.prototype.bind.toString().indexOf("native code")!=-1?B:k,D.apply(null,arguments)}function U(t,e){var i=Array.prototype.slice.call(arguments,1);return function(){var r=i.slice();return r.push.apply(r,arguments),t.apply(this,r)}}function b(t,e){function i(){}i.prototype=e.prototype,t.aa=e.prototype,t.prototype=new i,t.prototype.constructor=t,t.Qb=function(r,g,y){for(var T=Array(arguments.length-2),C=2;C<arguments.length;C++)T[C-2]=arguments[C];return e.prototype[g].apply(r,T)}}function N(t){const e=t.length;if(0<e){const i=Array(e);for(let r=0;r<e;r++)i[r]=t[r];return i}return[]}function R(t,e){for(let i=1;i<arguments.length;i++){const r=arguments[i];if(w(r)){const g=t.length||0,y=r.length||0;t.length=g+y;for(let T=0;T<y;T++)t[g+T]=r[T]}else t.push(r)}}class Y{constructor(e,i){this.i=e,this.j=i,this.h=0,this.g=null}get(){let e;return 0<this.h?(this.h--,e=this.g,this.g=e.next,e.next=null):e=this.i(),e}}function W(t){return/^[\s\xa0]*$/.test(t)}function M(){var t=E.navigator;return t&&(t=t.userAgent)?t:""}function x(t){return x[" "](t),t}x[" "]=function(){};var st=M().indexOf("Gecko")!=-1&&!(M().toLowerCase().indexOf("webkit")!=-1&&M().indexOf("Edge")==-1)&&!(M().indexOf("Trident")!=-1||M().indexOf("MSIE")!=-1)&&M().indexOf("Edge")==-1;function X(t,e,i){for(const r in t)e.call(i,t[r],r,t)}function d(t,e){for(const i in t)e.call(void 0,t[i],i,t)}function h(t){const e={};for(const i in t)e[i]=t[i];return e}const u="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function f(t,e){let i,r;for(let g=1;g<arguments.length;g++){r=arguments[g];for(i in r)t[i]=r[i];for(let y=0;y<u.length;y++)i=u[y],Object.prototype.hasOwnProperty.call(r,i)&&(t[i]=r[i])}}function p(t){var e=1;t=t.split(":");const i=[];for(;0<e&&t.length;)i.push(t.shift()),e--;return t.length&&i.push(t.join(":")),i}function m(t){E.setTimeout(()=>{throw t},0)}function a(){var t=ge;let e=null;return t.g&&(e=t.g,t.g=t.g.next,t.g||(t.h=null),e.next=null),e}class rt{constructor(){this.h=this.g=null}add(e,i){const r=bt.get();r.set(e,i),this.h?this.h.next=r:this.g=r,this.h=r}}var bt=new Y(()=>new Ui,t=>t.reset());class Ui{constructor(){this.next=this.g=this.h=null}set(e,i){this.h=e,this.g=i,this.next=null}reset(){this.next=this.g=this.h=null}}let It,Rt=!1,ge=new rt,tn=()=>{const t=E.Promise.resolve(void 0);It=()=>{t.then(Fi)}};var Fi=()=>{for(var t;t=a();){try{t.h.call(t.g)}catch(i){m(i)}var e=bt;e.j(t),100>e.h&&(e.h++,t.next=e.g,e.g=t)}Rt=!1};function lt(){this.s=this.s,this.C=this.C}lt.prototype.s=!1,lt.prototype.ma=function(){this.s||(this.s=!0,this.N())},lt.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function j(t,e){this.type=t,this.g=this.target=e,this.defaultPrevented=!1}j.prototype.h=function(){this.defaultPrevented=!0};var ji=function(){if(!E.addEventListener||!Object.defineProperty)return!1;var t=!1,e=Object.defineProperty({},"passive",{get:function(){t=!0}});try{const i=()=>{};E.addEventListener("test",i,e),E.removeEventListener("test",i,e)}catch{}return t}();function St(t,e){if(j.call(this,t?t.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,t){var i=this.type=t.type,r=t.changedTouches&&t.changedTouches.length?t.changedTouches[0]:null;if(this.target=t.target||t.srcElement,this.g=e,e=t.relatedTarget){if(st){t:{try{x(e.nodeName);var g=!0;break t}catch{}g=!1}g||(e=null)}}else i=="mouseover"?e=t.fromElement:i=="mouseout"&&(e=t.toElement);this.relatedTarget=e,r?(this.clientX=r.clientX!==void 0?r.clientX:r.pageX,this.clientY=r.clientY!==void 0?r.clientY:r.pageY,this.screenX=r.screenX||0,this.screenY=r.screenY||0):(this.clientX=t.clientX!==void 0?t.clientX:t.pageX,this.clientY=t.clientY!==void 0?t.clientY:t.pageY,this.screenX=t.screenX||0,this.screenY=t.screenY||0),this.button=t.button,this.key=t.key||"",this.ctrlKey=t.ctrlKey,this.altKey=t.altKey,this.shiftKey=t.shiftKey,this.metaKey=t.metaKey,this.pointerId=t.pointerId||0,this.pointerType=typeof t.pointerType=="string"?t.pointerType:Hi[t.pointerType]||"",this.state=t.state,this.i=t,t.defaultPrevented&&St.aa.h.call(this)}}b(St,j);var Hi={2:"touch",3:"pen",4:"mouse"};St.prototype.h=function(){St.aa.h.call(this);var t=this.i;t.preventDefault?t.preventDefault():t.returnValue=!1};var Xt="closure_listenable_"+(1e6*Math.random()|0),$i=0;function Vi(t,e,i,r,g){this.listener=t,this.proxy=null,this.src=e,this.type=i,this.capture=!!r,this.ha=g,this.key=++$i,this.da=this.fa=!1}function zt(t){t.da=!0,t.listener=null,t.proxy=null,t.src=null,t.ha=null}function Wt(t){this.src=t,this.g={},this.h=0}Wt.prototype.add=function(t,e,i,r,g){var y=t.toString();t=this.g[y],t||(t=this.g[y]=[],this.h++);var T=ye(t,e,r,g);return-1<T?(e=t[T],i||(e.fa=!1)):(e=new Vi(e,this.src,y,!!r,g),e.fa=i,t.push(e)),e};function me(t,e){var i=e.type;if(i in t.g){var r=t.g[i],g=Array.prototype.indexOf.call(r,e,void 0),y;(y=0<=g)&&Array.prototype.splice.call(r,g,1),y&&(zt(e),t.g[i].length==0&&(delete t.g[i],t.h--))}}function ye(t,e,i,r){for(var g=0;g<t.length;++g){var y=t[g];if(!y.da&&y.listener==e&&y.capture==!!i&&y.ha==r)return g}return-1}var ve="closure_lm_"+(1e6*Math.random()|0),_e={};function en(t,e,i,r,g){if(Array.isArray(e)){for(var y=0;y<e.length;y++)en(t,e[y],i,r,g);return null}return i=rn(i),t&&t[Xt]?t.K(e,i,A(r)?!!r.capture:!1,g):Gi(t,e,i,!1,r,g)}function Gi(t,e,i,r,g,y){if(!e)throw Error("Invalid event type");var T=A(g)?!!g.capture:!!g,C=Te(t);if(C||(t[ve]=C=new Wt(t)),i=C.add(e,i,r,T,y),i.proxy)return i;if(r=Ki(),i.proxy=r,r.src=t,r.listener=i,t.addEventListener)ji||(g=T),g===void 0&&(g=!1),t.addEventListener(e.toString(),r,g);else if(t.attachEvent)t.attachEvent(sn(e.toString()),r);else if(t.addListener&&t.removeListener)t.addListener(r);else throw Error("addEventListener and attachEvent are unavailable.");return i}function Ki(){function t(i){return e.call(t.src,t.listener,i)}const e=Xi;return t}function nn(t,e,i,r,g){if(Array.isArray(e))for(var y=0;y<e.length;y++)nn(t,e[y],i,r,g);else r=A(r)?!!r.capture:!!r,i=rn(i),t&&t[Xt]?(t=t.i,e=String(e).toString(),e in t.g&&(y=t.g[e],i=ye(y,i,r,g),-1<i&&(zt(y[i]),Array.prototype.splice.call(y,i,1),y.length==0&&(delete t.g[e],t.h--)))):t&&(t=Te(t))&&(e=t.g[e.toString()],t=-1,e&&(t=ye(e,i,r,g)),(i=-1<t?e[t]:null)&&Ee(i))}function Ee(t){if(typeof t!="number"&&t&&!t.da){var e=t.src;if(e&&e[Xt])me(e.i,t);else{var i=t.type,r=t.proxy;e.removeEventListener?e.removeEventListener(i,r,t.capture):e.detachEvent?e.detachEvent(sn(i),r):e.addListener&&e.removeListener&&e.removeListener(r),(i=Te(e))?(me(i,t),i.h==0&&(i.src=null,e[ve]=null)):zt(t)}}}function sn(t){return t in _e?_e[t]:_e[t]="on"+t}function Xi(t,e){if(t.da)t=!0;else{e=new St(e,this);var i=t.listener,r=t.ha||t.src;t.fa&&Ee(t),t=i.call(r,e)}return t}function Te(t){return t=t[ve],t instanceof Wt?t:null}var we="__closure_events_fn_"+(1e9*Math.random()>>>0);function rn(t){return typeof t=="function"?t:(t[we]||(t[we]=function(e){return t.handleEvent(e)}),t[we])}function H(){lt.call(this),this.i=new Wt(this),this.M=this,this.F=null}b(H,lt),H.prototype[Xt]=!0,H.prototype.removeEventListener=function(t,e,i,r){nn(this,t,e,i,r)};function G(t,e){var i,r=t.F;if(r)for(i=[];r;r=r.F)i.push(r);if(t=t.M,r=e.type||e,typeof e=="string")e=new j(e,t);else if(e instanceof j)e.target=e.target||t;else{var g=e;e=new j(r,t),f(e,g)}if(g=!0,i)for(var y=i.length-1;0<=y;y--){var T=e.g=i[y];g=qt(T,r,!0,e)&&g}if(T=e.g=t,g=qt(T,r,!0,e)&&g,g=qt(T,r,!1,e)&&g,i)for(y=0;y<i.length;y++)T=e.g=i[y],g=qt(T,r,!1,e)&&g}H.prototype.N=function(){if(H.aa.N.call(this),this.i){var t=this.i,e;for(e in t.g){for(var i=t.g[e],r=0;r<i.length;r++)zt(i[r]);delete t.g[e],t.h--}}this.F=null},H.prototype.K=function(t,e,i,r){return this.i.add(String(t),e,!1,i,r)},H.prototype.L=function(t,e,i,r){return this.i.add(String(t),e,!0,i,r)};function qt(t,e,i,r){if(e=t.i.g[String(e)],!e)return!0;e=e.concat();for(var g=!0,y=0;y<e.length;++y){var T=e[y];if(T&&!T.da&&T.capture==i){var C=T.listener,F=T.ha||T.src;T.fa&&me(t.i,T),g=C.call(F,r)!==!1&&g}}return g&&!r.defaultPrevented}function on(t,e,i){if(typeof t=="function")i&&(t=D(t,i));else if(t&&typeof t.handleEvent=="function")t=D(t.handleEvent,t);else throw Error("Invalid listener argument");return 2147483647<Number(e)?-1:E.setTimeout(t,e||0)}function hn(t){t.g=on(()=>{t.g=null,t.i&&(t.i=!1,hn(t))},t.l);const e=t.h;t.h=null,t.m.apply(null,e)}class zi extends lt{constructor(e,i){super(),this.m=e,this.l=i,this.h=null,this.i=!1,this.g=null}j(e){this.h=arguments,this.g?this.i=!0:hn(this)}N(){super.N(),this.g&&(E.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Dt(t){lt.call(this),this.h=t,this.g={}}b(Dt,lt);var an=[];function ln(t){X(t.g,function(e,i){this.g.hasOwnProperty(i)&&Ee(e)},t),t.g={}}Dt.prototype.N=function(){Dt.aa.N.call(this),ln(this)},Dt.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Ae=E.JSON.stringify,Wi=E.JSON.parse,qi=class{stringify(t){return E.JSON.stringify(t,void 0)}parse(t){return E.JSON.parse(t,void 0)}};function be(){}be.prototype.h=null;function un(t){return t.h||(t.h=t.i())}function Yi(){}var Ct={OPEN:"a",kb:"b",Ja:"c",wb:"d"};function Ie(){j.call(this,"d")}b(Ie,j);function Re(){j.call(this,"c")}b(Re,j);var _t={},cn=null;function Se(){return cn=cn||new H}_t.La="serverreachability";function fn(t){j.call(this,_t.La,t)}b(fn,j);function Pt(t){const e=Se();G(e,new fn(e))}_t.STAT_EVENT="statevent";function pn(t,e){j.call(this,_t.STAT_EVENT,t),this.stat=e}b(pn,j);function K(t){const e=Se();G(e,new pn(e,t))}_t.Ma="timingevent";function dn(t,e){j.call(this,_t.Ma,t),this.size=e}b(dn,j);function Ot(t,e){if(typeof t!="function")throw Error("Fn must not be null and must be a function");return E.setTimeout(function(){t()},e)}function kt(){this.g=!0}kt.prototype.xa=function(){this.g=!1};function Ji(t,e,i,r,g,y){t.info(function(){if(t.g)if(y)for(var T="",C=y.split("&"),F=0;F<C.length;F++){var S=C[F].split("=");if(1<S.length){var $=S[0];S=S[1];var V=$.split("_");T=2<=V.length&&V[1]=="type"?T+($+"="+S+"&"):T+($+"=redacted&")}}else T=null;else T=y;return"XMLHTTP REQ ("+r+") [attempt "+g+"]: "+e+`
`+i+`
`+T})}function Qi(t,e,i,r,g,y,T){t.info(function(){return"XMLHTTP RESP ("+r+") [ attempt "+g+"]: "+e+`
`+i+`
`+y+" "+T})}function Et(t,e,i,r){t.info(function(){return"XMLHTTP TEXT ("+e+"): "+ts(t,i)+(r?" "+r:"")})}function Zi(t,e){t.info(function(){return"TIMEOUT: "+e})}kt.prototype.info=function(){};function ts(t,e){if(!t.g)return e;if(!e)return null;try{var i=JSON.parse(e);if(i){for(t=0;t<i.length;t++)if(Array.isArray(i[t])){var r=i[t];if(!(2>r.length)){var g=r[1];if(Array.isArray(g)&&!(1>g.length)){var y=g[0];if(y!="noop"&&y!="stop"&&y!="close")for(var T=1;T<g.length;T++)g[T]=""}}}}return Ae(i)}catch{return e}}var De={NO_ERROR:0,TIMEOUT:8},es={},Ce;function Yt(){}b(Yt,be),Yt.prototype.g=function(){return new XMLHttpRequest},Yt.prototype.i=function(){return{}},Ce=new Yt;function ut(t,e,i,r){this.j=t,this.i=e,this.l=i,this.R=r||1,this.U=new Dt(this),this.I=45e3,this.H=null,this.o=!1,this.m=this.A=this.v=this.L=this.F=this.S=this.B=null,this.D=[],this.g=null,this.C=0,this.s=this.u=null,this.X=-1,this.J=!1,this.O=0,this.M=null,this.W=this.K=this.T=this.P=!1,this.h=new gn}function gn(){this.i=null,this.g="",this.h=!1}var mn={},Pe={};function Oe(t,e,i){t.L=1,t.v=te(ot(e)),t.m=i,t.P=!0,yn(t,null)}function yn(t,e){t.F=Date.now(),Jt(t),t.A=ot(t.v);var i=t.A,r=t.R;Array.isArray(r)||(r=[String(r)]),On(i.i,"t",r),t.C=0,i=t.j.J,t.h=new gn,t.g=qn(t.j,i?e:null,!t.m),0<t.O&&(t.M=new zi(D(t.Y,t,t.g),t.O)),e=t.U,i=t.g,r=t.ca;var g="readystatechange";Array.isArray(g)||(g&&(an[0]=g.toString()),g=an);for(var y=0;y<g.length;y++){var T=en(i,g[y],r||e.handleEvent,!1,e.h||e);if(!T)break;e.g[T.key]=T}e=t.H?h(t.H):{},t.m?(t.u||(t.u="POST"),e["Content-Type"]="application/x-www-form-urlencoded",t.g.ea(t.A,t.u,t.m,e)):(t.u="GET",t.g.ea(t.A,t.u,null,e)),Pt(),Ji(t.i,t.u,t.A,t.l,t.R,t.m)}ut.prototype.ca=function(t){t=t.target;const e=this.M;e&&ht(t)==3?e.j():this.Y(t)},ut.prototype.Y=function(t){try{if(t==this.g)t:{const V=ht(this.g);var e=this.g.Ba();const At=this.g.Z();if(!(3>V)&&(V!=3||this.g&&(this.h.h||this.g.oa()||Un(this.g)))){this.J||V!=4||e==7||(e==8||0>=At?Pt(3):Pt(2)),ke(this);var i=this.g.Z();this.X=i;e:if(vn(this)){var r=Un(this.g);t="";var g=r.length,y=ht(this.g)==4;if(!this.h.i){if(typeof TextDecoder>"u"){gt(this),Nt(this);var T="";break e}this.h.i=new E.TextDecoder}for(e=0;e<g;e++)this.h.h=!0,t+=this.h.i.decode(r[e],{stream:!(y&&e==g-1)});r.length=0,this.h.g+=t,this.C=0,T=this.h.g}else T=this.g.oa();if(this.o=i==200,Qi(this.i,this.u,this.A,this.l,this.R,V,i),this.o){if(this.T&&!this.K){e:{if(this.g){var C,F=this.g;if((C=F.g?F.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!W(C)){var S=C;break e}}S=null}if(i=S)Et(this.i,this.l,i,"Initial handshake response via X-HTTP-Initial-Response"),this.K=!0,Ne(this,i);else{this.o=!1,this.s=3,K(12),gt(this),Nt(this);break t}}if(this.P){i=!0;let J;for(;!this.J&&this.C<T.length;)if(J=ns(this,T),J==Pe){V==4&&(this.s=4,K(14),i=!1),Et(this.i,this.l,null,"[Incomplete Response]");break}else if(J==mn){this.s=4,K(15),Et(this.i,this.l,T,"[Invalid Chunk]"),i=!1;break}else Et(this.i,this.l,J,null),Ne(this,J);if(vn(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),V!=4||T.length!=0||this.h.h||(this.s=1,K(16),i=!1),this.o=this.o&&i,!i)Et(this.i,this.l,T,"[Invalid Chunked Response]"),gt(this),Nt(this);else if(0<T.length&&!this.W){this.W=!0;var $=this.j;$.g==this&&$.ba&&!$.M&&($.j.info("Great, no buffering proxy detected. Bytes received: "+T.length),Fe($),$.M=!0,K(11))}}else Et(this.i,this.l,T,null),Ne(this,T);V==4&&gt(this),this.o&&!this.J&&(V==4?Kn(this.j,this):(this.o=!1,Jt(this)))}else _s(this.g),i==400&&0<T.indexOf("Unknown SID")?(this.s=3,K(12)):(this.s=0,K(13)),gt(this),Nt(this)}}}catch{}finally{}};function vn(t){return t.g?t.u=="GET"&&t.L!=2&&t.j.Ca:!1}function ns(t,e){var i=t.C,r=e.indexOf(`
`,i);return r==-1?Pe:(i=Number(e.substring(i,r)),isNaN(i)?mn:(r+=1,r+i>e.length?Pe:(e=e.slice(r,r+i),t.C=r+i,e)))}ut.prototype.cancel=function(){this.J=!0,gt(this)};function Jt(t){t.S=Date.now()+t.I,_n(t,t.I)}function _n(t,e){if(t.B!=null)throw Error("WatchDog timer not null");t.B=Ot(D(t.ba,t),e)}function ke(t){t.B&&(E.clearTimeout(t.B),t.B=null)}ut.prototype.ba=function(){this.B=null;const t=Date.now();0<=t-this.S?(Zi(this.i,this.A),this.L!=2&&(Pt(),K(17)),gt(this),this.s=2,Nt(this)):_n(this,this.S-t)};function Nt(t){t.j.G==0||t.J||Kn(t.j,t)}function gt(t){ke(t);var e=t.M;e&&typeof e.ma=="function"&&e.ma(),t.M=null,ln(t.U),t.g&&(e=t.g,t.g=null,e.abort(),e.ma())}function Ne(t,e){try{var i=t.j;if(i.G!=0&&(i.g==t||Le(i.h,t))){if(!t.K&&Le(i.h,t)&&i.G==3){try{var r=i.Da.g.parse(e)}catch{r=null}if(Array.isArray(r)&&r.length==3){var g=r;if(g[0]==0){t:if(!i.u){if(i.g)if(i.g.F+3e3<t.F)oe(i),se(i);else break t;Ue(i),K(18)}}else i.za=g[1],0<i.za-i.T&&37500>g[2]&&i.F&&i.v==0&&!i.C&&(i.C=Ot(D(i.Za,i),6e3));if(1>=wn(i.h)&&i.ca){try{i.ca()}catch{}i.ca=void 0}}else yt(i,11)}else if((t.K||i.g==t)&&oe(i),!W(e))for(g=i.Da.g.parse(e),e=0;e<g.length;e++){let S=g[e];if(i.T=S[0],S=S[1],i.G==2)if(S[0]=="c"){i.K=S[1],i.ia=S[2];const $=S[3];$!=null&&(i.la=$,i.j.info("VER="+i.la));const V=S[4];V!=null&&(i.Aa=V,i.j.info("SVER="+i.Aa));const At=S[5];At!=null&&typeof At=="number"&&0<At&&(r=1.5*At,i.L=r,i.j.info("backChannelRequestTimeoutMs_="+r)),r=i;const J=t.g;if(J){const he=J.g?J.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(he){var y=r.h;y.g||he.indexOf("spdy")==-1&&he.indexOf("quic")==-1&&he.indexOf("h2")==-1||(y.j=y.l,y.g=new Set,y.h&&(xe(y,y.h),y.h=null))}if(r.D){const je=J.g?J.g.getResponseHeader("X-HTTP-Session-Id"):null;je&&(r.ya=je,O(r.I,r.D,je))}}i.G=3,i.l&&i.l.ua(),i.ba&&(i.R=Date.now()-t.F,i.j.info("Handshake RTT: "+i.R+"ms")),r=i;var T=t;if(r.qa=Wn(r,r.J?r.ia:null,r.W),T.K){An(r.h,T);var C=T,F=r.L;F&&(C.I=F),C.B&&(ke(C),Jt(C)),r.g=T}else Vn(r);0<i.i.length&&re(i)}else S[0]!="stop"&&S[0]!="close"||yt(i,7);else i.G==3&&(S[0]=="stop"||S[0]=="close"?S[0]=="stop"?yt(i,7):Be(i):S[0]!="noop"&&i.l&&i.l.ta(S),i.v=0)}}Pt(4)}catch{}}var is=class{constructor(t,e){this.g=t,this.map=e}};function En(t){this.l=t||10,E.PerformanceNavigationTiming?(t=E.performance.getEntriesByType("navigation"),t=0<t.length&&(t[0].nextHopProtocol=="hq"||t[0].nextHopProtocol=="h2")):t=!!(E.chrome&&E.chrome.loadTimes&&E.chrome.loadTimes()&&E.chrome.loadTimes().wasFetchedViaSpdy),this.j=t?this.l:1,this.g=null,1<this.j&&(this.g=new Set),this.h=null,this.i=[]}function Tn(t){return t.h?!0:t.g?t.g.size>=t.j:!1}function wn(t){return t.h?1:t.g?t.g.size:0}function Le(t,e){return t.h?t.h==e:t.g?t.g.has(e):!1}function xe(t,e){t.g?t.g.add(e):t.h=e}function An(t,e){t.h&&t.h==e?t.h=null:t.g&&t.g.has(e)&&t.g.delete(e)}En.prototype.cancel=function(){if(this.i=bn(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const t of this.g.values())t.cancel();this.g.clear()}};function bn(t){if(t.h!=null)return t.i.concat(t.h.D);if(t.g!=null&&t.g.size!==0){let e=t.i;for(const i of t.g.values())e=e.concat(i.D);return e}return N(t.i)}function ss(t){if(t.V&&typeof t.V=="function")return t.V();if(typeof Map<"u"&&t instanceof Map||typeof Set<"u"&&t instanceof Set)return Array.from(t.values());if(typeof t=="string")return t.split("");if(w(t)){for(var e=[],i=t.length,r=0;r<i;r++)e.push(t[r]);return e}e=[],i=0;for(r in t)e[i++]=t[r];return e}function rs(t){if(t.na&&typeof t.na=="function")return t.na();if(!t.V||typeof t.V!="function"){if(typeof Map<"u"&&t instanceof Map)return Array.from(t.keys());if(!(typeof Set<"u"&&t instanceof Set)){if(w(t)||typeof t=="string"){var e=[];t=t.length;for(var i=0;i<t;i++)e.push(i);return e}e=[],i=0;for(const r in t)e[i++]=r;return e}}}function In(t,e){if(t.forEach&&typeof t.forEach=="function")t.forEach(e,void 0);else if(w(t)||typeof t=="string")Array.prototype.forEach.call(t,e,void 0);else for(var i=rs(t),r=ss(t),g=r.length,y=0;y<g;y++)e.call(void 0,r[y],i&&i[y],t)}var Rn=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function os(t,e){if(t){t=t.split("&");for(var i=0;i<t.length;i++){var r=t[i].indexOf("="),g=null;if(0<=r){var y=t[i].substring(0,r);g=t[i].substring(r+1)}else y=t[i];e(y,g?decodeURIComponent(g.replace(/\+/g," ")):"")}}}function mt(t){if(this.g=this.o=this.j="",this.s=null,this.m=this.l="",this.h=!1,t instanceof mt){this.h=t.h,Qt(this,t.j),this.o=t.o,this.g=t.g,Zt(this,t.s),this.l=t.l;var e=t.i,i=new Mt;i.i=e.i,e.g&&(i.g=new Map(e.g),i.h=e.h),Sn(this,i),this.m=t.m}else t&&(e=String(t).match(Rn))?(this.h=!1,Qt(this,e[1]||"",!0),this.o=Lt(e[2]||""),this.g=Lt(e[3]||"",!0),Zt(this,e[4]),this.l=Lt(e[5]||"",!0),Sn(this,e[6]||"",!0),this.m=Lt(e[7]||"")):(this.h=!1,this.i=new Mt(null,this.h))}mt.prototype.toString=function(){var t=[],e=this.j;e&&t.push(xt(e,Dn,!0),":");var i=this.g;return(i||e=="file")&&(t.push("//"),(e=this.o)&&t.push(xt(e,Dn,!0),"@"),t.push(encodeURIComponent(String(i)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),i=this.s,i!=null&&t.push(":",String(i))),(i=this.l)&&(this.g&&i.charAt(0)!="/"&&t.push("/"),t.push(xt(i,i.charAt(0)=="/"?ls:as,!0))),(i=this.i.toString())&&t.push("?",i),(i=this.m)&&t.push("#",xt(i,cs)),t.join("")};function ot(t){return new mt(t)}function Qt(t,e,i){t.j=i?Lt(e,!0):e,t.j&&(t.j=t.j.replace(/:$/,""))}function Zt(t,e){if(e){if(e=Number(e),isNaN(e)||0>e)throw Error("Bad port number "+e);t.s=e}else t.s=null}function Sn(t,e,i){e instanceof Mt?(t.i=e,fs(t.i,t.h)):(i||(e=xt(e,us)),t.i=new Mt(e,t.h))}function O(t,e,i){t.i.set(e,i)}function te(t){return O(t,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36)),t}function Lt(t,e){return t?e?decodeURI(t.replace(/%25/g,"%2525")):decodeURIComponent(t):""}function xt(t,e,i){return typeof t=="string"?(t=encodeURI(t).replace(e,hs),i&&(t=t.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),t):null}function hs(t){return t=t.charCodeAt(0),"%"+(t>>4&15).toString(16)+(t&15).toString(16)}var Dn=/[#\/\?@]/g,as=/[#\?:]/g,ls=/[#\?]/g,us=/[#\?@]/g,cs=/#/g;function Mt(t,e){this.h=this.g=null,this.i=t||null,this.j=!!e}function ct(t){t.g||(t.g=new Map,t.h=0,t.i&&os(t.i,function(e,i){t.add(decodeURIComponent(e.replace(/\+/g," ")),i)}))}s=Mt.prototype,s.add=function(t,e){ct(this),this.i=null,t=Tt(this,t);var i=this.g.get(t);return i||this.g.set(t,i=[]),i.push(e),this.h+=1,this};function Cn(t,e){ct(t),e=Tt(t,e),t.g.has(e)&&(t.i=null,t.h-=t.g.get(e).length,t.g.delete(e))}function Pn(t,e){return ct(t),e=Tt(t,e),t.g.has(e)}s.forEach=function(t,e){ct(this),this.g.forEach(function(i,r){i.forEach(function(g){t.call(e,g,r,this)},this)},this)},s.na=function(){ct(this);const t=Array.from(this.g.values()),e=Array.from(this.g.keys()),i=[];for(let r=0;r<e.length;r++){const g=t[r];for(let y=0;y<g.length;y++)i.push(e[r])}return i},s.V=function(t){ct(this);let e=[];if(typeof t=="string")Pn(this,t)&&(e=e.concat(this.g.get(Tt(this,t))));else{t=Array.from(this.g.values());for(let i=0;i<t.length;i++)e=e.concat(t[i])}return e},s.set=function(t,e){return ct(this),this.i=null,t=Tt(this,t),Pn(this,t)&&(this.h-=this.g.get(t).length),this.g.set(t,[e]),this.h+=1,this},s.get=function(t,e){return t?(t=this.V(t),0<t.length?String(t[0]):e):e};function On(t,e,i){Cn(t,e),0<i.length&&(t.i=null,t.g.set(Tt(t,e),N(i)),t.h+=i.length)}s.toString=function(){if(this.i)return this.i;if(!this.g)return"";const t=[],e=Array.from(this.g.keys());for(var i=0;i<e.length;i++){var r=e[i];const y=encodeURIComponent(String(r)),T=this.V(r);for(r=0;r<T.length;r++){var g=y;T[r]!==""&&(g+="="+encodeURIComponent(String(T[r]))),t.push(g)}}return this.i=t.join("&")};function Tt(t,e){return e=String(e),t.j&&(e=e.toLowerCase()),e}function fs(t,e){e&&!t.j&&(ct(t),t.i=null,t.g.forEach(function(i,r){var g=r.toLowerCase();r!=g&&(Cn(this,r),On(this,g,i))},t)),t.j=e}function ps(t,e){const i=new kt;if(E.Image){const r=new Image;r.onload=U(ft,i,"TestLoadImage: loaded",!0,e,r),r.onerror=U(ft,i,"TestLoadImage: error",!1,e,r),r.onabort=U(ft,i,"TestLoadImage: abort",!1,e,r),r.ontimeout=U(ft,i,"TestLoadImage: timeout",!1,e,r),E.setTimeout(function(){r.ontimeout&&r.ontimeout()},1e4),r.src=t}else e(!1)}function ds(t,e){const i=new kt,r=new AbortController,g=setTimeout(()=>{r.abort(),ft(i,"TestPingServer: timeout",!1,e)},1e4);fetch(t,{signal:r.signal}).then(y=>{clearTimeout(g),y.ok?ft(i,"TestPingServer: ok",!0,e):ft(i,"TestPingServer: server error",!1,e)}).catch(()=>{clearTimeout(g),ft(i,"TestPingServer: error",!1,e)})}function ft(t,e,i,r,g){try{g&&(g.onload=null,g.onerror=null,g.onabort=null,g.ontimeout=null),r(i)}catch{}}function gs(){this.g=new qi}function ms(t,e,i){const r=i||"";try{In(t,function(g,y){let T=g;A(g)&&(T=Ae(g)),e.push(r+y+"="+encodeURIComponent(T))})}catch(g){throw e.push(r+"type="+encodeURIComponent("_badmap")),g}}function ee(t){this.l=t.Ub||null,this.j=t.eb||!1}b(ee,be),ee.prototype.g=function(){return new ne(this.l,this.j)},ee.prototype.i=function(t){return function(){return t}}({});function ne(t,e){H.call(this),this.D=t,this.o=e,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.u=new Headers,this.h=null,this.B="GET",this.A="",this.g=!1,this.v=this.j=this.l=null}b(ne,H),s=ne.prototype,s.open=function(t,e){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.B=t,this.A=e,this.readyState=1,Ut(this)},s.send=function(t){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");this.g=!0;const e={headers:this.u,method:this.B,credentials:this.m,cache:void 0};t&&(e.body=t),(this.D||E).fetch(new Request(this.A,e)).then(this.Sa.bind(this),this.ga.bind(this))},s.abort=function(){this.response=this.responseText="",this.u=new Headers,this.status=0,this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),1<=this.readyState&&this.g&&this.readyState!=4&&(this.g=!1,Bt(this)),this.readyState=0},s.Sa=function(t){if(this.g&&(this.l=t,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=t.headers,this.readyState=2,Ut(this)),this.g&&(this.readyState=3,Ut(this),this.g)))if(this.responseType==="arraybuffer")t.arrayBuffer().then(this.Qa.bind(this),this.ga.bind(this));else if(typeof E.ReadableStream<"u"&&"body"in t){if(this.j=t.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.v=new TextDecoder;kn(this)}else t.text().then(this.Ra.bind(this),this.ga.bind(this))};function kn(t){t.j.read().then(t.Pa.bind(t)).catch(t.ga.bind(t))}s.Pa=function(t){if(this.g){if(this.o&&t.value)this.response.push(t.value);else if(!this.o){var e=t.value?t.value:new Uint8Array(0);(e=this.v.decode(e,{stream:!t.done}))&&(this.response=this.responseText+=e)}t.done?Bt(this):Ut(this),this.readyState==3&&kn(this)}},s.Ra=function(t){this.g&&(this.response=this.responseText=t,Bt(this))},s.Qa=function(t){this.g&&(this.response=t,Bt(this))},s.ga=function(){this.g&&Bt(this)};function Bt(t){t.readyState=4,t.l=null,t.j=null,t.v=null,Ut(t)}s.setRequestHeader=function(t,e){this.u.append(t,e)},s.getResponseHeader=function(t){return this.h&&this.h.get(t.toLowerCase())||""},s.getAllResponseHeaders=function(){if(!this.h)return"";const t=[],e=this.h.entries();for(var i=e.next();!i.done;)i=i.value,t.push(i[0]+": "+i[1]),i=e.next();return t.join(`\r
`)};function Ut(t){t.onreadystatechange&&t.onreadystatechange.call(t)}Object.defineProperty(ne.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(t){this.m=t?"include":"same-origin"}});function Nn(t){let e="";return X(t,function(i,r){e+=r,e+=":",e+=i,e+=`\r
`}),e}function Me(t,e,i){t:{for(r in i){var r=!1;break t}r=!0}r||(i=Nn(i),typeof t=="string"?i!=null&&encodeURIComponent(String(i)):O(t,e,i))}function L(t){H.call(this),this.headers=new Map,this.o=t||null,this.h=!1,this.v=this.g=null,this.D="",this.m=0,this.l="",this.j=this.B=this.u=this.A=!1,this.I=null,this.H="",this.J=!1}b(L,H);var ys=/^https?$/i,vs=["POST","PUT"];s=L.prototype,s.Ha=function(t){this.J=t},s.ea=function(t,e,i,r){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+t);e=e?e.toUpperCase():"GET",this.D=t,this.l="",this.m=0,this.A=!1,this.h=!0,this.g=this.o?this.o.g():Ce.g(),this.v=this.o?un(this.o):un(Ce),this.g.onreadystatechange=D(this.Ea,this);try{this.B=!0,this.g.open(e,String(t),!0),this.B=!1}catch(y){Ln(this,y);return}if(t=i||"",i=new Map(this.headers),r)if(Object.getPrototypeOf(r)===Object.prototype)for(var g in r)i.set(g,r[g]);else if(typeof r.keys=="function"&&typeof r.get=="function")for(const y of r.keys())i.set(y,r.get(y));else throw Error("Unknown input type for opt_headers: "+String(r));r=Array.from(i.keys()).find(y=>y.toLowerCase()=="content-type"),g=E.FormData&&t instanceof E.FormData,!(0<=Array.prototype.indexOf.call(vs,e,void 0))||r||g||i.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[y,T]of i)this.g.setRequestHeader(y,T);this.H&&(this.g.responseType=this.H),"withCredentials"in this.g&&this.g.withCredentials!==this.J&&(this.g.withCredentials=this.J);try{Bn(this),this.u=!0,this.g.send(t),this.u=!1}catch(y){Ln(this,y)}};function Ln(t,e){t.h=!1,t.g&&(t.j=!0,t.g.abort(),t.j=!1),t.l=e,t.m=5,xn(t),ie(t)}function xn(t){t.A||(t.A=!0,G(t,"complete"),G(t,"error"))}s.abort=function(t){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.m=t||7,G(this,"complete"),G(this,"abort"),ie(this))},s.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),ie(this,!0)),L.aa.N.call(this)},s.Ea=function(){this.s||(this.B||this.u||this.j?Mn(this):this.bb())},s.bb=function(){Mn(this)};function Mn(t){if(t.h&&typeof _<"u"&&(!t.v[1]||ht(t)!=4||t.Z()!=2)){if(t.u&&ht(t)==4)on(t.Ea,0,t);else if(G(t,"readystatechange"),ht(t)==4){t.h=!1;try{const T=t.Z();t:switch(T){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var e=!0;break t;default:e=!1}var i;if(!(i=e)){var r;if(r=T===0){var g=String(t.D).match(Rn)[1]||null;!g&&E.self&&E.self.location&&(g=E.self.location.protocol.slice(0,-1)),r=!ys.test(g?g.toLowerCase():"")}i=r}if(i)G(t,"complete"),G(t,"success");else{t.m=6;try{var y=2<ht(t)?t.g.statusText:""}catch{y=""}t.l=y+" ["+t.Z()+"]",xn(t)}}finally{ie(t)}}}}function ie(t,e){if(t.g){Bn(t);const i=t.g,r=t.v[0]?()=>{}:null;t.g=null,t.v=null,e||G(t,"ready");try{i.onreadystatechange=r}catch{}}}function Bn(t){t.I&&(E.clearTimeout(t.I),t.I=null)}s.isActive=function(){return!!this.g};function ht(t){return t.g?t.g.readyState:0}s.Z=function(){try{return 2<ht(this)?this.g.status:-1}catch{return-1}},s.oa=function(){try{return this.g?this.g.responseText:""}catch{return""}},s.Oa=function(t){if(this.g){var e=this.g.responseText;return t&&e.indexOf(t)==0&&(e=e.substring(t.length)),Wi(e)}};function Un(t){try{if(!t.g)return null;if("response"in t.g)return t.g.response;switch(t.H){case"":case"text":return t.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in t.g)return t.g.mozResponseArrayBuffer}return null}catch{return null}}function _s(t){const e={};t=(t.g&&2<=ht(t)&&t.g.getAllResponseHeaders()||"").split(`\r
`);for(let r=0;r<t.length;r++){if(W(t[r]))continue;var i=p(t[r]);const g=i[0];if(i=i[1],typeof i!="string")continue;i=i.trim();const y=e[g]||[];e[g]=y,y.push(i)}d(e,function(r){return r.join(", ")})}s.Ba=function(){return this.m},s.Ka=function(){return typeof this.l=="string"?this.l:String(this.l)};function Ft(t,e,i){return i&&i.internalChannelParams&&i.internalChannelParams[t]||e}function Fn(t){this.Aa=0,this.i=[],this.j=new kt,this.ia=this.qa=this.I=this.W=this.g=this.ya=this.D=this.H=this.m=this.S=this.o=null,this.Ya=this.U=0,this.Va=Ft("failFast",!1,t),this.F=this.C=this.u=this.s=this.l=null,this.X=!0,this.za=this.T=-1,this.Y=this.v=this.B=0,this.Ta=Ft("baseRetryDelayMs",5e3,t),this.cb=Ft("retryDelaySeedMs",1e4,t),this.Wa=Ft("forwardChannelMaxRetries",2,t),this.wa=Ft("forwardChannelRequestTimeoutMs",2e4,t),this.pa=t&&t.xmlHttpFactory||void 0,this.Xa=t&&t.Tb||void 0,this.Ca=t&&t.useFetchStreams||!1,this.L=void 0,this.J=t&&t.supportsCrossDomainXhr||!1,this.K="",this.h=new En(t&&t.concurrentRequestLimit),this.Da=new gs,this.P=t&&t.fastHandshake||!1,this.O=t&&t.encodeInitMessageHeaders||!1,this.P&&this.O&&(this.O=!1),this.Ua=t&&t.Rb||!1,t&&t.xa&&this.j.xa(),t&&t.forceLongPolling&&(this.X=!1),this.ba=!this.P&&this.X&&t&&t.detectBufferingProxy||!1,this.ja=void 0,t&&t.longPollingTimeout&&0<t.longPollingTimeout&&(this.ja=t.longPollingTimeout),this.ca=void 0,this.R=0,this.M=!1,this.ka=this.A=null}s=Fn.prototype,s.la=8,s.G=1,s.connect=function(t,e,i,r){K(0),this.W=t,this.H=e||{},i&&r!==void 0&&(this.H.OSID=i,this.H.OAID=r),this.F=this.X,this.I=Wn(this,null,this.W),re(this)};function Be(t){if(jn(t),t.G==3){var e=t.U++,i=ot(t.I);if(O(i,"SID",t.K),O(i,"RID",e),O(i,"TYPE","terminate"),jt(t,i),e=new ut(t,t.j,e),e.L=2,e.v=te(ot(i)),i=!1,E.navigator&&E.navigator.sendBeacon)try{i=E.navigator.sendBeacon(e.v.toString(),"")}catch{}!i&&E.Image&&(new Image().src=e.v,i=!0),i||(e.g=qn(e.j,null),e.g.ea(e.v)),e.F=Date.now(),Jt(e)}zn(t)}function se(t){t.g&&(Fe(t),t.g.cancel(),t.g=null)}function jn(t){se(t),t.u&&(E.clearTimeout(t.u),t.u=null),oe(t),t.h.cancel(),t.s&&(typeof t.s=="number"&&E.clearTimeout(t.s),t.s=null)}function re(t){if(!Tn(t.h)&&!t.s){t.s=!0;var e=t.Ga;It||tn(),Rt||(It(),Rt=!0),ge.add(e,t),t.B=0}}function Es(t,e){return wn(t.h)>=t.h.j-(t.s?1:0)?!1:t.s?(t.i=e.D.concat(t.i),!0):t.G==1||t.G==2||t.B>=(t.Va?0:t.Wa)?!1:(t.s=Ot(D(t.Ga,t,e),Xn(t,t.B)),t.B++,!0)}s.Ga=function(t){if(this.s)if(this.s=null,this.G==1){if(!t){this.U=Math.floor(1e5*Math.random()),t=this.U++;const g=new ut(this,this.j,t);let y=this.o;if(this.S&&(y?(y=h(y),f(y,this.S)):y=this.S),this.m!==null||this.O||(g.H=y,y=null),this.P)t:{for(var e=0,i=0;i<this.i.length;i++){e:{var r=this.i[i];if("__data__"in r.map&&(r=r.map.__data__,typeof r=="string")){r=r.length;break e}r=void 0}if(r===void 0)break;if(e+=r,4096<e){e=i;break t}if(e===4096||i===this.i.length-1){e=i+1;break t}}e=1e3}else e=1e3;e=$n(this,g,e),i=ot(this.I),O(i,"RID",t),O(i,"CVER",22),this.D&&O(i,"X-HTTP-Session-Id",this.D),jt(this,i),y&&(this.O?e="headers="+encodeURIComponent(String(Nn(y)))+"&"+e:this.m&&Me(i,this.m,y)),xe(this.h,g),this.Ua&&O(i,"TYPE","init"),this.P?(O(i,"$req",e),O(i,"SID","null"),g.T=!0,Oe(g,i,null)):Oe(g,i,e),this.G=2}}else this.G==3&&(t?Hn(this,t):this.i.length==0||Tn(this.h)||Hn(this))};function Hn(t,e){var i;e?i=e.l:i=t.U++;const r=ot(t.I);O(r,"SID",t.K),O(r,"RID",i),O(r,"AID",t.T),jt(t,r),t.m&&t.o&&Me(r,t.m,t.o),i=new ut(t,t.j,i,t.B+1),t.m===null&&(i.H=t.o),e&&(t.i=e.D.concat(t.i)),e=$n(t,i,1e3),i.I=Math.round(.5*t.wa)+Math.round(.5*t.wa*Math.random()),xe(t.h,i),Oe(i,r,e)}function jt(t,e){t.H&&X(t.H,function(i,r){O(e,r,i)}),t.l&&In({},function(i,r){O(e,r,i)})}function $n(t,e,i){i=Math.min(t.i.length,i);var r=t.l?D(t.l.Na,t.l,t):null;t:{var g=t.i;let y=-1;for(;;){const T=["count="+i];y==-1?0<i?(y=g[0].g,T.push("ofs="+y)):y=0:T.push("ofs="+y);let C=!0;for(let F=0;F<i;F++){let S=g[F].g;const $=g[F].map;if(S-=y,0>S)y=Math.max(0,g[F].g-100),C=!1;else try{ms($,T,"req"+S+"_")}catch{r&&r($)}}if(C){r=T.join("&");break t}}}return t=t.i.splice(0,i),e.D=t,r}function Vn(t){if(!t.g&&!t.u){t.Y=1;var e=t.Fa;It||tn(),Rt||(It(),Rt=!0),ge.add(e,t),t.v=0}}function Ue(t){return t.g||t.u||3<=t.v?!1:(t.Y++,t.u=Ot(D(t.Fa,t),Xn(t,t.v)),t.v++,!0)}s.Fa=function(){if(this.u=null,Gn(this),this.ba&&!(this.M||this.g==null||0>=this.R)){var t=2*this.R;this.j.info("BP detection timer enabled: "+t),this.A=Ot(D(this.ab,this),t)}},s.ab=function(){this.A&&(this.A=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.M=!0,K(10),se(this),Gn(this))};function Fe(t){t.A!=null&&(E.clearTimeout(t.A),t.A=null)}function Gn(t){t.g=new ut(t,t.j,"rpc",t.Y),t.m===null&&(t.g.H=t.o),t.g.O=0;var e=ot(t.qa);O(e,"RID","rpc"),O(e,"SID",t.K),O(e,"AID",t.T),O(e,"CI",t.F?"0":"1"),!t.F&&t.ja&&O(e,"TO",t.ja),O(e,"TYPE","xmlhttp"),jt(t,e),t.m&&t.o&&Me(e,t.m,t.o),t.L&&(t.g.I=t.L);var i=t.g;t=t.ia,i.L=1,i.v=te(ot(e)),i.m=null,i.P=!0,yn(i,t)}s.Za=function(){this.C!=null&&(this.C=null,se(this),Ue(this),K(19))};function oe(t){t.C!=null&&(E.clearTimeout(t.C),t.C=null)}function Kn(t,e){var i=null;if(t.g==e){oe(t),Fe(t),t.g=null;var r=2}else if(Le(t.h,e))i=e.D,An(t.h,e),r=1;else return;if(t.G!=0){if(e.o)if(r==1){i=e.m?e.m.length:0,e=Date.now()-e.F;var g=t.B;r=Se(),G(r,new dn(r,i)),re(t)}else Vn(t);else if(g=e.s,g==3||g==0&&0<e.X||!(r==1&&Es(t,e)||r==2&&Ue(t)))switch(i&&0<i.length&&(e=t.h,e.i=e.i.concat(i)),g){case 1:yt(t,5);break;case 4:yt(t,10);break;case 3:yt(t,6);break;default:yt(t,2)}}}function Xn(t,e){let i=t.Ta+Math.floor(Math.random()*t.cb);return t.isActive()||(i*=2),i*e}function yt(t,e){if(t.j.info("Error code "+e),e==2){var i=D(t.fb,t),r=t.Xa;const g=!r;r=new mt(r||"//www.google.com/images/cleardot.gif"),E.location&&E.location.protocol=="http"||Qt(r,"https"),te(r),g?ps(r.toString(),i):ds(r.toString(),i)}else K(2);t.G=0,t.l&&t.l.sa(e),zn(t),jn(t)}s.fb=function(t){t?(this.j.info("Successfully pinged google.com"),K(2)):(this.j.info("Failed to ping google.com"),K(1))};function zn(t){if(t.G=0,t.ka=[],t.l){const e=bn(t.h);(e.length!=0||t.i.length!=0)&&(R(t.ka,e),R(t.ka,t.i),t.h.i.length=0,N(t.i),t.i.length=0),t.l.ra()}}function Wn(t,e,i){var r=i instanceof mt?ot(i):new mt(i);if(r.g!="")e&&(r.g=e+"."+r.g),Zt(r,r.s);else{var g=E.location;r=g.protocol,e=e?e+"."+g.hostname:g.hostname,g=+g.port;var y=new mt(null);r&&Qt(y,r),e&&(y.g=e),g&&Zt(y,g),i&&(y.l=i),r=y}return i=t.D,e=t.ya,i&&e&&O(r,i,e),O(r,"VER",t.la),jt(t,r),r}function qn(t,e,i){if(e&&!t.J)throw Error("Can't create secondary domain capable XhrIo object.");return e=t.Ca&&!t.pa?new L(new ee({eb:i})):new L(t.pa),e.Ha(t.J),e}s.isActive=function(){return!!this.l&&this.l.isActive(this)};function Yn(){}s=Yn.prototype,s.ua=function(){},s.ta=function(){},s.sa=function(){},s.ra=function(){},s.isActive=function(){return!0},s.Na=function(){};function q(t,e){H.call(this),this.g=new Fn(e),this.l=t,this.h=e&&e.messageUrlParams||null,t=e&&e.messageHeaders||null,e&&e.clientProtocolHeaderRequired&&(t?t["X-Client-Protocol"]="webchannel":t={"X-Client-Protocol":"webchannel"}),this.g.o=t,t=e&&e.initMessageHeaders||null,e&&e.messageContentType&&(t?t["X-WebChannel-Content-Type"]=e.messageContentType:t={"X-WebChannel-Content-Type":e.messageContentType}),e&&e.va&&(t?t["X-WebChannel-Client-Profile"]=e.va:t={"X-WebChannel-Client-Profile":e.va}),this.g.S=t,(t=e&&e.Sb)&&!W(t)&&(this.g.m=t),this.v=e&&e.supportsCrossDomainXhr||!1,this.u=e&&e.sendRawJson||!1,(e=e&&e.httpSessionIdParam)&&!W(e)&&(this.g.D=e,t=this.h,t!==null&&e in t&&(t=this.h,e in t&&delete t[e])),this.j=new wt(this)}b(q,H),q.prototype.m=function(){this.g.l=this.j,this.v&&(this.g.J=!0),this.g.connect(this.l,this.h||void 0)},q.prototype.close=function(){Be(this.g)},q.prototype.o=function(t){var e=this.g;if(typeof t=="string"){var i={};i.__data__=t,t=i}else this.u&&(i={},i.__data__=Ae(t),t=i);e.i.push(new is(e.Ya++,t)),e.G==3&&re(e)},q.prototype.N=function(){this.g.l=null,delete this.j,Be(this.g),delete this.g,q.aa.N.call(this)};function Jn(t){Ie.call(this),t.__headers__&&(this.headers=t.__headers__,this.statusCode=t.__status__,delete t.__headers__,delete t.__status__);var e=t.__sm__;if(e){t:{for(const i in e){t=i;break t}t=void 0}(this.i=t)&&(t=this.i,e=e!==null&&t in e?e[t]:void 0),this.data=e}else this.data=t}b(Jn,Ie);function Qn(){Re.call(this),this.status=1}b(Qn,Re);function wt(t){this.g=t}b(wt,Yn),wt.prototype.ua=function(){G(this.g,"a")},wt.prototype.ta=function(t){G(this.g,new Jn(t))},wt.prototype.sa=function(t){G(this.g,new Qn)},wt.prototype.ra=function(){G(this.g,"b")},q.prototype.send=q.prototype.o,q.prototype.open=q.prototype.m,q.prototype.close=q.prototype.close,De.NO_ERROR=0,De.TIMEOUT=8,De.HTTP_ERROR=6,es.COMPLETE="complete",Yi.EventType=Ct,Ct.OPEN="a",Ct.CLOSE="b",Ct.ERROR="c",Ct.MESSAGE="d",H.prototype.listen=H.prototype.K,L.prototype.listenOnce=L.prototype.L,L.prototype.getLastError=L.prototype.Ka,L.prototype.getLastErrorCode=L.prototype.Ba,L.prototype.getStatus=L.prototype.Z,L.prototype.getResponseJson=L.prototype.Oa,L.prototype.getResponseText=L.prototype.oa,L.prototype.send=L.prototype.ea,L.prototype.setWithCredentials=L.prototype.Ha}).apply(typeof le<"u"?le:typeof self<"u"?self:typeof window<"u"?window:{});const gi="@firebase/firestore";/**
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
 */class z{constructor(n){this.uid=n}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(n){return n.uid===this.uid}}z.UNAUTHENTICATED=new z(null),z.GOOGLE_CREDENTIALS=new z("google-credentials-uid"),z.FIRST_PARTY=new z("first-party-uid"),z.MOCK_USER=new z("mock-user");/**
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
 */let de="10.14.0";/**
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
 */const fe=new Ri("@firebase/firestore");function et(s,...n){if(fe.logLevel<=P.DEBUG){const o=n.map(Mi);fe.debug(`Firestore (${de}): ${s}`,...o)}}function xi(s,...n){if(fe.logLevel<=P.ERROR){const o=n.map(Mi);fe.error(`Firestore (${de}): ${s}`,...o)}}function Mi(s){if(typeof s=="string")return s;try{/**
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
 */function Bi(s="Unexpected state"){const n=`FIRESTORE (${de}) INTERNAL ASSERTION FAILED: `+s;throw xi(n),new Error(n)}function Ht(s,n){s||Bi()}/**
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
 */const Q={CANCELLED:"cancelled",INVALID_ARGUMENT:"invalid-argument",FAILED_PRECONDITION:"failed-precondition"};class Z extends vt{constructor(n,o){super(n,o),this.code=n,this.message=o,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
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
 */class $t{constructor(){this.promise=new Promise((n,o)=>{this.resolve=n,this.reject=o})}}/**
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
 */class yo{constructor(n,o){this.user=o,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${n}`)}}class vo{getToken(){return Promise.resolve(null)}invalidateToken(){}start(n,o){n.enqueueRetryable(()=>o(z.UNAUTHENTICATED))}shutdown(){}}class _o{constructor(n){this.t=n,this.currentUser=z.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(n,o){Ht(this.o===void 0);let l=this.i;const c=w=>this.i!==l?(l=this.i,o(w)):Promise.resolve();let v=new $t;this.o=()=>{this.i++,this.currentUser=this.u(),v.resolve(),v=new $t,n.enqueueRetryable(()=>c(this.currentUser))};const _=()=>{const w=v;n.enqueueRetryable(async()=>{await w.promise,await c(this.currentUser)})},E=w=>{et("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=w,this.o&&(this.auth.addAuthTokenListener(this.o),_())};this.t.onInit(w=>E(w)),setTimeout(()=>{if(!this.auth){const w=this.t.getImmediate({optional:!0});w?E(w):(et("FirebaseAuthCredentialsProvider","Auth not yet detected"),v.resolve(),v=new $t)}},0),_()}getToken(){const n=this.i,o=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(o).then(l=>this.i!==n?(et("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):l?(Ht(typeof l.accessToken=="string"),new yo(l.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const n=this.auth&&this.auth.getUid();return Ht(n===null||typeof n=="string"),new z(n)}}class Eo{constructor(n,o,l){this.l=n,this.h=o,this.P=l,this.type="FirstParty",this.user=z.FIRST_PARTY,this.I=new Map}T(){return this.P?this.P():null}get headers(){this.I.set("X-Goog-AuthUser",this.l);const n=this.T();return n&&this.I.set("Authorization",n),this.h&&this.I.set("X-Goog-Iam-Authorization-Token",this.h),this.I}}class To{constructor(n,o,l){this.l=n,this.h=o,this.P=l}getToken(){return Promise.resolve(new Eo(this.l,this.h,this.P))}start(n,o){n.enqueueRetryable(()=>o(z.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class wo{constructor(n){this.value=n,this.type="AppCheck",this.headers=new Map,n&&n.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class Ao{constructor(n){this.A=n,this.forceRefresh=!1,this.appCheck=null,this.R=null}start(n,o){Ht(this.o===void 0);const l=v=>{v.error!=null&&et("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${v.error.message}`);const _=v.token!==this.R;return this.R=v.token,et("FirebaseAppCheckTokenProvider",`Received ${_?"new":"existing"} token.`),_?o(v.token):Promise.resolve()};this.o=v=>{n.enqueueRetryable(()=>l(v))};const c=v=>{et("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=v,this.o&&this.appCheck.addTokenListener(this.o)};this.A.onInit(v=>c(v)),setTimeout(()=>{if(!this.appCheck){const v=this.A.getImmediate({optional:!0});v?c(v):et("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){const n=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(n).then(o=>o?(Ht(typeof o.token=="string"),this.R=o.token,new wo(o.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}function bo(s){return s.name==="IndexedDbTransactionError"}class pe{constructor(n,o){this.projectId=n,this.database=o||"(default)"}static empty(){return new pe("","")}get isDefaultDatabase(){return this.database==="(default)"}isEqual(n){return n instanceof pe&&n.projectId===this.projectId&&n.database===this.database}}/**
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
 */var mi,I;(I=mi||(mi={}))[I.OK=0]="OK",I[I.CANCELLED=1]="CANCELLED",I[I.UNKNOWN=2]="UNKNOWN",I[I.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",I[I.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",I[I.NOT_FOUND=5]="NOT_FOUND",I[I.ALREADY_EXISTS=6]="ALREADY_EXISTS",I[I.PERMISSION_DENIED=7]="PERMISSION_DENIED",I[I.UNAUTHENTICATED=16]="UNAUTHENTICATED",I[I.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",I[I.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",I[I.ABORTED=10]="ABORTED",I[I.OUT_OF_RANGE=11]="OUT_OF_RANGE",I[I.UNIMPLEMENTED=12]="UNIMPLEMENTED",I[I.INTERNAL=13]="INTERNAL",I[I.UNAVAILABLE=14]="UNAVAILABLE",I[I.DATA_LOSS=15]="DATA_LOSS";/**
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
 */new Li([4294967295,4294967295],0);function ze(){return typeof document<"u"?document:null}/**
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
 */class Io{constructor(n,o,l=1e3,c=1.5,v=6e4){this.ui=n,this.timerId=o,this.ko=l,this.qo=c,this.Qo=v,this.Ko=0,this.$o=null,this.Uo=Date.now(),this.reset()}reset(){this.Ko=0}Wo(){this.Ko=this.Qo}Go(n){this.cancel();const o=Math.floor(this.Ko+this.zo()),l=Math.max(0,Date.now()-this.Uo),c=Math.max(0,o-l);c>0&&et("ExponentialBackoff",`Backing off for ${c} ms (base delay: ${this.Ko} ms, delay with jitter: ${o} ms, last attempt: ${l} ms ago)`),this.$o=this.ui.enqueueAfterDelay(this.timerId,c,()=>(this.Uo=Date.now(),n())),this.Ko*=this.qo,this.Ko<this.ko&&(this.Ko=this.ko),this.Ko>this.Qo&&(this.Ko=this.Qo)}jo(){this.$o!==null&&(this.$o.skipDelay(),this.$o=null)}cancel(){this.$o!==null&&(this.$o.cancel(),this.$o=null)}zo(){return(Math.random()-.5)*this.Ko}}/**
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
 */class Ze{constructor(n,o,l,c,v){this.asyncQueue=n,this.timerId=o,this.targetTimeMs=l,this.op=c,this.removalCallback=v,this.deferred=new $t,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(_=>{})}get promise(){return this.deferred.promise}static createAndSchedule(n,o,l,c,v){const _=Date.now()+l,E=new Ze(n,o,_,c,v);return E.start(l),E}start(n){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),n)}skipDelay(){return this.handleDelayElapsed()}cancel(n){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new Z(Q.CANCELLED,"Operation cancelled"+(n?": "+n:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(n=>this.deferred.resolve(n))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}var yi,vi;(vi=yi||(yi={})).ea="default",vi.Cache="cache";/**
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
 */function Ro(s){const n={};return s.timeoutSeconds!==void 0&&(n.timeoutSeconds=s.timeoutSeconds),n}/**
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
 */const _i=new Map;function So(s,n,o,l){if(n===!0&&l===!0)throw new Z(Q.INVALID_ARGUMENT,`${s} and ${o} cannot be used together.`)}/**
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
 */class Ei{constructor(n){var o,l;if(n.host===void 0){if(n.ssl!==void 0)throw new Z(Q.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host="firestore.googleapis.com",this.ssl=!0}else this.host=n.host,this.ssl=(o=n.ssl)===null||o===void 0||o;if(this.credentials=n.credentials,this.ignoreUndefinedProperties=!!n.ignoreUndefinedProperties,this.localCache=n.localCache,n.cacheSizeBytes===void 0)this.cacheSizeBytes=41943040;else{if(n.cacheSizeBytes!==-1&&n.cacheSizeBytes<1048576)throw new Z(Q.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=n.cacheSizeBytes}So("experimentalForceLongPolling",n.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",n.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!n.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:n.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!n.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=Ro((l=n.experimentalLongPollingOptions)!==null&&l!==void 0?l:{}),function(v){if(v.timeoutSeconds!==void 0){if(isNaN(v.timeoutSeconds))throw new Z(Q.INVALID_ARGUMENT,`invalid long polling timeout: ${v.timeoutSeconds} (must not be NaN)`);if(v.timeoutSeconds<5)throw new Z(Q.INVALID_ARGUMENT,`invalid long polling timeout: ${v.timeoutSeconds} (minimum allowed value is 5)`);if(v.timeoutSeconds>30)throw new Z(Q.INVALID_ARGUMENT,`invalid long polling timeout: ${v.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!n.useFetchStreams}isEqual(n){return this.host===n.host&&this.ssl===n.ssl&&this.credentials===n.credentials&&this.cacheSizeBytes===n.cacheSizeBytes&&this.experimentalForceLongPolling===n.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===n.experimentalAutoDetectLongPolling&&function(l,c){return l.timeoutSeconds===c.timeoutSeconds}(this.experimentalLongPollingOptions,n.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===n.ignoreUndefinedProperties&&this.useFetchStreams===n.useFetchStreams}}class Do{constructor(n,o,l,c){this._authCredentials=n,this._appCheckCredentials=o,this._databaseId=l,this._app=c,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Ei({}),this._settingsFrozen=!1,this._terminateTask="notTerminated"}get app(){if(!this._app)throw new Z(Q.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(n){if(this._settingsFrozen)throw new Z(Q.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Ei(n),n.credentials!==void 0&&(this._authCredentials=function(l){if(!l)return new vo;switch(l.type){case"firstParty":return new To(l.sessionIndex||"0",l.iamToken||null,l.authTokenFactory||null);case"provider":return l.client;default:throw new Z(Q.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(n.credentials))}_getSettings(){return this._settings}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(o){const l=_i.get(o);l&&(et("ComponentProvider","Removing Datastore"),_i.delete(o),l.terminate())}(this),Promise.resolve()}}/**
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
 */class Ti{constructor(n=Promise.resolve()){this.Pu=[],this.Iu=!1,this.Tu=[],this.Eu=null,this.du=!1,this.Au=!1,this.Ru=[],this.t_=new Io(this,"async_queue_retry"),this.Vu=()=>{const l=ze();l&&et("AsyncQueue","Visibility state changed to "+l.visibilityState),this.t_.jo()},this.mu=n;const o=ze();o&&typeof o.addEventListener=="function"&&o.addEventListener("visibilitychange",this.Vu)}get isShuttingDown(){return this.Iu}enqueueAndForget(n){this.enqueue(n)}enqueueAndForgetEvenWhileRestricted(n){this.fu(),this.gu(n)}enterRestrictedMode(n){if(!this.Iu){this.Iu=!0,this.Au=n||!1;const o=ze();o&&typeof o.removeEventListener=="function"&&o.removeEventListener("visibilitychange",this.Vu)}}enqueue(n){if(this.fu(),this.Iu)return new Promise(()=>{});const o=new $t;return this.gu(()=>this.Iu&&this.Au?Promise.resolve():(n().then(o.resolve,o.reject),o.promise)).then(()=>o.promise)}enqueueRetryable(n){this.enqueueAndForget(()=>(this.Pu.push(n),this.pu()))}async pu(){if(this.Pu.length!==0){try{await this.Pu[0](),this.Pu.shift(),this.t_.reset()}catch(n){if(!bo(n))throw n;et("AsyncQueue","Operation failed with retryable error: "+n)}this.Pu.length>0&&this.t_.Go(()=>this.pu())}}gu(n){const o=this.mu.then(()=>(this.du=!0,n().catch(l=>{this.Eu=l,this.du=!1;const c=function(_){let E=_.message||"";return _.stack&&(E=_.stack.includes(_.message)?_.stack:_.message+`
`+_.stack),E}(l);throw xi("INTERNAL UNHANDLED ERROR: ",c),l}).then(l=>(this.du=!1,l))));return this.mu=o,o}enqueueAfterDelay(n,o,l){this.fu(),this.Ru.indexOf(n)>-1&&(o=0);const c=Ze.createAndSchedule(this,n,o,l,v=>this.yu(v));return this.Tu.push(c),c}fu(){this.Eu&&Bi()}verifyOperationInProgress(){}async wu(){let n;do n=this.mu,await n;while(n!==this.mu)}Su(n){for(const o of this.Tu)if(o.timerId===n)return!0;return!1}bu(n){return this.wu().then(()=>{this.Tu.sort((o,l)=>o.targetTimeMs-l.targetTimeMs);for(const o of this.Tu)if(o.skipDelay(),n!=="all"&&o.timerId===n)break;return this.wu()})}Du(n){this.Ru.push(n)}yu(n){const o=this.Tu.indexOf(n);this.Tu.splice(o,1)}}class Co extends Do{constructor(n,o,l,c){super(n,o,l,c),this.type="firestore",this._queue=new Ti,this._persistenceKey=c?.name||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const n=this._firestoreClient.terminate();this._queue=new Ti(n),this._firestoreClient=void 0,await n}}}(function(n,o=!0){(function(c){de=c})(Ci),Gt(new Vt("firestore",(l,{instanceIdentifier:c,options:v})=>{const _=l.getProvider("app").getImmediate(),E=new Co(new _o(l.getProvider("auth-internal")),new Ao(l.getProvider("app-check-internal")),function(A,B){if(!Object.prototype.hasOwnProperty.apply(A.options,["projectId"]))throw new Z(Q.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new pe(A.options.projectId,B)}(_,c),_);return v=Object.assign({useFetchStreams:o},v),E._setSettings(v),E},"PUBLIC").setMultipleInstances(!0)),dt(gi,"4.7.3",n),dt(gi,"4.7.3","esm2017")})();export{Vt as C,Ii as E,vt as F,Ri as L,Ci as S,Gt as _,Lo as a,No as b,Uo as c,Bo as d,Mo as e,P as f,Po as g,Ps as h,Oo as i,bs as j,ko as k,xo as q,dt as r};
