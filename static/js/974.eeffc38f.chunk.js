/*! For license information please see 974.eeffc38f.chunk.js.LICENSE.txt */
"use strict";(self.webpackChunkrealbadcoin=self.webpackChunkrealbadcoin||[]).push([[974],{8238:(t,e,n)=>{n.d(e,{T:()=>M});var r=n(7420);const i=BigInt(0),s=BigInt(1),o=BigInt(2),a=BigInt(255),f=o**BigInt(252)+BigInt("27742317777372353535851937790883648493"),c={a:BigInt(-1),d:BigInt("37095705934669439343138083508754565189542113879843219016388785533085940283555"),P:o**a-BigInt(19),l:f,n:f,h:BigInt(8),Gx:BigInt("15112221349535400772501151409588531511454012693041857206046113283949847762202"),Gy:BigInt("46316835694926478169428394003475163141307993866256225615783033603165251855960")},u=o**BigInt(256),l=BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752"),h=(BigInt("6853475219497561581579357271197624642482790079785650197046958215289687604742"),BigInt("25063068953384623474111414158702152701244531502492656460079210482610430750235")),d=BigInt("54469307008909316920995813868745141605393597292927456921205312896311721017578"),p=BigInt("1159843021668779879193775521855586647937357759715417654439879720876111806838"),y=BigInt("40440834346308536858101042469323190826248399146238708352240133220865137265952");class w{constructor(t,e,n,r){this.x=t,this.y=e,this.z=n,this.t=r}static fromAffine(t){if(!(t instanceof m))throw new TypeError("ExtendedPoint#fromAffine: expected Point");return t.equals(m.ZERO)?w.ZERO:new w(t.x,t.y,s,L(t.x*t.y))}static toAffineBatch(t){const e=function(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:c.P;const n=t.length,r=new Array(n);let o=s;for(let s=0;s<n;s++)t[s]!==i&&(r[s]=o,o=L(o*t[s],e));o=N(o,e);for(let s=n-1;s>=0;s--){if(t[s]===i)continue;let n=L(o*t[s],e);t[s]=L(o*r[s],e),o=n}return t}(t.map((t=>t.z)));return t.map(((t,n)=>t.toAffine(e[n])))}static normalizeZ(t){return this.toAffineBatch(t).map(this.fromAffine)}static fromRistrettoHash(t){const e=R((t=H(t,64)).slice(0,32)),n=this.calcElligatorRistrettoMap(e),r=R(t.slice(32,64)),i=this.calcElligatorRistrettoMap(r);return n.add(i)}static calcElligatorRistrettoMap(t){const{d:e}=c,n=L(l*t*t),r=L((n+s)*p);let i=BigInt(-1);const o=L((i-e*n)*L(n+e));let{isValid:a,value:f}=O(r,o),u=L(f*t);S(u)||(u=L(-u)),a||(f=u),a||(i=n);const d=L(i*(n-s)*y-o),g=f*f,m=L((f+f)*o),E=L(d*h),b=L(s-g),v=L(s+g);return new w(L(m*v),L(b*E),L(E*v),L(m*b))}static fromRistrettoBytes(t){t=H(t,32);const{a:e,d:n}=c,r="ExtendedPoint.fromRistrettoBytes: Cannot convert bytes to Ristretto Point",o=R(t);if(!function(t,e){if(t.length!==e.length)return!1;for(let n=0;n<t.length;n++)if(t[n]!==e[n])return!1;return!0}(I(o,32),t)||S(o))throw new Error(r);const a=L(o*o),f=L(s+e*a),u=L(s-e*a),l=L(f*f),h=L(u*u),d=L(e*n*l-h),{isValid:p,value:y}=k(L(d*h)),g=L(y*u),m=L(y*g*d);let E=L((o+o)*g);S(E)&&(E=L(-E));const b=L(f*m),v=L(E*b);if(!p||S(v)||b===i)throw new Error(r);return new w(E,b,s,v)}toRistrettoBytes(){let{x:t,y:e,z:n,t:r}=this;const i=L(L(n+e)*L(n-e)),s=L(t*e),{value:a}=k(L(i*s**o)),f=L(a*i),c=L(a*s),u=L(f*c*r);let h;if(S(r*u)){let n=L(e*l),r=L(t*l);t=n,e=r,h=L(f*d)}else h=c;S(t*u)&&(e=L(-e));let p=L((n-e)*h);return S(p)&&(p=L(-p)),I(p,32)}equals(t){const e=t;return L(this.t*e.z)===L(e.t*this.z)}negate(){return new w(L(-this.x),this.y,this.z,L(-this.t))}double(){const t=this.x,e=this.y,n=this.z,{a:r}=c,i=L(t**o),s=L(e**o),a=L(o*n**o),f=L(r*i),u=L((t+e)**o-i-s),l=L(f+s),h=L(l-a),d=L(f-s),p=L(u*h),y=L(l*d),g=L(u*d),m=L(h*l);return new w(p,y,m,g)}add(t){const e=this.x,n=this.y,r=this.z,s=this.t,a=t.x,f=t.y,c=t.z,u=t.t,l=L((n-e)*(f+a)),h=L((n+e)*(f-a)),d=L(h-l);if(d===i)return this.double();const p=L(r*o*u),y=L(s*o*c),g=L(y+p),m=L(h+l),E=L(y-p),b=L(g*d),v=L(m*E),A=L(g*E),B=L(d*m);return new w(b,v,B,A)}subtract(t){return this.add(t.negate())}multiplyUnsafe(t){let e=G(t,c.n);const n=w.ZERO;if(this.equals(n)||e===s)return this;let r=n,o=this;for(;e>i;)e&s&&(r=r.add(o)),o=o.double(),e>>=s;return r}precomputeWindow(t){const e=256/t+1;let n=[],r=this,i=r;for(let s=0;s<e;s++){i=r,n.push(i);for(let e=1;e<2**(t-1);e++)i=i.add(r),n.push(i);r=i.double()}return n}wNAF(t,e){!e&&this.equals(w.BASE)&&(e=m.BASE);const n=e&&e._WINDOW_SIZE||1;if(256%n)throw new Error("Point#wNAF: Invalid precomputation window, must be power of 2");let r=e&&g.get(e);r||(r=this.precomputeWindow(n),e&&1!==n&&(r=w.normalizeZ(r),g.set(e,r)));let i=w.ZERO,o=w.ZERO;const a=256/n+1,f=2**(n-1),c=BigInt(2**n-1),u=2**n,l=BigInt(n);for(let h=0;h<a;h++){const e=h*f;let n=Number(t&c);if(t>>=l,n>f&&(n-=u,t+=s),0===n){let t=r[e];h%2&&(t=t.negate()),o=o.add(t)}else{let t=r[e+Math.abs(n)-1];n<0&&(t=t.negate()),i=i.add(t)}}return[i,o]}multiply(t,e){const n=G(t,c.n);return w.normalizeZ(this.wNAF(n,e))[0]}multiplyForVerification(t){const e=G(t,c.n,!1);return w.normalizeZ(this.wNAF(e))[0]}toAffine(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:N(this.z);const e=L(this.x*t),n=L(this.y*t);return new m(e,n)}}w.BASE=new w(c.Gx,c.Gy,s,L(c.Gx*c.Gy)),w.ZERO=new w(i,s,s,i);const g=new WeakMap;class m{constructor(t,e){this.x=t,this.y=e}_setWindowSize(t){this._WINDOW_SIZE=t,g.delete(this)}static fromHex(t){let e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];const{d:n,P:r}=c,i=(t=H(t,32)).slice();i[31]=-129&t[31];const o=U(i);if(e&&o>=r||!e&&o>=u)throw new Error("Point.fromHex expects hex <= Fp");const a=L(o*o),f=L(a-s),l=L(n*a+s);let{isValid:h,value:d}=O(f,l);if(!h)throw new Error("Point.fromHex: invalid y coordinate");const p=(d&s)===s;return 0!==(128&t[31])!==p&&(d=L(-d)),new m(d,o)}static async fromPrivateKey(t){return(await _(t)).point}toRawBytes(){const t=I(this.y,32);return t[31]|=this.x&s?128:0,t}toHex(){return A(this.toRawBytes())}toX25519(){const{y:t}=this;return I(L((s+t)*N(s-t)),32)}equals(t){return this.x===t.x&&this.y===t.y}negate(){return new m(L(-this.x),this.y)}add(t){return w.fromAffine(this).add(w.fromAffine(t)).toAffine()}subtract(t){return this.add(t.negate())}multiply(t){return w.fromAffine(this).multiply(t,this).toAffine()}}m.BASE=new m(c.Gx,c.Gy),m.ZERO=new m(i,s);class E{constructor(t,e){let n=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];if(this.r=t,!(t instanceof m))throw new Error("Expected Point instance");this.s=G(e,c.n,n)}static fromHex(t){let e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];const n=H(t,64),r=m.fromHex(n.slice(0,32),e),i=U(n.slice(32,64));return new E(r,i,e)}toRawBytes(){const t=new Uint8Array(64);return t.set(this.r.toRawBytes()),t.set(I(this.s,32),32),t}toHex(){return A(this.toRawBytes())}}function b(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];if(!e.every((t=>t instanceof Uint8Array)))throw new Error("Expected Uint8Array list");if(1===e.length)return e[0];const r=e.reduce(((t,e)=>t+e.length),0),i=new Uint8Array(r);for(let s=0,o=0;s<e.length;s++){const t=e[s];i.set(t,o),o+=t.length}return i}const v=Array.from({length:256},((t,e)=>e.toString(16).padStart(2,"0")));function A(t){if(!(t instanceof Uint8Array))throw new Error("Uint8Array expected");let e="";for(let n=0;n<t.length;n++)e+=v[t[n]];return e}function B(t){if("string"!==typeof t)throw new TypeError("hexToBytes: expected string, got "+typeof t);if(t.length%2)throw new Error("hexToBytes: received invalid unpadded hex");const e=new Uint8Array(t.length/2);for(let n=0;n<e.length;n++){const r=2*n,i=t.slice(r,r+2),s=Number.parseInt(i,16);if(Number.isNaN(s)||s<0)throw new Error("Invalid byte sequence");e[n]=s}return e}function x(t,e){return B(t.toString(16).padStart(2*e,"0"))}function I(t,e){return x(t,e).reverse()}function S(t){return(L(t)&s)===s}function U(t){if(!(t instanceof Uint8Array))throw new Error("Expected Uint8Array");return BigInt("0x"+A(Uint8Array.from(t).reverse()))}function R(t){return L(U(t)&o**a-s)}function L(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:c.P;const n=t%e;return n>=i?n:e+n}function N(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:c.P;if(t===i||e<=i)throw new Error(`invert: expected positive integers, got n=${t} mod=${e}`);let n=L(t,e),r=e,o=i,a=s,f=s,u=i;for(;n!==i;){const t=r/n,e=r%n,i=o-f*t,s=a-u*t;r=n,n=e,o=f,a=u,f=i,u=s}const l=r;if(l!==s)throw new Error("invert: does not exist");return L(o,e)}function P(t,e){const{P:n}=c;let r=t;for(;e-- >i;)r*=r,r%=n;return r}function T(t){const{P:e}=c,n=BigInt(5),r=BigInt(10),i=BigInt(20),a=BigInt(40),f=BigInt(80),u=t*t%e*t%e,l=P(u,o)*u%e,h=P(l,s)*t%e,d=P(h,n)*h%e,p=P(d,r)*d%e,y=P(p,i)*p%e,w=P(y,a)*y%e,g=P(w,f)*w%e,m=P(g,f)*w%e,E=P(m,r)*d%e;return{pow_p_5_8:P(E,o)*t%e,b2:u}}function O(t,e){const n=L(e*e*e),r=L(n*n*e);let i=L(t*n*T(t*r).pow_p_5_8);const s=L(e*i*i),o=i,a=L(i*l),f=s===t,c=s===L(-t),u=s===L(-t*l);return f&&(i=o),(c||u)&&(i=a),S(i)&&(i=L(-i)),{isValid:f||c,value:i}}function k(t){return O(s,t)}async function z(){const t=b(...arguments),e=await F.sha512(t),n=U(e);return L(n,c.n)}function H(t,e){const n=t instanceof Uint8Array?Uint8Array.from(t):B(t);if("number"===typeof e&&n.length!==e)throw new Error(`Expected ${e} bytes`);return n}function G(t,e){let n=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];if(!e)throw new TypeError("Specify max value");if("bigint"===typeof t)if(n){if(i<t&&t<e)return t}else if(i<=t&&t<u)return t;if("number"===typeof t&&Number.isSafeInteger(t))if(n){if(0<t)return BigInt(t)}else if(0<=t)return BigInt(t);throw new TypeError("Expected valid scalar: 0 < scalar < max")}function C(t){return t[0]&=248,t[31]&=127,t[31]|=64,t}async function _(t){if(32!==(t="bigint"===typeof t||"number"===typeof t?x(G(t,u),32):H(t)).length)throw new Error("Expected 32 bytes");const e=await F.sha512(t),n=C(e.slice(0,32)),r=e.slice(32,64),i=L(U(n),c.n),s=m.BASE.multiply(i),o=s.toRawBytes();return{head:n,prefix:r,scalar:i,point:s,pointBytes:o}}async function M(t,e,n){e=H(e),n instanceof m||(n=m.fromHex(n,!1)),t instanceof E||(t=E.fromHex(t,!1));const r=w.BASE.multiplyForVerification(t.s),i=await z(t.r.toRawBytes(),n.toRawBytes(),e),s=w.fromAffine(n).multiplyUnsafe(i);return w.fromAffine(t.r).add(s).subtract(r).multiplyUnsafe(c.h).equals(w.ZERO)}m.BASE._setWindowSize(8);const Z={node:r,web:"object"===typeof self&&"crypto"in self?self.crypto:void 0},F={TORSION_SUBGROUP:["0100000000000000000000000000000000000000000000000000000000000000","c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a","0000000000000000000000000000000000000000000000000000000000000080","26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05","ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f","26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc85","0000000000000000000000000000000000000000000000000000000000000000","c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac03fa"],bytesToHex:A,getExtendedPublicKey:_,mod:L,randomBytes:function(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:32;if(Z.web)return Z.web.getRandomValues(new Uint8Array(t));if(Z.node){const{randomBytes:e}=Z.node;return new Uint8Array(e(t).buffer)}throw new Error("The environment doesn't have randomBytes function")},randomPrivateKey:()=>F.randomBytes(32),sha512:async t=>{if(Z.web){const e=await Z.web.subtle.digest("SHA-512",t.buffer);return new Uint8Array(e)}if(Z.node)return Uint8Array.from(Z.node.createHash("sha512").update(t).digest());throw new Error("The environment doesn't have sha512 function")},precompute(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:8,e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:m.BASE;const n=e.equals(m.BASE)?e:new m(e.x,e.y);return n._setWindowSize(t),n.multiply(o),n}}},6904:(t,e,n)=>{n.d(e,{N:()=>i});var r=n(8677);class i extends r.kb{constructor(t,e,n,i){super(),this.blockLen=t,this.outputLen=e,this.padOffset=n,this.isLE=i,this.finished=!1,this.length=0,this.pos=0,this.destroyed=!1,this.buffer=new Uint8Array(t),this.view=(0,r.GL)(this.buffer)}update(t){if(this.destroyed)throw new Error("instance is destroyed");const{view:e,buffer:n,blockLen:i,finished:s}=this;if(s)throw new Error("digest() was already called");const o=(t=(0,r.O0)(t)).length;for(let a=0;a<o;){const s=Math.min(i-this.pos,o-a);if(s!==i)n.set(t.subarray(a,a+s),this.pos),this.pos+=s,a+=s,this.pos===i&&(this.process(e,0),this.pos=0);else{const e=(0,r.GL)(t);for(;i<=o-a;a+=i)this.process(e,a)}}return this.length+=t.length,this.roundClean(),this}digestInto(t){if(this.destroyed)throw new Error("instance is destroyed");if(!(t instanceof Uint8Array)||t.length<this.outputLen)throw new Error("_Sha2: Invalid output buffer");if(this.finished)throw new Error("digest() was already called");this.finished=!0;const{buffer:e,view:n,blockLen:i,isLE:s}=this;let{pos:o}=this;e[o++]=128,this.buffer.subarray(o).fill(0),this.padOffset>i-o&&(this.process(n,0),o=0);for(let r=o;r<i;r++)e[r]=0;!function(t,e,n,r){if("function"===typeof t.setBigUint64)return t.setBigUint64(e,n,r);const i=BigInt(32),s=BigInt(4294967295),o=Number(n>>i&s),a=Number(n&s),f=r?4:0,c=r?0:4;t.setUint32(e+f,o,r),t.setUint32(e+c,a,r)}(n,i-8,BigInt(8*this.length),s),this.process(n,0);const a=(0,r.GL)(t);this.get().forEach(((t,e)=>a.setUint32(4*e,t,s)))}digest(){const{buffer:t,outputLen:e}=this;this.digestInto(t);const n=t.slice(0,e);return this.destroy(),n}_cloneInto(t){t||(t=new this.constructor),t.set(...this.get());const{blockLen:e,buffer:n,length:r,finished:i,destroyed:s,pos:o}=this;return t.length=r,t.pos=o,t.finished=i,t.destroyed=s,r%e&&t.buffer.set(n),t}}},555:(t,e,n)=>{"object"===typeof self&&"crypto"in self&&self.crypto},1865:(t,e,n)=>{n.d(e,{J:()=>u});var r=n(6904),i=n(8677);const s=(t,e,n)=>t&e^t&n^e&n,o=new Uint32Array([1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298]),a=new Uint32Array([1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225]),f=new Uint32Array(64);class c extends r.N{constructor(){super(64,32,8,!1),this.A=0|a[0],this.B=0|a[1],this.C=0|a[2],this.D=0|a[3],this.E=0|a[4],this.F=0|a[5],this.G=0|a[6],this.H=0|a[7]}get(){const{A:t,B:e,C:n,D:r,E:i,F:s,G:o,H:a}=this;return[t,e,n,r,i,s,o,a]}set(t,e,n,r,i,s,o,a){this.A=0|t,this.B=0|e,this.C=0|n,this.D=0|r,this.E=0|i,this.F=0|s,this.G=0|o,this.H=0|a}process(t,e){for(let i=0;i<16;i++,e+=4)f[i]=t.getUint32(e,!1);for(let s=16;s<64;s++){const t=f[s-15],e=f[s-2],n=(0,i.np)(t,7)^(0,i.np)(t,18)^t>>>3,r=(0,i.np)(e,17)^(0,i.np)(e,19)^e>>>10;f[s]=r+f[s-7]+n+f[s-16]|0}let{A:n,B:r,C:a,D:c,E:u,F:l,G:h,H:d}=this;for(let y=0;y<64;y++){const t=d+((0,i.np)(u,6)^(0,i.np)(u,11)^(0,i.np)(u,25))+((p=u)&l^~p&h)+o[y]+f[y]|0,e=((0,i.np)(n,2)^(0,i.np)(n,13)^(0,i.np)(n,22))+s(n,r,a)|0;d=h,h=l,l=u,u=c+t|0,c=a,a=r,r=n,n=t+e|0}var p;n=n+this.A|0,r=r+this.B|0,a=a+this.C|0,c=c+this.D|0,u=u+this.E|0,l=l+this.F|0,h=h+this.G|0,d=d+this.H|0,this.set(n,r,a,c,u,l,h,d)}roundClean(){f.fill(0)}destroy(){this.set(0,0,0,0,0,0,0,0),this.buffer.fill(0)}}const u=(0,i.hE)((()=>new c))},8677:(t,e,n)=>{n.d(e,{GL:()=>r,np:()=>i,ci:()=>o,nr:()=>a,O0:()=>f,kb:()=>c,hE:()=>u});n(555);const r=t=>new DataView(t.buffer,t.byteOffset,t.byteLength),i=(t,e)=>t<<32-e|t>>>e;if(!(68===new Uint8Array(new Uint32Array([287454020]).buffer)[0]))throw new Error("Non little-endian hardware is not supported");const s=Array.from({length:256},((t,e)=>e.toString(16).padStart(2,"0")));function o(t){let e="";for(let n=0;n<t.length;n++)e+=s[t[n]];return e}function a(t){if("string"!==typeof t)throw new TypeError("hexToBytes: expected string, got "+typeof t);if(t.length%2)throw new Error("hexToBytes: received invalid unpadded hex");const e=new Uint8Array(t.length/2);for(let n=0;n<e.length;n++){const r=2*n,i=t.slice(r,r+2),s=Number.parseInt(i,16);if(Number.isNaN(s))throw new Error("Invalid byte sequence");e[n]=s}return e}(()=>{const t="undefined"!==typeof module&&"function"===typeof module.require&&module.require.bind(module);try{if(t){const{setImmediate:e}=t("timers");return()=>new Promise((t=>e(t)))}}catch(e){}})();function f(t){if("string"===typeof t&&(t=function(t){if("string"!==typeof t)throw new TypeError("utf8ToBytes expected string, got "+typeof t);return(new TextEncoder).encode(t)}(t)),!(t instanceof Uint8Array))throw new TypeError(`Expected input type is Uint8Array (got ${typeof t})`);return t}class c{clone(){return this._cloneInto()}}function u(t){const e=e=>t().update(f(e)).digest(),n=t();return e.outputLen=n.outputLen,e.blockLen=n.blockLen,e.create=()=>t(),e}},1555:(t,e,n)=>{n.d(e,{Jj:()=>c});const r=Symbol("Comlink.proxy"),i=Symbol("Comlink.endpoint"),s=Symbol("Comlink.releaseProxy"),o=Symbol("Comlink.thrown"),a=t=>"object"===typeof t&&null!==t||"function"===typeof t,f=new Map([["proxy",{canHandle:t=>a(t)&&t[r],serialize(t){const{port1:e,port2:n}=new MessageChannel;return c(t,e),[n,[n]]},deserialize(t){return t.start(),h(t,[],e);var e}}],["throw",{canHandle:t=>a(t)&&o in t,serialize(t){let e,{value:n}=t;return e=n instanceof Error?{isError:!0,value:{message:n.message,name:n.name,stack:n.stack}}:{isError:!1,value:n},[e,[]]},deserialize(t){if(t.isError)throw Object.assign(new Error(t.value.message),t.value);throw t.value}}]]);function c(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:self;e.addEventListener("message",(function n(r){if(!r||!r.data)return;const{id:i,type:s,path:a}=Object.assign({path:[]},r.data),f=(r.data.argumentList||[]).map(m);let l;try{const e=a.slice(0,-1).reduce(((t,e)=>t[e]),t),n=a.reduce(((t,e)=>t[e]),t);switch(s){case"GET":l=n;break;case"SET":e[a.slice(-1)[0]]=m(r.data.value),l=!0;break;case"APPLY":l=n.apply(e,f);break;case"CONSTRUCT":l=w(new n(...f));break;case"ENDPOINT":{const{port1:e,port2:n}=new MessageChannel;c(t,n),l=y(e,[e])}break;case"RELEASE":l=void 0;break;default:return}}catch(h){l={value:h,[o]:0}}Promise.resolve(l).catch((t=>({value:t,[o]:0}))).then((t=>{const[r,o]=g(t);e.postMessage(Object.assign(Object.assign({},r),{id:i}),o),"RELEASE"===s&&(e.removeEventListener("message",n),u(e))}))})),e.start&&e.start()}function u(t){(function(t){return"MessagePort"===t.constructor.name})(t)&&t.close()}function l(t){if(t)throw new Error("Proxy has been released and is not useable")}function h(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:function(){},r=!1;const o=new Proxy(n,{get(n,i){if(l(r),i===s)return()=>E(t,{type:"RELEASE",path:e.map((t=>t.toString()))}).then((()=>{u(t),r=!0}));if("then"===i){if(0===e.length)return{then:()=>o};const n=E(t,{type:"GET",path:e.map((t=>t.toString()))}).then(m);return n.then.bind(n)}return h(t,[...e,i])},set(n,i,s){l(r);const[o,a]=g(s);return E(t,{type:"SET",path:[...e,i].map((t=>t.toString())),value:o},a).then(m)},apply(n,s,o){l(r);const a=e[e.length-1];if(a===i)return E(t,{type:"ENDPOINT"}).then(m);if("bind"===a)return h(t,e.slice(0,-1));const[f,c]=d(o);return E(t,{type:"APPLY",path:e.map((t=>t.toString())),argumentList:f},c).then(m)},construct(n,i){l(r);const[s,o]=d(i);return E(t,{type:"CONSTRUCT",path:e.map((t=>t.toString())),argumentList:s},o).then(m)}});return o}function d(t){const e=t.map(g);return[e.map((t=>t[0])),(n=e.map((t=>t[1])),Array.prototype.concat.apply([],n))];var n}const p=new WeakMap;function y(t,e){return p.set(t,e),t}function w(t){return Object.assign(t,{[r]:!0})}function g(t){for(const[e,n]of f)if(n.canHandle(t)){const[r,i]=n.serialize(t);return[{type:"HANDLER",name:e,value:r},i]}return[{type:"RAW",value:t},p.get(t)||[]]}function m(t){switch(t.type){case"HANDLER":return f.get(t.name).deserialize(t.value);case"RAW":return t.value}}function E(t,e,n){return new Promise((r=>{const i=new Array(4).fill(0).map((()=>Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16))).join("-");t.addEventListener("message",(function e(n){n.data&&n.data.id&&n.data.id===i&&(t.removeEventListener("message",e),r(n.data))})),t.start&&t.start(),t.postMessage(Object.assign({id:i},e),n)}))}}}]);
//# sourceMappingURL=974.eeffc38f.chunk.js.map