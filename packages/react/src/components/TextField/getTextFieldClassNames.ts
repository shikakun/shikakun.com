import { capitalize } from '../../utils/capitalize';
import styles from './TextField.module.css';

export type TextFieldWidth = 'full' | 'half' | 'third';

const cls = (key: string) => styles[key as keyof typeof styles] ?? '';

export const getTextFieldClassNames = ({
  width,
  error,
  isMultiLine,
}: {
  readonly width: TextFieldWidth;
  readonly error: boolean;
  readonly isMultiLine: boolean;
}): string[] =>
  [
    styles.control,
    cls(`width${capitalize(width)}`),
    error ? styles.error : '',
    isMultiLine ? styles.multiLine : '',
  ].filter(Boolean) as string[];
