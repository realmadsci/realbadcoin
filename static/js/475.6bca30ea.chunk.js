(()=>{var t={2455:(t,e,s)=>{"use strict";var i=s(6274),n=s(9359),a=s(1555),c=s(8238),o=s(1865),r=s(8677),h=s(8578);class l{constructor(){this.type="coin_transfer",this.destination=null,this.amount=0}static coerce(t){let{type:e,destination:s,amount:i}=t;try{if("coin_transfer"!==e)return null;let t=new l;return t.type=e,t.destination=s,t.amount=i,t}catch{return null}}isValid(){try{return"coin_transfer"===this.type&&32===(0,r.nr)(this.destination).length&&Number.isFinite(this.amount)&&this.amount>0}catch{return!1}}}class u{constructor(){this.type="nft_mint",this.nftData=null,this.nftId=null}hash(){return(0,r.ci)((0,o.J)(JSON.stringify(this.nftData)))}static coerce(t){let{type:e,nftData:s,nftId:i}=t;try{if("nft_mint"!==e)return null;let t=new u;return t.type=e,t.nftData=s,t.nftId=i,t}catch{return null}}isValid(){try{return"nft_mint"===this.type&&32===(0,r.nr)(this.nftId).length&&this.nftId===this.hash()&&null!==this.nftData&&JSON.stringify(this.nftData).length>0}catch{return!1}}}class f{constructor(){this.type="nft_transfer",this.nftId=null,this.destination=null}static coerce(t){let{type:e,nftId:s,destination:i}=t;try{if("nft_transfer"!==e)return null;let t=new f;return t.type=e,t.nftId=s,t.destination=i,t}catch{return null}}isValid(){try{return"nft_transfer"===this.type&&32===(0,r.nr)(this.nftId).length&&32===(0,r.nr)(this.destination).length}catch{return!1}}}class d{constructor(){this.source=null,this.sourceNonce=0,this.timestamp=null,this.transactionFee=0,this.txData=null,this.txId=null,this.signature=null}hash(){let t=JSON.stringify([this.source,this.sourceNonce,this.timestamp,this.transactionFee,this.txData]);return(0,r.ci)((0,o.J)(t))}static coerce(t){let{source:e,sourceNonce:s,timestamp:i,transactionFee:n,txData:a,txId:c,signature:o}=t;try{let t=new d;return t.source=e,t.sourceNonce=s,t.timestamp=new Date(i),t.transactionFee=n,t.txId=c,t.signature=o,t.txData=l.coerce(a)||u.coerce(a)||f.coerce(a),t}catch{return null}}async isValid(){try{return 32===(0,r.nr)(this.source).length&&Number.isInteger(this.sourceNonce)&&this.timestamp instanceof Date&&!isNaN(this.timestamp.getTime())&&Number.isFinite(this.transactionFee)&&this.transactionFee>=0&&this.txData.isValid()&&32===(0,r.nr)(this.txId).length&&this.hash()===this.txId&&64===(0,r.nr)(this.signature).length&&await c.T(this.signature,this.txId,this.source)}catch{return!1}}async seal(t){this.source=await t.getPubKeyHex(),this.timestamp=new Date,this.txId=this.hash(),this.signature=(0,r.ci)(await t.sign(this.txId))}}var k=(0,n.Z)("raw_hash");class g{constructor(){Object.defineProperty(this,k,{value:m}),this.prevHash="00".repeat(32),this.blockHeight=0,this.timestamp=null,this.transactions=[],this.miningReward=100,this.rewardDestination=null,this.difficulty=65536,this.nonce=0}get hash(){const t=(0,i.Z)(this,k)[k]();return(0,r.ci)((0,o.J)(t+this.nonce.toString()))}static difficultyMetric(t){return(1n<<256n)/(0,h.gO)(t)}isSealed(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:65536,e=Math.max(t,this.difficulty),s=(1n<<256n)/BigInt(e);return(0,h.gO)(this.hash)<s}tryToSeal(t){var e;let s=(1n<<256n)/BigInt(this.difficulty);this.timestamp=new Date(Math.max(null!==(e=this.timestamp)&&void 0!==e?e:Date.now(),Date.now()));const n=(0,i.Z)(this,k)[k]();for(let i=0;i<t;i++){const t=(0,r.ci)((0,o.J)(n+this.nonce.toString()));if((0,h.gO)(t)<s)return this.isSealed(this.difficulty);this.nonce++}return!1}static coerce(t){let{prevHash:e,blockHeight:s,timestamp:i,transactions:n,miningReward:a,rewardDestination:c,difficulty:o,nonce:r}=t;try{let t=new g;return t.prevHash=e,t.blockHeight=s,t.timestamp=new Date(i),t.transactions=n.map((t=>d.coerce(t))),t.miningReward=a,t.rewardDestination=c,t.difficulty=o,t.nonce=r,t}catch(h){return console.error(h),null}}async isValid(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:65536;try{return this.isSealed(t)&&32===(0,r.nr)(this.prevHash).length&&Number.isInteger(this.blockHeight)&&this.blockHeight>=0&&(this.blockHeight>0||this.prevHash==="00".repeat(32))&&this.timestamp instanceof Date&&!isNaN(this.timestamp.getTime())&&Array.isArray(this.transactions)&&await async function(t,e){for(let s of t)if(!await e(s))return!1;return!0}(this.transactions,(async t=>t instanceof d&&await t.isValid()))&&Number.isFinite(this.miningReward)&&this.miningReward>=0&&32===(0,r.nr)(this.rewardDestination).length}catch{return!1}}}function m(){const{nonce:t,...e}={...this};return(0,r.ci)((0,o.J)(JSON.stringify(e)))}class p{constructor(){this.balance=0,this.nonce=0}static coerce(t){let{balance:e,nonce:s}=t,i=new p;return i.balance=e,i.nonce=s,i}}class B{constructor(){this.owner=null,this.nonce=0}static coerce(t){let{owner:e,nonce:s}=t,i=new B;return i.owner=e,i.nonce=s,i}}class b{constructor(t,e,s){this.message="",this.transaction=null,this.lastBlockHash=null,this.message=t,this.transaction=e,this.lastBlockHash=s}toString(){return null!==this.lastBlockHash?"Bad Transaction in "+this.lastBlockHash.toString()+":\n"+this.message+"\n"+this.transaction.toString():"Bad Transaction:\n"+this.message+"\n"+this.transaction.toString()}}class y{constructor(t,e){this.message="",this.blockHash="",this.message=t,this.blockHash=e}toString(){return"Bad Block "+this.blockHash.toString()+":\n"+this.message}}class w extends y{constructor(t,e,s){super(t,e),this.blockTimestamp=void 0,this.blockTimestamp=new Date(s)}}class x{constructor(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:2e6;this.accounts={},this.nfts={},this.transactionFees=0,this.lastBlockHash="00".repeat(32),this.lastBlockHeight=-1,this.nextBlockDifficulty=null,this.lastBlockTimestamp=null,this.totalDifficulty=0n,this.errors=[],this.children=[],this.trackedAccount=null,this.accountLedger=[],this.nftLedger={},this.nextBlockDifficulty=t}static coerce(t){let{accounts:e,nfts:s,transactionFees:i,lastBlockHash:n,lastBlockHeight:a,nextBlockDifficulty:c,lastBlockTimestamp:o,totalDifficulty:r,errors:h,children:l,trackedAccount:u,accountLedger:f,nftLedger:d}=t,k=new x;return Object.keys(e).forEach((t=>{k.accounts[t]=p.coerce(e[t])})),Object.keys(s).forEach((t=>{k.nfts[t]=B.coerce(s[t])})),k.transactionFees=i,k.lastBlockHash=n,k.lastBlockHeight=a,k.nextBlockDifficulty=c,k.lastBlockTimestamp=new Date(o),k.totalDifficulty=BigInt(r),k.errors=h.map((t=>"blockTimestamp"in t?new w(t.message,t.blockHash,t.blockTimestamp):"blockHash"in t?new y(t.message,t.blockHash):new b(t.message,t.transaction,t.lastBlockHash))),k.children=l,k.trackedAccount=u,k.accountLedger=Array.from(f),k.nftLedger=JSON.parse(JSON.stringify(d)),k}toJSON(){return{accounts:this.accounts,nfts:this.nfts,transactionFees:this.transactionFees,lastBlockHash:this.lastBlockHash,lastBlockHeight:this.lastBlockHeight,nextBlockDifficulty:this.nextBlockDifficulty,lastBlockTimestamp:this.lastBlockTimestamp,totalDifficulty:this.totalDifficulty.toString(),errors:this.errors,children:this.children,trackedAccount:this.trackedAccount,accountLedger:this.accountLedger,nftLedger:this.nftLedger}}clone(){return x.coerce(this)}tryTransaction(t){if(!(arguments.length>1&&void 0!==arguments[1]&&arguments[1])&&t.timestamp>this.lastBlockTimestamp)throw new b("Transaction timestamp is newer than block timestamp!",t,this.lastBlockHash);if(t.txData instanceof l){if(!(t.source in this.accounts))throw new b("Account tried to send coins before it existed",t,this.lastBlockHash);if(t.sourceNonce!==this.accounts[t.source].nonce+1)throw new b("Incorrect nonce",t,this.lastBlockHash);if(t.txData.amount+t.transactionFee>this.accounts[t.source].balance)throw new b("Insufficient balance",t,this.lastBlockHash);let e=0;this.accounts[t.source].nonce++,this.accounts[t.source].balance-=t.txData.amount+t.transactionFee,this.trackedAccount===t.source&&(e-=t.txData.amount+t.transactionFee),this.transactionFees+=t.transactionFee,t.txData.destination in this.accounts||(this.accounts[t.txData.destination]=new p),this.accounts[t.txData.destination].balance+=t.txData.amount,this.trackedAccount===t.txData.destination&&(e+=t.txData.amount),this.trackedAccount!==t.source&&this.trackedAccount!==t.txData.destination||this.accountLedger.push({txId:t.txId,delta:e})}else if(t.txData instanceof u){if(t.txData.nftId in this.nfts)throw new b("NFT Mint attempted on already-existing NFT ID",t,this.lastBlockHash);if(t.transactionFee>0){if(!(t.source in this.accounts))throw new b("Account tried to pay NFT Mint txFee before it existed",t,this.lastBlockHash);if(t.sourceNonce!==this.accounts[t.source].nonce+1)throw new b("Incorrect nonce for NFT Mint txFee",t,this.lastBlockHash);if(t.transactionFee>this.accounts[t.source].balance)throw new b("Insufficient balance for NFT Mint txFee",t,this.lastBlockHash)}t.transactionFee>0&&(this.accounts[t.source].nonce++,this.accounts[t.source].balance-=t.transactionFee,this.trackedAccount===t.source&&this.accountLedger.push({txId:t.txId,delta:-t.transactionFee}),this.transactionFees+=t.transactionFee);let e=new B;e.nonce=0,e.owner=t.source,this.nfts[t.txData.nftId]=e,this.nftLedger[t.txData.nftId]=[t.txId]}else if(t.txData instanceof f){let e=t.txData.nftId;if(!(e in this.nfts))throw new b("NFT Transfer attempted on non-existent NFT ID",t,this.lastBlockHash);if(this.nfts[e].owner!==t.source)throw new b("NFT Transfer attempted by non-owner of NFT",t,this.lastBlockHash);if(t.transactionFee>0){if(!(t.source in this.accounts))throw new b("Account tried to pay NFT Mint txFee before it existed",t,this.lastBlockHash);if(t.sourceNonce!==this.accounts[t.source].nonce+1)throw new b("Incorrect nonce for NFT Mint txFee",t,this.lastBlockHash);if(t.transactionFee>this.accounts[t.source].balance)throw new b("Insufficient balance for NFT Mint txFee",t,this.lastBlockHash)}t.transactionFee>0&&(this.accounts[t.source].nonce++,this.accounts[t.source].balance-=t.transactionFee,this.trackedAccount===t.source&&this.accountLedger.push({txId:t.txId,delta:-t.transactionFee}),this.transactionFees+=t.transactionFee),this.nfts[e].nonce++,this.nfts[e].owner=t.txData.destination,this.nftLedger[t.txData.nftId].push(t.txId)}}applyBlock(t){const e=t.hash;let s=this.clone();s.children=[],this.children.includes(e)||this.children.push(e),t.prevHash!==this.lastBlockHash&&s.errors.push(new y("Block does not point at this state's prevHash",e)),t.blockHeight!==this.lastBlockHeight+1&&s.errors.push(new y("Block height is not lastBlockHeight + 1",e)),t.timestamp>new Date(Date.now()+5e3)&&s.errors.push(new w("Block timestamp is from the future!",e,t.timestamp)),0!==t.blockHeight&&t.timestamp<this.lastBlockTimestamp&&s.errors.push(new y("Block timestamp is not greater than last block's timestamp",e)),s.lastBlockHash=e,s.lastBlockHeight=t.blockHeight;let i=0===t.blockHeight?0:Math.max(0,t.timestamp-this.lastBlockTimestamp);if(s.lastBlockTimestamp=t.timestamp,s.totalDifficulty=this.totalDifficulty+g.difficultyMetric(s.lastBlockHash),t.difficulty<this.nextBlockDifficulty&&s.errors.push(new y("Block's target difficulty is too low",e)),0===t.blockHeight)s.nextBlockDifficulty=this.nextBlockDifficulty;else{let t=i/15e3;t=Math.min(2,t);const e=40;s.nextBlockDifficulty=Math.round(this.nextBlockDifficulty*(1+(1-t)/e))}try{t.transactions.forEach((t=>{s.tryTransaction(t)}))}catch(n){s.errors.push(n)}return t.rewardDestination in s.accounts||(s.accounts[t.rewardDestination]=new p),s.accounts[t.rewardDestination].balance+=t.miningReward+s.transactionFees,s.trackedAccount===t.rewardDestination&&s.accountLedger.push({block:e,delta:t.miningReward+s.transactionFees}),s.transactionFees=0,s.errors.length&&console.error("Errors in block "+t.blockHeight+": "+JSON.stringify(s.errors)),s}}class H{constructor(t){this._blocks={},this._anticipatedBlocks={},this._readyBlocks=[],this._bestBlock=null,this._txPool={},this._recentConfirmedTx={},this._txToBlocks={},this._lastMiningRoot=null,this._isCheckpoint=!1,this.minDifficulty=65536,this.genesisDifficulty=2e6,this.myAccount=null,this.myAccount=t}async addBlock(t,e){let s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.minDifficulty;try{let n=t.hash;if(t instanceof g&&await t.isValid(s)&&!(n in this._blocks)){if(this._blocks[n]={block:t,source:e},0===t.blockHeight||t.prevHash in this._blocks&&"state"in this._blocks[t.prevHash]){if(0!==t.blockHeight){const e=this.getState(t.prevHash).errors;for(let s of e)if(s instanceof w&&s.blockTimestamp<=new Date(Date.now()+5e3)){this._readyBlocks=[s.blockHash].concat(this.getChain(t.prevHash,s.blockHash));break}}this._readyBlocks.push(n)}else t.prevHash in this._anticipatedBlocks||(this._anticipatedBlocks[t.prevHash]=[]),this._anticipatedBlocks[t.prevHash].push(n),this._readyBlocks.length&&console.error("Expected _readyBlocks to be empty but there were "+this._readyBlocks.length);for(;this._readyBlocks.length;){var i;let t=this._readyBlocks.shift(),e=this.getBlock(t);if(null!==(i=this._blocks[t])&&void 0!==i&&i.isCheckpoint){console.log("Synced up to checkpoint!"),this._isCheckpoint=!1,delete this._blocks[t].isCheckpoint;continue}if(0===e.blockHeight){const s=new x(this.genesisDifficulty);s.trackedAccount=this.myAccount,this._blocks[t].state=s.applyBlock(e)}else this._blocks[t].state=this._blocks[e.prevHash].state.applyBlock(e);e.transactions.forEach((e=>{const s=e.txId;s in this._txToBlocks||(this._txToBlocks[s]=[]),this._txToBlocks[s].push(t)})),t in this._anticipatedBlocks&&(this._readyBlocks=this._readyBlocks.concat(this._anticipatedBlocks[t]),delete this._anticipatedBlocks[t]);let s=this.getState(t);if(0===s.errors.length){let e=this.getState(this._bestBlock);(null===e||s.totalDifficulty>e.totalDifficulty)&&(this._bestBlock=t)}}return!0}}catch(n){return console.error(n),!1}}restoreCheckpoint(t,e){const s=t.hash;this._bestBlock=s,this._blocks[s]={block:t,state:e,isCheckpoint:!0},this._isCheckpoint=!0,t.prevHash in this._anticipatedBlocks||(this._anticipatedBlocks[t.prevHash]=[]),this._anticipatedBlocks[t.prevHash].push(s)}get isCheckpoint(){return this._isCheckpoint}get bestBlockHash(){return this._bestBlock}getBlock(t){return t in this._blocks?this._blocks[t].block:null}getSource(t){return t in this._blocks?this._blocks[t].source:null}getState(t){return t in this._blocks&&"state"in this._blocks[t]?this._blocks[t].state:null}getChain(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1/0,i=[],n=null!==t&&void 0!==t?t:this.bestBlockHash,a=this.getBlock(n);for(;n!==e&&null!==a&&i.length<s&&(i.unshift(n),0!==a.blockHeight);)n=a.prevHash,a=this.getBlock(n);return i}getCommonParent(t,e){let s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1/0;if(t===e)return t;for(let i=0;i<s;i++){const s=this.getBlock(t);if(!s)return null;const i=s.blockHeight,n=this.getBlock(e);if(!n)return null;const a=n.blockHeight,c=Math.min(i,a);if(i>c&&(t=this.getChain(t,null,1+i-c)[0]),a>c&&(e=this.getChain(e,null,1+a-c)[0]),t===e)return t;t=this.getBlock(t).prevHash,e=this.getBlock(e).prevHash}return null}getConfirmations(t){if(this.getCommonParent(t,this.bestBlockHash,100)===t){const e=this.getBlock(t);return this.getBlock(this.bestBlockHash).blockHeight-e.blockHeight+1}return 0}getBlocksWithTransaction(t){return t in this._txToBlocks?this._txToBlocks[t]:[]}async addTransaction(t){try{if(t instanceof d&&await t.isValid()&&t.timestamp<new Date(Date.now()+3e5)&&Date.now()-t.timestamp<3e5&&!(t.txId in this._txPool)&&!(t.txId in this._recentConfirmedTx))return this._txPool[t.txId]=t,!0}catch(e){return console.error(e),!1}}makeMineableBlock(t,e){var s,i,n,a;let c=null!==(s=this.bestBlockHash)&&void 0!==s?s:"00".repeat(32);if(this._lastMiningRoot!==c){const t=this.getCommonParent(this._lastMiningRoot,c,100);let e=this.getChain(this._lastMiningRoot,t,100),s=this.getChain(c,t,100),i=e.filter(((t,e)=>!s.includes(t)));i.forEach((t=>{this.getBlock(t).transactions.forEach((t=>{this._txPool[t.txId]=t,delete this._recentConfirmedTx[t.txId]}))}));let n=s.filter(((t,s)=>!e.includes(t)));n.forEach((t=>{this.getBlock(t).transactions.forEach((t=>{t.timestamp<new Date(Date.now()+3e5)&&Date.now()-t.timestamp<3e5&&(this._recentConfirmedTx[t.txId]=t),delete this._txPool[t.txId]}))})),this._lastMiningRoot=c}let o=this.getBlock(c),r=null!==(i=this.getState(c))&&void 0!==i?i:new x(this.genesisDifficulty),h=null!==(n=null===o||void 0===o?void 0:o.blockHeight)&&void 0!==n?n:-1,l=new g;l.prevHash=c,l.blockHeight=h+1,l.difficulty=r.nextBlockDifficulty,l.miningReward=t,l.rewardDestination=e;const u=Number(null!==(a=null===o||void 0===o?void 0:o.timestamp)&&void 0!==a?a:Date.now())+1;l.timestamp=new Date(Math.max(u,Date.now()));let f=r.clone(),d=[];for(const k in this._txPool)d.push(k);for(f.lastBlockTimestamp=l.timestamp;;){let t=[];if(d.forEach((e=>{try{f.tryTransaction(this._txPool[e]),t.push(e)}catch(s){if(!(s instanceof b))throw s}})),0===t.length)break;l.transactions=l.transactions.concat(t.map((t=>this._txPool[t]))),d=d.filter(((e,s)=>!t.includes(e)))}return l}}var D=(0,n.Z)("cache");a.Jj(class{constructor(t){Object.defineProperty(this,D,{writable:!0,value:void 0}),(0,i.Z)(this,D)[D]=new H(t)}async addBlock(t,e){let s=g.coerce(t);return await(0,i.Z)(this,D)[D].addBlock(s,e)}async addBlocks(t,e){let s=!1;for(let i of t)s=await this.addBlock(i,e)||s;return s}restoreCheckpoint(t,e){(0,i.Z)(this,D)[D].restoreCheckpoint(g.coerce(t),x.coerce(e))}get isCheckpoint(){return(0,i.Z)(this,D)[D].isCheckpoint}getBlockInfo(t){return{block:(0,i.Z)(this,D)[D].getBlock(t),state:(0,i.Z)(this,D)[D].getState(t),source:(0,i.Z)(this,D)[D].getSource(t)}}getBlocks(t){return t.map(((t,e)=>(0,i.Z)(this,D)[D].getBlock(t)))}getCommonParent(t,e){let s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1/0;return(0,i.Z)(this,D)[D].getCommonParent(t,e,s)}getChain(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1/0;return(0,i.Z)(this,D)[D].getChain(t,e,s)}getConfirmations(t){return(0,i.Z)(this,D)[D].getConfirmations(t)}get bestBlockHash(){return(0,i.Z)(this,D)[D].bestBlockHash}async addTransaction(t){let e=d.coerce(t);return await(0,i.Z)(this,D)[D].addTransaction(e)}getBlocksWithTransaction(t){return(0,i.Z)(this,D)[D].getBlocksWithTransaction(t)}makeMineableBlock(t,e){return(0,i.Z)(this,D)[D].makeMineableBlock(t,e)}})},7420:()=>{}},e={};function s(i){var n=e[i];if(void 0!==n)return n.exports;var a=e[i]={exports:{}};return t[i](a,a.exports,s),a.exports}s.m=t,s.x=()=>{var t=s.O(void 0,[416],(()=>s(2455)));return t=s.O(t)},(()=>{var t=[];s.O=(e,i,n,a)=>{if(!i){var c=1/0;for(l=0;l<t.length;l++){for(var[i,n,a]=t[l],o=!0,r=0;r<i.length;r++)(!1&a||c>=a)&&Object.keys(s.O).every((t=>s.O[t](i[r])))?i.splice(r--,1):(o=!1,a<c&&(c=a));if(o){t.splice(l--,1);var h=n();void 0!==h&&(e=h)}}return e}a=a||0;for(var l=t.length;l>0&&t[l-1][2]>a;l--)t[l]=t[l-1];t[l]=[i,n,a]}})(),s.d=(t,e)=>{for(var i in e)s.o(e,i)&&!s.o(t,i)&&Object.defineProperty(t,i,{enumerable:!0,get:e[i]})},s.f={},s.e=t=>Promise.all(Object.keys(s.f).reduce(((e,i)=>(s.f[i](t,e),e)),[])),s.u=t=>"static/js/"+t+".6bff7d5d.chunk.js",s.miniCssF=t=>{},s.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),s.p="/",(()=>{var t={475:1};s.f.i=(e,i)=>{t[e]||importScripts(s.p+s.u(e))};var e=self.webpackChunkrealbadcoin=self.webpackChunkrealbadcoin||[],i=e.push.bind(e);e.push=e=>{var[n,a,c]=e;for(var o in a)s.o(a,o)&&(s.m[o]=a[o]);for(c&&c(s);n.length;)t[n.pop()]=1;i(e)}})(),(()=>{var t=s.x;s.x=()=>s.e(416).then(t)})();s.x()})();
//# sourceMappingURL=475.6bca30ea.chunk.js.map