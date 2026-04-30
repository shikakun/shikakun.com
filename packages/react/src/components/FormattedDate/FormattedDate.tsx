import { formatDate } from '../../utils/formatDate';

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
  const formatted = formatDate(date);
  if (!formatted) {
    return null;
  }
  return <time dateTime={toDateTimeValue(date)}>{formatted}</time>;
};
