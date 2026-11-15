import init, {
  executeCipher,
  normalizeAffineKey,
} from '../../../../crates/crypto-wasm/pkg/crypto_wasm';
import wasmURL from '../../../../crates/crypto-wasm/pkg/crypto_wasm_bg.wasm?url';
import { CryptoAdapter } from './adapter';
export const api = new CryptoAdapter(async () => {
  await init({ module_or_path: wasmURL });
  return { executeCipher, normalizeAffineKey };
});
