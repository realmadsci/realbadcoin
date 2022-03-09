(()=>{var t={2455:(t,e,s)=>{"use strict";var i=s(6274),n=s(9359),a=s(1555),c=s(8238),r=s(1865),o=s(8677),l=s(8578);class h{constructor(){this.type="coin_transfer",this.destination=null,this.amount=0}static coerce(t){let{type:e,destination:s,amount:i}=t;try{if("coin_transfer"!==e)return null;let t=new h;return t.type=e,t.destination=s,t.amount=i,t}catch{return null}}isValid(){try{return"coin_transfer"===this.type&&32===(0,o.nr)(this.destination).length&&Number.isFinite(this.amount)&&this.amount>0}catch{return!1}}}class u{constructor(){this.type="nft_mint",this.nftData=null,this.nftId=null}hash(){return(0,o.ci)((0,r.J)(JSON.stringify(this.nftData)))}static coerce(t){let{type:e,nftData:s,nftId:i}=t;try{if("nft_mint"!==e)return null;let t=new u;return t.type=e,t.nftData=s,t.nftId=i,t}catch{return null}}isValid(){try{return"nft_mint"===this.type&&32===(0,o.nr)(this.nftId).length&&this.nftId===this.hash()&&null!==this.nftData&&JSON.stringify(this.nftData).length>0}catch{return!1}}}class f{constructor(){this.type="nft_transfer",this.nftId=null,this.nftNonce=0,this.destination=null}static coerce(t){let{type:e,nftId:s,nftNonce:i,destination:n}=t;try{if("nft_transfer"!==e)return null;let t=new f;return t.type=e,t.nftId=s,t.nftNonce=i,t.destination=n,t}catch{return null}}isValid(){try{return"nft_transfer"===this.type&&Number.isInteger(this.nftNonce)&&32===(0,o.nr)(this.nftId).length&&32===(0,o.nr)(this.destination).length}catch{return!1}}}class d{constructor(){this.source=null,this.sourceNonce=0,this.timestamp=null,this.transactionFee=0,this.txData=null,this.txId=null,this.signature=null}hash(){let t=JSON.stringify([this.source,this.sourceNonce,this.timestamp,this.transactionFee,this.txData]);return(0,o.ci)((0,r.J)(t))}static coerce(t){let{source:e,sourceNonce:s,timestamp:i,transactionFee:n,txData:a,txId:c,signature:r}=t;try{let t=new d;return t.source=e,t.sourceNonce=s,t.timestamp=new Date(i),t.transactionFee=n,t.txId=c,t.signature=r,t.txData=h.coerce(a)||u.coerce(a)||f.coerce(a),t}catch{return null}}async isValid(){try{return 32===(0,o.nr)(this.source).length&&Number.isInteger(this.sourceNonce)&&this.timestamp instanceof Date&&!isNaN(this.timestamp.getTime())&&Number.isFinite(this.transactionFee)&&this.transactionFee>=0&&this.txData.isValid()&&32===(0,o.nr)(this.txId).length&&this.hash()===this.txId&&64===(0,o.nr)(this.signature).length&&await c.T(this.signature,this.txId,this.source)}catch{return!1}}async seal(t){this.source=await t.getPubKeyHex(),this.timestamp=new Date,this.txId=this.hash(),this.signature=(0,o.ci)(await t.sign(this.txId))}}class k{constructor(){this.prevHash="00".repeat(32),this.blockHeight=0,this.timestamp=null,this.transactions=[],this.miningReward=100,this.rewardDestination=null,this.difficulty=65536,this.nonce=0}get hash(){let t=JSON.stringify(this);return(0,o.ci)((0,r.J)(t))}static difficultyMetric(t){return(1n<<256n)/(0,l.gO)(t)}isSealed(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:65536,e=Math.max(t,this.difficulty),s=(1n<<256n)/BigInt(e);return(0,l.gO)(this.hash)<s}tryToSeal(t){let e=(1n<<256n)/BigInt(this.difficulty);this.timestamp=new Date;for(let s=0;s<t;s++){let t=this.hash;if((0,l.gO)(t)<e)return this.isSealed(this.difficulty);this.nonce++}return!1}static coerce(t){let{prevHash:e,blockHeight:s,timestamp:i,transactions:n,miningReward:a,rewardDestination:c,difficulty:r,nonce:o}=t;try{let t=new k;return t.prevHash=e,t.blockHeight=s,t.timestamp=new Date(i),t.transactions=n.map((t=>d.coerce(t))),t.miningReward=a,t.rewardDestination=c,t.difficulty=r,t.nonce=o,t}catch(l){return console.error(l),null}}async isValid(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:65536;try{return this.isSealed(t)&&32===(0,o.nr)(this.prevHash).length&&Number.isInteger(this.blockHeight)&&this.blockHeight>=0&&(this.blockHeight>0||this.prevHash==="00".repeat(32))&&this.timestamp instanceof Date&&!isNaN(this.timestamp.getTime())&&Array.isArray(this.transactions)&&async function(t,e){for(let s of t)if(!await e(s))return!1;return!0}(this.transactions,(async t=>t instanceof d&&await t.isValid()))&&Number.isFinite(this.miningReward)&&this.miningReward>=0&&32===(0,o.nr)(this.rewardDestination).length}catch{return!1}}}var g=s(7465);class p{constructor(){this.balance=0,this.nonce=0}static coerce(t){let{balance:e,nonce:s}=t,i=new p;return i.balance=e,i.nonce=s,i}}class y{constructor(){this.owner=null,this.nonce=0}static coerce(t){let{owner:e,nonce:s}=t,i=new y;return i.owner=e,i.nonce=s,i}}class m{constructor(t,e){this.message="",this.transaction=null,this.message=t,this.transaction=e}toString(){return"Bad Transaction:\n"+this.message+"\n"+this.transaction.toString()}}class b{constructor(){this.accounts={},this.nfts={},this.transactionFees=0,this.lastBlockHash="00".repeat(32),this.lastBlockHeight=-1,this.nextBlockDifficulty=null,this.lastBlockTimestamp=null,this.lastRetarget=null,this.totalDifficulty=0n}static coerce(t){let{accounts:e,nfts:s,transactionFees:i,lastBlockHash:n,lastBlockHeight:a,nextBlockDifficulty:c,lastBlockTimestamp:r,lastRetarget:o,totalDifficulty:l}=t,h=new b;return Object.keys(e).forEach((t=>{h.accounts[t]=p.coerce(e[t])})),Object.keys(s).forEach((t=>{h.nfts[t]=y.coerce(s[t])})),h.transactionFees=i,h.lastBlockHash=n,h.lastBlockHeight=a,h.nextBlockDifficulty=c,h.lastBlockTimestamp=r,h.lastRetarget=o,h.totalDifficulty=l,h}clone(){let t=Object.assign({},this);return t.totalDifficulty=(0,l.ow)(t.totalDifficulty),t=b.coerce(JSON.parse(JSON.stringify(t))),t.totalDifficulty=(0,l.gO)(t.totalDifficulty),t}tryTransaction(t){if(t.txData instanceof h){if(!(t.source in this.accounts))throw new m("Account tried to send coins before it existed",t);if(t.sourceNonce!==this.accounts[t.source].nonce+1)throw new m("Incorrect nonce",t);if(t.txData.amount+t.transactionFee>this.accounts[t.source].balance)throw new m("Insufficient balance",t);this.accounts[t.source].nonce++,this.accounts[t.source].balance-=t.txData.amount+t.transactionFee,this.transactionFees+=t.transactionFee,t.txData.destination in this.accounts||(this.accounts[t.txData.destination]=new p),this.accounts[t.txData.destination].balance+=t.txData.amount}else if(t.txData instanceof u){if(t.txData.nftId in this.nfts)throw new m("NFT Mint attempted on already-existing NFT ID",t);if(t.transactionFee>0){if(!(t.source in this.accounts))throw new m("Account tried to pay NFT Mint txFee before it existed",t);if(t.sourceNonce!==this.accounts[t.source].nonce+1)throw new m("Incorrect nonce for NFT Mint txFee",t);if(t.transactionFee>this.accounts[t.source].balance)throw new m("Insufficient balance for NFT Mint txFee",t)}t.transactionFee>0&&(this.accounts[t.source].nonce++,this.accounts[t.source].balance-=t.transactionFee,this.transactionFees+=t.transactionFee);let e=new y;e.nonce=0,e.owner=t.source,this.nfts[t.txData.nftId]=e}else if(t.txData instanceof f){let e=t.txData.nftId;if(!(e in this.nfts))throw new m("NFT Transfer attempted on non-existent NFT ID",t);if(this.nfts[e].owner!==t.source)throw new m("NFT Transfer attempted by non-owner of NFT",t);if(t.txData.nftNonce!==this.nfts[e].nonce+1)throw new m("Incorrect NFT nonce",t);if(t.transactionFee>0){if(!(t.source in this.accounts))throw new m("Account tried to pay NFT Mint txFee before it existed",t);if(t.sourceNonce!==this.accounts[t.source].nonce+1)throw new m("Incorrect nonce for NFT Mint txFee",t);if(t.transactionFee>this.accounts[t.source].balance)throw new m("Insufficient balance for NFT Mint txFee",t)}t.transactionFee>0&&(this.accounts[t.source].nonce++,this.accounts[t.source].balance-=t.transactionFee,this.transactionFees+=t.transactionFee),this.nfts[e].nonce++,this.nfts[e].owner=t.txData.destination}}applyBlock(t){var e,s;let i=this.clone();if(t.prevHash!==this.lastBlockHash)return null;if(t.blockHeight!==this.lastBlockHeight+1)return null;if(t.timestamp>new Date)return null;if(0!==t.blockHeight&&t.timestamp<this.lastBlockTimestamp)return null;if(i.lastBlockHash=t.hash,i.lastBlockHeight=t.blockHeight,i.lastBlockTimestamp=t.timestamp,i.totalDifficulty=this.totalDifficulty+k.difficultyMetric(i.lastBlockHash),t.difficulty<this.nextBlockDifficulty)return null;if(i.nextBlockDifficulty=null!==(e=this.nextBlockDifficulty)&&void 0!==e?e:t.difficulty,i.lastRetarget=null!==(s=this.lastRetarget)&&void 0!==s?s:t.timestamp,(t.blockHeight+1)%10===0){let e=t.timestamp-i.lastRetarget;i.lastRetarget=t.timestamp;let s=e/15e4;console.log("Retargetting difficultyError = "+s),i.nextBlockDifficulty=Math.round(i.nextBlockDifficulty/s)}try{t.transactions.forEach((t=>{i.tryTransaction(t)}))}catch(n){return console.error(n),null}return t.rewardDestination in i.accounts||(i.accounts[t.rewardDestination]=new p),i.accounts[t.rewardDestination].balance+=t.miningReward+i.transactionFees,i.transactionFees=0,i}}class w{constructor(){this._blocks={},this._anticipatedBlocks={},this._readyBlocks=[],this._bestBlock=null,this.minDifficulty=65536,this._updateNotifier=new g.EventEmitter}subscribe(t){this._updateNotifier.addListener("new_block",t)}unsubscribe(t){this._updateNotifier.removeListener("new_block",t)}addBlock(t,e,s){let i=arguments.length>3&&void 0!==arguments[3]?arguments[3]:this.minDifficulty;try{let n=t.hash;if(t instanceof k&&t.isValid(i)&&!(n in this._blocks)){this._blocks[n]={block:t,source:e},0===t.blockHeight||t.prevHash in this._blocks&&"state"in this._blocks[t.prevHash]?this._readyBlocks.push(n):(t.prevHash in this._anticipatedBlocks||(this._anticipatedBlocks[t.prevHash]=[]),this._anticipatedBlocks[t.prevHash].push(n),this._readyBlocks.length&&console.error("Expected _readyBlocks to be empty but there were "+this._readyBlocks.length));for(;this._readyBlocks.length;){let t=this.getBlock(this._readyBlocks.pop()),e=t.hash;0===t.blockHeight?this._blocks[e].state=(new b).applyBlock(t):null===this._blocks[t.prevHash].state?this._blocks[e].state=null:this._blocks[e].state=this._blocks[t.prevHash].state.applyBlock(t),e in this._anticipatedBlocks&&(this._readyBlocks=this._readyBlocks.concat(this._anticipatedBlocks[e]),delete this._anticipatedBlocks[e]);let s=this.getState(e);if(null!==s){let t=this.getState(this._bestBlock);(null===t||s.totalDifficulty>t.totalDifficulty)&&(this._bestBlock=e)}}return this._updateNotifier.emit("new_block",n,s),!0}}catch(n){return console.error(n),!1}}get bestBlockHash(){return this._bestBlock}getBlock(t){return t in this._blocks?this._blocks[t].block:null}getSource(t){return t in this._blocks?this._blocks[t].source:null}getState(t){return t in this._blocks&&"state"in this._blocks[t]?this._blocks[t].state:null}getChain(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,s=[],i=t,n=this.getBlock(i);for(;i!==e&&null!==n&&(s.unshift(i),0!==n.blockHeight);)i=n.prevHash,n=this.getBlock(i);return s}}var B=(0,n.Z)("cache");a.Jj(class{constructor(){Object.defineProperty(this,B,{writable:!0,value:new w})}addBlock(t,e){let s=k.coerce(t);return(0,i.Z)(this,B)[B].addBlock(s,e)}addBlocks(t,e){return t.map(((t,s)=>this.addBlock(t,e)))}getBlockInfo(t){return{block:(0,i.Z)(this,B)[B].getBlock(t),state:(0,i.Z)(this,B)[B].getState(t),source:(0,i.Z)(this,B)[B].getSource(t)}}getBlocks(t){return t.map(((t,e)=>(0,i.Z)(this,B)[B].getBlock(t)))}getChain(t,e){return(0,i.Z)(this,B)[B].getChain(t,e)}get bestBlockHash(){return(0,i.Z)(this,B)[B].bestBlockHash}})},7420:()=>{}},e={};function s(i){var n=e[i];if(void 0!==n)return n.exports;var a=e[i]={exports:{}};return t[i](a,a.exports,s),a.exports}s.m=t,s.x=()=>{var t=s.O(void 0,[974,482],(()=>s(2455)));return t=s.O(t)},(()=>{var t=[];s.O=(e,i,n,a)=>{if(!i){var c=1/0;for(h=0;h<t.length;h++){for(var[i,n,a]=t[h],r=!0,o=0;o<i.length;o++)(!1&a||c>=a)&&Object.keys(s.O).every((t=>s.O[t](i[o])))?i.splice(o--,1):(r=!1,a<c&&(c=a));if(r){t.splice(h--,1);var l=n();void 0!==l&&(e=l)}}return e}a=a||0;for(var h=t.length;h>0&&t[h-1][2]>a;h--)t[h]=t[h-1];t[h]=[i,n,a]}})(),s.d=(t,e)=>{for(var i in e)s.o(e,i)&&!s.o(t,i)&&Object.defineProperty(t,i,{enumerable:!0,get:e[i]})},s.f={},s.e=t=>Promise.all(Object.keys(s.f).reduce(((e,i)=>(s.f[i](t,e),e)),[])),s.u=t=>"static/js/"+t+"."+{482:"d67f4f5e",974:"eeffc38f"}[t]+".chunk.js",s.miniCssF=t=>{},s.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),s.p="/",(()=>{var t={475:1};s.f.i=(e,i)=>{t[e]||importScripts(s.p+s.u(e))};var e=self.webpackChunkrealbadcoin=self.webpackChunkrealbadcoin||[],i=e.push.bind(e);e.push=e=>{var[n,a,c]=e;for(var r in a)s.o(a,r)&&(s.m[r]=a[r]);for(c&&c(s);n.length;)t[n.pop()]=1;i(e)}})(),(()=>{var t=s.x;s.x=()=>Promise.all([s.e(974),s.e(482)]).then(t)})();s.x()})();
//# sourceMappingURL=475.4118094e.chunk.js.map