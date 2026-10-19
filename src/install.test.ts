import { describe, expect, it } from 'vitest';
import { isIos, isIosSafari, type InstallEnv } from './install';

const env = (userAgent: string, maxTouchPoints = 0): InstallEnv => ({ userAgent, maxTouchPoints, standalone: false });

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

describe('iOS detection', () => {
  it('detects iPhone in Safari and in Chrome', () => {
    expect(isIos(env(IPHONE_SAFARI))).toBe(true);
    expect(isIos(env(IPHONE_CHROME))).toBe(true);
    expect(isIosSafari(env(IPHONE_SAFARI))).toBe(true);
    expect(isIosSafari(env(IPHONE_CHROME))).toBe(false);
  });

  it('does not treat Android or a desktop Mac as iOS', () => {
    expect(isIos(env(ANDROID_CHROME))).toBe(false);
    expect(isIos(env(MAC_SAFARI, 0))).toBe(false);
  });

  it('detects iPadOS that reports itself as a Mac with touch', () => {
    expect(isIos(env(MAC_SAFARI, 5))).toBe(true);
  });
});
