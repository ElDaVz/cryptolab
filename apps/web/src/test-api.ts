// Tests run the same generated WASM as the browser, without duplicating algorithms.
import {readFile} from 'node:fs/promises';
import init,{executeCipher,normalizeAffineKey}from '../../../crates/crypto-wasm/pkg/crypto_wasm';
import {CryptoAdapter}from './adapters/adapter';
export const api=new CryptoAdapter(async()=>{await init({module_or_path:await readFile(new URL('../../../crates/crypto-wasm/pkg/crypto_wasm_bg.wasm',import.meta.url))});return{executeCipher,normalizeAffineKey};});
await api.initialize();
