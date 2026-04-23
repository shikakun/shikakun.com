import { format } from './format';

type Props = {
  /**
   * 日付をあらわす文字列。
   * `YYYY` か `YYYY-MM` か `YYYY-MM-DD` の形式で指定します。
   */
  date: string;
};

/**
 * 日付をあらわす文字列を英語表記へフォーマットします。
 */
export const FormattedDate = ({ date }: Props) => {
  return <time dateTime={date}>{format(date)}</time>;
};
