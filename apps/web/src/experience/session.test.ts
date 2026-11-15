import { describe, expect, it } from 'vitest';
import { Session } from './session';
import { api } from '../test-api';

function sender(s: Session, message = 'ABC') {
  s.editSender({ message, algorithm: 'affine', a: '5', b: '8' });
  s.executeSender();
}
function candidate(s: Session, a = '7', b = '3') {
  s.editCandidate({ a, b });
  s.tryCandidate();
}

describe('FL · session and exercise', () => {
  it('FL-01/02 intro restores context without changing lab work', () => {
    const s = new Session(api);
    expect(s.intro).toBe(0);
    s.closeIntro();
    sender(s);
    s.navigate('interceptor');
    s.setSource('exercise');
    candidate(s);
    s.hint();
    const before = JSON.stringify(s.project());
    s.repeatIntro();
    s.nextIntro();
    s.closeIntro();
    expect(JSON.stringify(s.project())).toBe(before);
  });
  it('FL-03/04 invalidates on edits and keeps exact supplied keys', () => {
    const s = new Session(api);
    s.closeIntro();
    sender(s);
    expect(s.sender().result?.value.cipher.output).toBe('INS');
    s.editSender({ a: '31', b: '34' });
    expect(s.sender().result).toBeNull();
    s.executeSender();
    expect(s.sender().result?.value).toMatchObject({
      suppliedKey: { a: 31, b: 34 },
      normalizedKey: { a: 5, b: 8 },
    });
    s.editSender({ a: '2', message: '' });
    s.executeSender();
    expect(s.sender().error).toMatchObject({ code: 'InvalidAffineKey' });
    expect(s.sender().result).toBeNull();
  });
  it('FL-05 snapshots survive drafts, decryptions and errors; even identical encryption invalidates candidate', () => {
    const s = new Session(api);
    s.closeIntro();
    expect(s.interceptor().ciphertext).toBeNull();
    sender(s);
    s.navigate('interceptor');
    s.editCandidate({ a: '5', b: '8' });
    s.tryCandidate();
    expect(s.interceptor().candidate).toBe('ABC');
    s.navigate('sender');
    s.editSender({ message: 'INS', operation: 'decrypt' });
    s.executeSender();
    expect(s.interceptor().ciphertext).toBe('INS');
    expect(s.interceptor().candidate).toBe('ABC');
    s.editSender({ message: 'ABC', operation: 'encrypt' });
    s.executeSender();
    expect(s.interceptor().candidate).toBeNull();
    expect(s.interceptor().key).toEqual({ a: '5', b: '8' });
  });
  it('FL-06/07 candidates are isolated per source and have no automatic correctness signal', () => {
    const s = new Session(api);
    s.closeIntro();
    sender(s);
    s.navigate('interceptor');
    expect(s.interceptor().key).toEqual({ a: '', b: '' });
    candidate(s, '5', '8');
    s.setSource('exercise');
    expect(s.interceptor().key).toEqual({ a: '', b: '' });
    candidate(s, '7', '4');
    expect(s.interceptor().candidate).toBe('WLNWLGPPDELPYWZDOTDNZD');
    s.setSource('session');
    expect(s.interceptor().candidate).toBe('ABC');
    s.setSource('exercise');
    expect(s.interceptor().candidate).toBe('WLNWLGPPDELPYWZDOTDNZD');
  });
  it('FL-08/09 correct and equivalent candidates require explicit submission', () => {
    for (const [a, b] of [
      ['7', '3'],
      ['33', '29'],
    ]) {
      const s = new Session(api);
      s.closeIntro();
      s.navigate('interceptor');
      s.setSource('exercise');
      candidate(s, a, b);
      expect(s.interceptor().candidate).toBe('LACLAVEESTAENLOSDISCOS');
      expect(s.interceptor().status).toBe('Sin resolver');
      s.submit();
      expect(s.interceptor().status).toBe('Resuelto');
      expect(s.solution()).not.toBeNull();
    }
  });
  it('FL-09 editing forbids stale submission and incorrect feedback discloses no solution', () => {
    const s = new Session(api);
    s.closeIntro();
    s.setSource('exercise');
    candidate(s, '7', '4');
    s.submit();
    expect(s.interceptor().status).toBe('Sin resolver');
    expect(s.interceptor().feedback).toBe('La clave enviada no coincide. Puedes seguir probando.');
    s.editCandidate({ b: '3' });
    expect(s.interceptor().canSubmit).toBe(false);
    s.submit();
    expect(s.interceptor().status).toBe('Sin resolver');
  });
  it('FL-10/11 reveal is terminal until reset; reset leaves sender intact', () => {
    const s = new Session(api);
    s.closeIntro();
    sender(s);
    s.setSource('exercise');
    s.hint();
    expect(s.interceptor().hint).toContain('a=7');
    s.reveal();
    candidate(s);
    s.submit();
    expect(s.interceptor().status).toBe('Revelado');
    s.openSolution();
    s.resetExercise();
    expect(s.solution()).toBeNull();
    expect(s.internal().result).toBeNull();
    expect(s.sender().result?.value.cipher.output).toBe('INS');
    expect(s.interceptor().hint).toBeNull();
    expect(new Session(api).intro).toBe(0);
  });
  it('DE-03/04 key syntax precedes UI length; no truncation or normalization', () => {
    const s = new Session(api);
    s.closeIntro();
    for (const a of ['', '1.5', 'NaN', '2147483648']) {
      s.editSender({ algorithm: 'affine', a, message: 'A'.repeat(257) });
      s.executeSender();
      expect(s.sender().error).toMatchObject({ code: 'InputError', field: 'a' });
    }
    s.editSender({ algorithm: 'caesar', message: 'A'.repeat(256) });
    s.executeSender();
    expect(s.sender().result?.value.cipher.output).toHaveLength(256);
    s.editSender({ message: 'A'.repeat(257) });
    s.executeSender();
    expect(s.sender().error).toMatchObject({ code: 'InputError', field: 'message' });
    s.editSender({ message: 'AB🦀' });
    s.executeSender();
    expect(s.sender().error).toMatchObject({
      code: 'InvalidCharacter',
      character: '🦀',
      byteIndex: 2,
    });
  });
});
