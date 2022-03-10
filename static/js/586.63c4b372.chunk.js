(()=>{var t={6713:(t,e,i)=>{"use strict";function n(t,e){if(!Object.prototype.hasOwnProperty.call(t,e))throw new TypeError("attempted to use private field on non-instance");return t}var s=0;function a(t){return"__private_"+s+++"_"+t}var c=i(1555),r=i(8238),o=i(1865),l=i(8677);function h(t){if(t<0)throw RangeError("a should be a non-negative integer. Negative values are not supported");return t.toString(16)}function u(t){return BigInt("0x"+t)}class f{constructor(){this.type="coin_transfer",this.destination=null,this.amount=0}static coerce(t){let{type:e,destination:i,amount:n}=t;try{if("coin_transfer"!==e)return null;let t=new f;return t.type=e,t.destination=i,t.amount=n,t}catch{return null}}isValid(){try{return"coin_transfer"===this.type&&32===(0,l.nr)(this.destination).length&&Number.isFinite(this.amount)&&this.amount>0}catch{return!1}}}class d{constructor(){this.type="nft_mint",this.nftData=null,this.nftId=null}hash(){return(0,l.ci)((0,o.J)(JSON.stringify(this.nftData)))}static coerce(t){let{type:e,nftData:i,nftId:n}=t;try{if("nft_mint"!==e)return null;let t=new d;return t.type=e,t.nftData=i,t.nftId=n,t}catch{return null}}isValid(){try{return"nft_mint"===this.type&&32===(0,l.nr)(this.nftId).length&&this.nftId===this.hash()&&null!==this.nftData&&JSON.stringify(this.nftData).length>0}catch{return!1}}}class k{constructor(){this.type="nft_transfer",this.nftId=null,this.nftNonce=0,this.destination=null}static coerce(t){let{type:e,nftId:i,nftNonce:n,destination:s}=t;try{if("nft_transfer"!==e)return null;let t=new k;return t.type=e,t.nftId=i,t.nftNonce=n,t.destination=s,t}catch{return null}}isValid(){try{return"nft_transfer"===this.type&&Number.isInteger(this.nftNonce)&&32===(0,l.nr)(this.nftId).length&&32===(0,l.nr)(this.destination).length}catch{return!1}}}class p{constructor(){this.source=null,this.sourceNonce=0,this.timestamp=null,this.transactionFee=0,this.txData=null,this.txId=null,this.signature=null}hash(){let t=JSON.stringify([this.source,this.sourceNonce,this.timestamp,this.transactionFee,this.txData]);return(0,l.ci)((0,o.J)(t))}static coerce(t){let{source:e,sourceNonce:i,timestamp:n,transactionFee:s,txData:a,txId:c,signature:r}=t;try{let t=new p;return t.source=e,t.sourceNonce=i,t.timestamp=new Date(n),t.transactionFee=s,t.txId=c,t.signature=r,t.txData=f.coerce(a)||d.coerce(a)||k.coerce(a),t}catch{return null}}async isValid(){try{return 32===(0,l.nr)(this.source).length&&Number.isInteger(this.sourceNonce)&&this.timestamp instanceof Date&&!isNaN(this.timestamp.getTime())&&Number.isFinite(this.transactionFee)&&this.transactionFee>=0&&this.txData.isValid()&&32===(0,l.nr)(this.txId).length&&this.hash()===this.txId&&64===(0,l.nr)(this.signature).length&&await r.T(this.signature,this.txId,this.source)}catch{return!1}}async seal(t){this.source=await t.getPubKeyHex(),this.timestamp=new Date,this.txId=this.hash(),this.signature=(0,l.ci)(await t.sign(this.txId))}}class m{constructor(){this.prevHash="00".repeat(32),this.blockHeight=0,this.timestamp=null,this.transactions=[],this.miningReward=100,this.rewardDestination=null,this.difficulty=65536,this.nonce=0}get hash(){let t=JSON.stringify(this);return(0,l.ci)((0,o.J)(t))}static difficultyMetric(t){return(1n<<256n)/u(t)}isSealed(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:65536,e=Math.max(t,this.difficulty),i=(1n<<256n)/BigInt(e);return u(this.hash)<i}tryToSeal(t){var e;let i=(1n<<256n)/BigInt(this.difficulty);this.timestamp=new Date(Math.max(null!==(e=this.timestamp)&&void 0!==e?e:Date.now(),Date.now()));for(let n=0;n<t;n++){if(u(this.hash)<i)return this.isSealed(this.difficulty);this.nonce++}return!1}static coerce(t){let{prevHash:e,blockHeight:i,timestamp:n,transactions:s,miningReward:a,rewardDestination:c,difficulty:r,nonce:o}=t;try{let t=new m;return t.prevHash=e,t.blockHeight=i,t.timestamp=new Date(n),t.transactions=s.map((t=>p.coerce(t))),t.miningReward=a,t.rewardDestination=c,t.difficulty=r,t.nonce=o,t}catch(l){return console.error(l),null}}async isValid(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:65536;try{return this.isSealed(t)&&32===(0,l.nr)(this.prevHash).length&&Number.isInteger(this.blockHeight)&&this.blockHeight>=0&&(this.blockHeight>0||this.prevHash==="00".repeat(32))&&this.timestamp instanceof Date&&!isNaN(this.timestamp.getTime())&&Array.isArray(this.transactions)&&await async function(t,e){for(let i of t)if(!await e(i))return!1;return!0}(this.transactions,(async t=>t instanceof p&&await t.isValid()))&&Number.isFinite(this.miningReward)&&this.miningReward>=0&&32===(0,l.nr)(this.rewardDestination).length}catch{return!1}}}class g{constructor(){this.balance=0,this.nonce=0}static coerce(t){let{balance:e,nonce:i}=t,n=new g;return n.balance=e,n.nonce=i,n}}class y{constructor(){this.owner=null,this.nonce=0}static coerce(t){let{owner:e,nonce:i}=t,n=new y;return n.owner=e,n.nonce=i,n}}class w{constructor(t,e){this.message="",this.transaction=null,this.message=t,this.transaction=e}toString(){return"Bad Transaction:\n"+this.message+"\n"+this.transaction.toString()}}class b{constructor(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:2e6;this.accounts={},this.nfts={},this.transactionFees=0,this.lastBlockHash="00".repeat(32),this.lastBlockHeight=-1,this.nextBlockDifficulty=null,this.lastBlockTimestamp=null,this.totalDifficulty=0n,this.nextBlockDifficulty=t}static coerce(t){let{accounts:e,nfts:i,transactionFees:n,lastBlockHash:s,lastBlockHeight:a,nextBlockDifficulty:c,lastBlockTimestamp:r,totalDifficulty:o}=t,l=new b;return Object.keys(e).forEach((t=>{l.accounts[t]=g.coerce(e[t])})),Object.keys(i).forEach((t=>{l.nfts[t]=y.coerce(i[t])})),l.transactionFees=n,l.lastBlockHash=s,l.lastBlockHeight=a,l.nextBlockDifficulty=c,l.lastBlockTimestamp=r,l.totalDifficulty=o,l}clone(){let t=Object.assign({},this);return t.totalDifficulty=h(t.totalDifficulty),t=b.coerce(JSON.parse(JSON.stringify(t))),t.totalDifficulty=u(t.totalDifficulty),t}tryTransaction(t){if(t.txData instanceof f){if(!(t.source in this.accounts))throw new w("Account tried to send coins before it existed",t);if(t.sourceNonce!==this.accounts[t.source].nonce+1)throw new w("Incorrect nonce",t);if(t.txData.amount+t.transactionFee>this.accounts[t.source].balance)throw new w("Insufficient balance",t);this.accounts[t.source].nonce++,this.accounts[t.source].balance-=t.txData.amount+t.transactionFee,this.transactionFees+=t.transactionFee,t.txData.destination in this.accounts||(this.accounts[t.txData.destination]=new g),this.accounts[t.txData.destination].balance+=t.txData.amount}else if(t.txData instanceof d){if(t.txData.nftId in this.nfts)throw new w("NFT Mint attempted on already-existing NFT ID",t);if(t.transactionFee>0){if(!(t.source in this.accounts))throw new w("Account tried to pay NFT Mint txFee before it existed",t);if(t.sourceNonce!==this.accounts[t.source].nonce+1)throw new w("Incorrect nonce for NFT Mint txFee",t);if(t.transactionFee>this.accounts[t.source].balance)throw new w("Insufficient balance for NFT Mint txFee",t)}t.transactionFee>0&&(this.accounts[t.source].nonce++,this.accounts[t.source].balance-=t.transactionFee,this.transactionFees+=t.transactionFee);let e=new y;e.nonce=0,e.owner=t.source,this.nfts[t.txData.nftId]=e}else if(t.txData instanceof k){let e=t.txData.nftId;if(!(e in this.nfts))throw new w("NFT Transfer attempted on non-existent NFT ID",t);if(this.nfts[e].owner!==t.source)throw new w("NFT Transfer attempted by non-owner of NFT",t);if(t.txData.nftNonce!==this.nfts[e].nonce+1)throw new w("Incorrect NFT nonce",t);if(t.transactionFee>0){if(!(t.source in this.accounts))throw new w("Account tried to pay NFT Mint txFee before it existed",t);if(t.sourceNonce!==this.accounts[t.source].nonce+1)throw new w("Incorrect nonce for NFT Mint txFee",t);if(t.transactionFee>this.accounts[t.source].balance)throw new w("Insufficient balance for NFT Mint txFee",t)}t.transactionFee>0&&(this.accounts[t.source].nonce++,this.accounts[t.source].balance-=t.transactionFee,this.transactionFees+=t.transactionFee),this.nfts[e].nonce++,this.nfts[e].owner=t.txData.destination}}applyBlock(t){let e=this.clone();if(t.prevHash!==this.lastBlockHash)return null;if(t.blockHeight!==this.lastBlockHeight+1)return null;if(t.timestamp>Date.now()+5e3)return null;if(0!==t.blockHeight&&t.timestamp<this.lastBlockTimestamp)return null;e.lastBlockHash=t.hash,e.lastBlockHeight=t.blockHeight;let i=0===t.blockHeight?0:t.timestamp-this.lastBlockTimestamp;if(e.lastBlockTimestamp=t.timestamp,e.totalDifficulty=this.totalDifficulty+m.difficultyMetric(e.lastBlockHash),t.difficulty<this.nextBlockDifficulty)return null;if(0===t.blockHeight)e.nextBlockDifficulty=this.nextBlockDifficulty;else{let t=i/15e3;t=Math.min(2,t);const n=40;e.nextBlockDifficulty=Math.round(this.nextBlockDifficulty*(1+(1-t)/n))}try{t.transactions.forEach((t=>{e.tryTransaction(t)}))}catch(n){return console.error(n),null}return t.rewardDestination in e.accounts||(e.accounts[t.rewardDestination]=new g),e.accounts[t.rewardDestination].balance+=t.miningReward+e.transactionFees,e.transactionFees=0,e}}class B{constructor(){this._blocks={},this._anticipatedBlocks={},this._readyBlocks=[],this._bestBlock=null,this._txPool={},this._recentConfirmedTx={},this.minDifficulty=65536,this.genesisDifficulty=2e6}async addBlock(t,e){let i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.minDifficulty;try{let n=t.hash;if(t instanceof m&&await t.isValid(i)&&!(n in this._blocks)){this._blocks[n]={block:t,source:e},0===t.blockHeight||t.prevHash in this._blocks&&"state"in this._blocks[t.prevHash]?this._readyBlocks.push(n):(t.prevHash in this._anticipatedBlocks||(this._anticipatedBlocks[t.prevHash]=[]),this._anticipatedBlocks[t.prevHash].push(n),this._readyBlocks.length&&console.error("Expected _readyBlocks to be empty but there were "+this._readyBlocks.length));for(;this._readyBlocks.length;){let t=this.getBlock(this._readyBlocks.pop()),e=t.hash;0===t.blockHeight?this._blocks[e].state=new b(this.genesisDifficulty).applyBlock(t):null===this._blocks[t.prevHash].state?this._blocks[e].state=null:this._blocks[e].state=this._blocks[t.prevHash].state.applyBlock(t),e in this._anticipatedBlocks&&(this._readyBlocks=this._readyBlocks.concat(this._anticipatedBlocks[e]),delete this._anticipatedBlocks[e]);let i=this.getState(e);if(null!==i){let t=this.getState(this._bestBlock);(null===t||i.totalDifficulty>t.totalDifficulty)&&this._updateBestBlock(e)}}return!0}}catch(n){return console.error(n),!1}}_updateBestBlock(t){let e=this._bestBlock;this._bestBlock=t;let i=this.getChain(e),n=this.getChain(t);i.filter(((t,e)=>!n.includes(t))).forEach((t=>{this.getBlock(t).transactions.forEach((t=>{this._txPool[t.txId]=t,delete this._recentConfirmedTx[t.txId]}))})),n.filter(((t,e)=>!i.includes(t))).forEach((t=>{this.getBlock(t).transactions.forEach((t=>{t.timestamp<Date.now()&&Date.now()-t.timestamp<6e5&&(this._recentConfirmedTx[t.txId]=t),delete this._txPool[t.txId]}))}))}get bestBlockHash(){return this._bestBlock}getBlock(t){return t in this._blocks?this._blocks[t].block:null}getSource(t){return t in this._blocks?this._blocks[t].source:null}getState(t){return t in this._blocks&&"state"in this._blocks[t]?this._blocks[t].state:null}getChain(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,i=[],n=null!==t&&void 0!==t?t:this.bestBlockHash,s=this.getBlock(n);for(;n!==e&&null!==s&&(i.unshift(n),0!==s.blockHeight);)n=s.prevHash,s=this.getBlock(n);return i}async addTransaction(t){try{if(t instanceof p&&await t.isValid()&&t.timestamp<Date.now()+5e3&&Date.now()-t.timestamp<6e5&&!(t.txId in this._txPool)&&!(t.txId in this._recentConfirmedTx))return this._txPool[t.txId]=t,!0}catch(e){return console.error(e),!1}}makeMineableBlock(t,e){var i,n,s,a;let c=null!==(i=this.bestBlockHash)&&void 0!==i?i:"00".repeat(32),r=this.getBlock(c),o=null!==(n=this.getState(c))&&void 0!==n?n:new b(this.genesisDifficulty),l=null!==(s=null===r||void 0===r?void 0:r.blockHeight)&&void 0!==s?s:-1,h=new m;h.prevHash=c,h.blockHeight=l+1,h.difficulty=o.nextBlockDifficulty,h.miningReward=t,h.rewardDestination=e,h.timestamp=new Date(Number(null!==(a=null===r||void 0===r?void 0:r.timestamp)&&void 0!==a?a:Date.now())+1);let u=o.clone(),f=[];for(const d in this._txPool)f.push(d);for(;;){let t=[];if(f.forEach((e=>{try{u.tryTransaction(this._txPool[e]),t.push(e)}catch(i){if(!(i instanceof w))throw i}})),0===t.length)break;h.transactions=h.transactions.concat(t.map((t=>this._txPool[t]))),f=f.filter(((e,i)=>!t.includes(e)))}return h}}var x=a("cache");c.Jj(class{constructor(){Object.defineProperty(this,x,{writable:!0,value:new B})}async addBlock(t,e){let i=m.coerce(t);return await n(this,x)[x].addBlock(i,e)}async addBlocks(t,e){let i=!0;for(let n of t)i=i&&await this.addBlock(n,e);return i}getBlockInfo(t){return{block:n(this,x)[x].getBlock(t),state:n(this,x)[x].getState(t),source:n(this,x)[x].getSource(t)}}getBlocks(t){return t.map(((t,e)=>n(this,x)[x].getBlock(t)))}getChain(t,e){return n(this,x)[x].getChain(t,e)}get bestBlockHash(){return n(this,x)[x].bestBlockHash}async addTransaction(t){let e=p.coerce(t);return await n(this,x)[x].addTransaction(e)}makeMineableBlock(t,e){return n(this,x)[x].makeMineableBlock(t,e)}})},7420:()=>{}},e={};function i(n){var s=e[n];if(void 0!==s)return s.exports;var a=e[n]={exports:{}};return t[n](a,a.exports,i),a.exports}i.m=t,i.x=()=>{var t=i.O(void 0,[974],(()=>i(6713)));return t=i.O(t)},(()=>{var t=[];i.O=(e,n,s,a)=>{if(!n){var c=1/0;for(h=0;h<t.length;h++){for(var[n,s,a]=t[h],r=!0,o=0;o<n.length;o++)(!1&a||c>=a)&&Object.keys(i.O).every((t=>i.O[t](n[o])))?n.splice(o--,1):(r=!1,a<c&&(c=a));if(r){t.splice(h--,1);var l=s();void 0!==l&&(e=l)}}return e}a=a||0;for(var h=t.length;h>0&&t[h-1][2]>a;h--)t[h]=t[h-1];t[h]=[n,s,a]}})(),i.d=(t,e)=>{for(var n in e)i.o(e,n)&&!i.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},i.f={},i.e=t=>Promise.all(Object.keys(i.f).reduce(((e,n)=>(i.f[n](t,e),e)),[])),i.u=t=>"static/js/"+t+".eeffc38f.chunk.js",i.miniCssF=t=>{},i.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),i.p="/",(()=>{var t={586:1};i.f.i=(e,n)=>{t[e]||importScripts(i.p+i.u(e))};var e=self.webpackChunkrealbadcoin=self.webpackChunkrealbadcoin||[],n=e.push.bind(e);e.push=e=>{var[s,a,c]=e;for(var r in a)i.o(a,r)&&(i.m[r]=a[r]);for(c&&c(i);s.length;)t[s.pop()]=1;n(e)}})(),(()=>{var t=i.x;i.x=()=>i.e(974).then(t)})();i.x()})();
//# sourceMappingURL=586.63c4b372.chunk.js.map