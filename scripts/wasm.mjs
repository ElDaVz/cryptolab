import { spawnSync } from 'node:child_process';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../',import.meta.url));
const v=JSON.parse(readFileSync(`${root}/scripts/versions.json`));
const sysroot=`${root}/.tools/rustup/toolchains/${v.rust}-x86_64-unknown-linux-gnu`;
if(!existsSync(`${sysroot}/lib/rustlib/wasm32-unknown-unknown/lib`)||!existsSync(`${root}/.tools/bin/wasm-bindgen`)){
 console.error('Project WASM tools missing. Run ./scripts/dev setup first.');process.exit(1);
}
const r=spawnSync(`${root}/.tools/bin/wasm-pack`,['build','crates/crypto-wasm','--target','web','--out-dir','pkg','--out-name','crypto_wasm','--mode','no-install','--no-opt',process.argv[2]==='release'?'--release':'--dev','--locked','--offline'],{cwd:root,env:process.env,stdio:'inherit'});
if(r.error)console.error(r.error.message);process.exit(r.error?1:r.status??1);
