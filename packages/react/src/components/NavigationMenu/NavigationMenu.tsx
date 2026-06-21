import { useCallback, useEffect, useRef, useState } from 'react';
import { LuEllipsis } from 'react-icons/lu';
import { Button } from '../Button';
import { Menu } from '../Menu';
import styles from './NavigationMenu.module.css';

export type NavigationMenuItem = {
  href: string;
  label: string;
  target?: string;
  isCurrent?: boolean;
};

export type NavigationMenuProps = {
  items: NavigationMenuItem[];
};

export const NavigationMenu = ({ items }: NavigationMenuProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const measureItemRefs = useRef<(HTMLElement | null)[]>([]);
  const measureTriggerRef = useRef<HTMLElement | null>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  const compute = useCallback(() => {
    const container = containerRef.current;
    const ghost = ghostRef.current;
    if (!container || !ghost) return;

    const containerWidth = container.offsetWidth;
    const triggerWidth = measureTriggerRef.current?.offsetWidth ?? 0;
    const gap = parseFloat(window.getComputedStyle(ghost).columnGap) || 0;

    const itemWidths = Array.from(
      { length: items.length },
      (_, i) => measureItemRefs.current[i]?.offsetWidth ?? 0,
    );

    const cumWidths: number[] = [];
    let total = 0;
    for (let i = 0; i < itemWidths.length; i++) {
      total += (i > 0 ? gap : 0) + itemWidths[i];
      cumWidths.push(total);
    }

    if (items.length === 0 || cumWidths[cumWidths.length - 1] <= containerWidth) {
      setVisibleCount(items.length);
      return;
    }

    for (let n = items.length - 1; n >= 0; n--) {
      const widthBeforeN = n > 0 ? cumWidths[n - 1] : 0;
      const widthWithTrigger = widthBeforeN + (n > 0 ? gap : 0) + triggerWidth;
      if (widthWithTrigger <= containerWidth) {
        setVisibleCount(n);
        return;
      }
    }

    setVisibleCount(0);
  }, [items]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(compute);
    observer.observe(container);
    compute();
    return () => observer.disconnect();
  }, [compute]);

  const isMeasured = visibleCount !== null;
  const visibleItems = isMeasured ? items.slice(0, visibleCount) : items;
  const hiddenItems = isMeasured ? items.slice(visibleCount) : [];
  const hasHidden = hiddenItems.length > 0;

  return (
    <div ref={containerRef} className={styles.root} data-measured={isMeasured || undefined}>
      <div ref={ghostRef} aria-hidden="true" inert className={styles.ghost}>
        {items.map((item, i) => (
          <span
            key={item.href}
            ref={(el) => {
              measureItemRefs.current[i] = el;
            }}
          >
            <Button href={item.href}>{item.label}</Button>
          </span>
        ))}
        <span ref={measureTriggerRef}>
          <Button icon={<LuEllipsis size={18} />} aria-label="もっと見る" />
        </span>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(({ href, label, target, isCurrent }) => (
          <li key={href}>
            <Button
              href={href}
              target={target}
              appearance={isCurrent ? 'tinted' : 'text'}
              color="primary"
              aria-current={isCurrent ? 'page' : undefined}
            >
              {label}
            </Button>
          </li>
        ))}
        {hasHidden && (
          <li>
            <Menu placement="bottom-end">
              <Menu.Trigger icon={<LuEllipsis size={18} />} aria-label="もっと見る" />
              <Menu.Popup>
                {hiddenItems.map(({ href, label, target, isCurrent }) => (
                  <Menu.Item
                    key={href}
                    href={href}
                    target={target}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {label}
                  </Menu.Item>
                ))}
              </Menu.Popup>
            </Menu>
          </li>
        )}
      </ul>
    </div>
  );
};

NavigationMenu.displayName = 'NavigationMenu';
