import { format } from './format';

type Props = {
  date: string;
};

export const FormattedDate = ({ date }: Props) => {
  return <time dateTime={date}>{format(date)}</time>;
};
