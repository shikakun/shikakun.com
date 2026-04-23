import { describe, expect, it } from 'vitest';
import { format } from './format';

describe('format', () => {
  it('年月日時刻の場合、英語表記で `{時刻} · {月} {日}, {年}` の形式で返す', () => {
    expect(format('2026-04-23 15:06')).toBe('3:06 PM · Apr 23, 2026');
  });

  it('年月日の場合、英語表記で `{月} {日}, {年}` の形式で返す', () => {
    expect(format('2026-04-23')).toBe('Apr 23, 2026');
  });

  it('年月の場合、英語表記で `{月} {年}` の形式で返す', () => {
    expect(format('2026-04')).toBe('Apr 2026');
  });

  it('年のみの場合、そのまま `{年}` を返す', () => {
    expect(format('2024')).toBe('2024');
  });
});
