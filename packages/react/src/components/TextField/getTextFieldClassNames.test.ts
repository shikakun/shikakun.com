import { describe, expect, it } from 'vitest';
import { getTextFieldClassNames } from './getTextFieldClassNames';
import styles from './TextField.module.css';

describe('getTextFieldClassNames', () => {
  it('常に control クラスを含む', () => {
    expect(getTextFieldClassNames({ width: 'full', error: false, isMultiLine: false })).toContain(
      styles.control,
    );
  });

  it('width に応じたクラスを含む', () => {
    expect(getTextFieldClassNames({ width: 'full', error: false, isMultiLine: false })).toContain(
      styles.widthFull,
    );
    expect(getTextFieldClassNames({ width: 'half', error: false, isMultiLine: false })).toContain(
      styles.widthHalf,
    );
    expect(getTextFieldClassNames({ width: 'third', error: false, isMultiLine: false })).toContain(
      styles.widthThird,
    );
  });

  it('error が true のとき error クラスを含む', () => {
    expect(getTextFieldClassNames({ width: 'full', error: true, isMultiLine: false })).toContain(
      styles.error,
    );
  });

  it('error が false のとき error クラスを含まない', () => {
    expect(
      getTextFieldClassNames({ width: 'full', error: false, isMultiLine: false }),
    ).not.toContain(styles.error);
  });

  it('isMultiLine が true のとき multiLine クラスを含む', () => {
    expect(getTextFieldClassNames({ width: 'full', error: false, isMultiLine: true })).toContain(
      styles.multiLine,
    );
  });

  it('isMultiLine が false のとき multiLine クラスを含まない', () => {
    expect(
      getTextFieldClassNames({ width: 'full', error: false, isMultiLine: false }),
    ).not.toContain(styles.multiLine);
  });
});
