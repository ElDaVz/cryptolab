export type Direction = 'encrypt' | 'decrypt';
export type Key = { a: number; b: number };
export type PartialKey = { a: number | null; b: number | null };
export type CipherRequest =
  | { algorithm: 'caesar'; operation: Direction; message: string }
  | { algorithm: 'affine'; operation: Direction; message: string; key: Key };
export type Arithmetic =
  | { kind: 'shift'; input: number; shift: number }
  | { kind: 'affineEncrypt'; input: number; multiplier: number; offset: number }
  | { kind: 'affineDecrypt'; input: number; inverse: number; offset: number };
export type CipherStepData = {
  byteIndex: number;
  inputCharacter: string;
  inputValue: number;
  arithmetic: Arithmetic;
  unreduced: number;
  modulus: number;
  outputValue: number;
  outputCharacter: string;
};
export type CipherData = { operation: Direction; output: string; steps: CipherStepData[] };
export type EuclideanStepData = {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
};
export type ExtendedGcdData = { gcd: number; x: number; y: number; steps: EuclideanStepData[] };
export type InverseData = { inverse: number; derivation: ExtendedGcdData };
export type CipherValue =
  | { algorithm: 'caesar'; cipher: CipherData }
  | {
      algorithm: 'affine';
      suppliedKey: Key;
      normalizedKey: Key;
      inverse: InverseData;
      cipher: CipherData;
    };
export type NormalizeKeyValue = { suppliedKey: PartialKey; normalizedKey: PartialKey };
export type ApiError =
  | { code: 'NotReady' }
  | {
      code: 'InvalidRequest';
      field: string;
      reason:
        | 'missing'
        | 'unknownField'
        | 'invalidType'
        | 'unsupportedValue'
        | 'notInteger'
        | 'outOfRange'
        | 'invalidUnicode';
    }
  | { code: 'EmptyMessage' }
  | { code: 'InvalidCharacter'; character: string; byteIndex: number }
  | { code: 'InvalidAffineKey'; suppliedA: number; normalizedA: number; gcd: number }
  | { code: 'InternalError' };
export type Reply<T> = { ok: true; value: T } | { ok: false; error: ApiError };
export interface CryptoApi {
  initialize(): Promise<void>;
  executeCipher(request: CipherRequest): Reply<CipherValue>;
  normalizeAffineKey(request: PartialKey): Reply<NormalizeKeyValue>;
}
