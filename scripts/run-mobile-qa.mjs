import { spawn, spawnSync } from 'node:child_process';

const port='4173';
const base=`http://127.0.0.1:${port}`;
const server=spawn('python3',['-m','http.server',port,'--directory','dist'],{stdio:['ignore','ignore','inherit']});

async function waitForServer(){
  for(let attempt=0;attempt<30;attempt++){
    try{const response=await fetch(`${base}/news/`);if(response.ok)return}catch{}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw new Error('Mobile QA server did not become ready.');
}

const tests=['scripts/browser-qa.mjs','scripts/browser-qa-crossword-ux.mjs','scripts/browser-qa-home-motion.mjs','scripts/browser-qa-stabilization.mjs'];
try{
  await waitForServer();
  for(const test of tests){
    const run=spawnSync(process.execPath,[test],{stdio:'inherit',env:{...process.env,FMB_QA_BASE_URL:base}});
    if(run.status!==0)process.exitCode=run.status||1;
    if(process.exitCode)break;
  }
}finally{
  server.kill('SIGTERM');
}
if(process.exitCode)process.exit(process.exitCode);
console.log('All FMB mobile browser QA suites passed.');
