import { format } from './format';

type Props = {
  /**
   * 日付または日付と時刻をあらわす文字列。
   * `YYYY`, `YYYY-MM`, `YYYY-MM-DD`, `YYYY-MM-DD HH:MM` のいずれかの形式で指定します。
   */
  date: string;
};

const toDateTimeValue = (date: string): string => {
  const [datePart, timePart] = date.split(' ');
  return timePart ? `${datePart}T${timePart}` : datePart;
};

/**
 * 日付または日付と時刻をあらわす文字列を、英語表記へフォーマットします。
 */
export const FormattedDate = ({ date }: Props) => {
  return <time dateTime={toDateTimeValue(date)}>{format(date)}</time>;
};
