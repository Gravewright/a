// AGPL-3.0-only. Off-main-thread physics; the worker never chooses game results.
import {simulate} from './physics.js';
self.onmessage=({data})=>{
 try{self.postMessage({id:data.id,result:simulate(data.dice,data.width,data.height,data.seed)});}
 catch(error){self.postMessage({id:data.id,error:error.message});}
};
