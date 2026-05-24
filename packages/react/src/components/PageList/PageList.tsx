import { FormattedDate } from '../FormattedDate';
import { Text } from '../Text';
import styles from './PageList.module.css';

export type PageListItem = {
  href: string;
  title: string;
  date?: string;
};

export type PageListProps = {
  items: PageListItem[];
  titleLineClamp?: number | false;
};

export const PageList = ({ items, titleLineClamp = false }: PageListProps) => (
  <ul className={styles.list}>
    {items.map((item) => (
      <li key={item.href} className={styles.item}>
        <a href={item.href} className={styles.link}>
          <span className={styles.title}>
            <Text fontSize="m" lineHeight="normal" lineClamp={titleLineClamp}>
              {item.title}
            </Text>
          </span>
          {item.date && (
            <>
              <span className={styles.leader} aria-hidden="true" />
              <span className={styles.date}>
                <Text fontSize="s" lineHeight="dense">
                  <FormattedDate date={item.date} />
                </Text>
              </span>
            </>
          )}
        </a>
      </li>
    ))}
  </ul>
);
