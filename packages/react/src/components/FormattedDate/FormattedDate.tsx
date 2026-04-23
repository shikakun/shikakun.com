import { format } from './format';

type Props = {
  /**
   * 日付または日付と時刻をあらわす文字列。
   * `YYYY`, `YYYY-MM`, `YYYY-MM-DD`, `YYYY-MM-DD HH:MM` のいずれかの形式で指定します。
   */
  date: string;
};

/**
 * 日付または日付と時刻をあらわす文字列を、英語表記へフォーマットします。
 */
export const FormattedDate = ({ date }: Props) => {
  return <time dateTime={date}>{format(date)}</time>;
};
