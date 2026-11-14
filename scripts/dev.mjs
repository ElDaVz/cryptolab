import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const v = JSON.parse(readFileSync(path.join(root,'scripts/versions.json')));
const env = { ...process.env, RUSTUP_HOME: `${root}/.tools/rustup`, CARGO_HOME: `${root}/.tools/cargo`, RUSTUP_TOOLCHAIN:v.rust, PLAYWRIGHT_BROWSERS_PATH:`${root}/.tools/browsers`, npm_config_cache:`${root}/.tools/npm-cache`, CARGO_NET_OFFLINE:'true', PATH:`${root}/.tools/bin:${root}/.tools/cargo/bin:${process.env.PATH}` };
function run(command,args=[],options={}) {
  const r=spawnSync(command,args,{cwd:root,env,stdio:'inherit',...options});
  if(r.error || r.status!==0) throw new Error(`${command} failed (${r.error?.message ?? r.status})`);
}
function output(command,args=[]) { const r=spawnSync(command,args,{cwd:root,env,encoding:'utf8'}); if(r.error||r.status!==0) throw new Error(`${command}: ${r.stderr||r.error}`); return r.stdout.trim(); }
function checkNode(){for(const [cmd,want] of [['node',v.node],['npm',v.npm]]){const got=output(cmd,['--version']); if(got!==want)throw new Error(`${cmd}: expected ${want}, got ${got}`);}}
function download(url,dest){run('curl',['--fail','--location','--retry','2',url,'-o',dest]);}
const toolchain=`${env.RUSTUP_HOME}/toolchains/${v.rust}-x86_64-unknown-linux-gnu`;
function readyRust(){if(!existsSync(`${toolchain}/bin/rustc`))throw new Error(`Isolated Rust ${v.rust} missing; run ./scripts/dev setup`);}
const [command,...args]=process.argv.slice(2);
try {
 if(command==='setup'){
  if(process.platform!=='linux'||process.arch!=='x64')throw new Error('Pinned binary setup currently supports Linux x86_64');
  checkNode(); mkdirSync(`${root}/.tools/bin`,{recursive:true}); env.CARGO_NET_OFFLINE='false';
  if(!existsSync(`${env.CARGO_HOME}/bin/rustup`)){download('https://sh.rustup.rs',`${root}/.tools/rustup-init.sh`);run('sh',[`${root}/.tools/rustup-init.sh`,'-y','--no-modify-path','--profile','minimal','--default-toolchain',v.rust,'--target','wasm32-unknown-unknown','--component','rustfmt,clippy']);}
  run('rustup',['toolchain','install',v.rust,'--profile','minimal','--component','rustfmt,clippy','--target','wasm32-unknown-unknown']);
  for(const [name,version,repo] of [['wasm-pack',v.wasmPack,'wasm-pack'],['wasm-bindgen',v.wasmBindgen,'wasm-bindgen']]){
   if(existsSync(`${root}/.tools/bin/${name}`)&&output(name,['--version'])===`${name} ${version}`)continue;
   const folder=`${name}-${name==='wasm-pack'?'v':''}${version}-x86_64-unknown-linux-musl`;
   download(`https://github.com/wasm-bindgen/${repo}/releases/download/${name==='wasm-pack'?'v':''}${version}/${folder}.tar.gz`,`${root}/.tools/${name}.tar.gz`);
   run('tar',['-xzf',`${root}/.tools/${name}.tar.gz`,'-C',`${root}/.tools`]); cpSync(`${root}/.tools/${folder}/${name}`,`${root}/.tools/bin/${name}`);
  }
  run('cargo',['fetch','--locked']);run('npm',['--prefix','apps/web','ci']);
  run(`${root}/apps/web/node_modules/.bin/playwright`,['install','chromium','--only-shell']);
  run('cargo',['test','--workspace','--locked']);
  writeFileSync(`${root}/.tools/probe.rs`,'#[unsafe(no_mangle)] pub extern "C" fn probe() -> i32 { 26 }');
  run('rustc',['--target','wasm32-unknown-unknown','--crate-type','cdylib',`${root}/.tools/probe.rs`,'-o',`${root}/.tools/probe.wasm`,'-C','panic=abort']);
  run('npm',['--prefix','apps/web','run','build']);run(process.execPath,['scripts/browser-doctor.mjs']);
 } else if(command==='doctor'){
  let failed=false;
  for(const [label,check] of [ ['Node/npm',checkNode],['Rust',()=>{readyRust();const got=output(`${toolchain}/bin/rustc`,['--version']);console.log(got);if(!got.startsWith(`rustc ${v.rust} `))throw new Error('version mismatch');run('cargo',['check','--workspace','--locked']);}],['WASM target',()=>{readyRust();if(!output('rustup',['target','list','--installed','--toolchain',v.rust]).includes('wasm32-unknown-unknown'))throw new Error('missing target');}],['wasm-pack',()=>{if(output('wasm-pack',['--version'])!==`wasm-pack ${v.wasmPack}`)throw new Error('version mismatch');}],['wasm-bindgen',()=>{if(output('wasm-bindgen',['--version'])!==`wasm-bindgen ${v.wasmBindgen}`)throw new Error('version mismatch');}],['Chromium/WebGL',()=>run(process.execPath,['scripts/browser-doctor.mjs'])] ]){try{check();console.log(`OK ${label}`);}catch(e){failed=true;console.error(`FAIL ${label}: ${e.message}`);}} if(failed)process.exitCode=1;
 } else if(command==='cargo'){readyRust();run(`${env.CARGO_HOME}/bin/cargo`,args);}
 else if(command==='npm'){checkNode();run('npm',args);}
 else throw new Error('Usage: ./scripts/dev setup | doctor | cargo … | npm …');
} catch(e){ console.error(e.message); process.exitCode=1; }
