import clsx from 'clsx';
import type { MouseEvent, ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import { capitalize } from '../../utils/capitalize';
import styles from './Button.module.css';

export type ButtonAppearance = 'text' | 'outlined' | 'tinted' | 'filled';
export type ButtonColor = 'primary' | 'neutral' | 'informative' | 'negative';
export type ButtonSize = 's' | 'm';
export type ButtonShape = 'square' | 'circle';
export type ButtonWidth = 'auto' | 'full' | 'half' | 'third';
export type ButtonLayout = 'center' | 'start' | 'space-between';

interface BaseButtonProps {
  readonly appearance?: ButtonAppearance;
  readonly color?: ButtonColor;
  readonly disabled?: boolean;
  readonly layout?: ButtonLayout;
  readonly leadingIcon?: ReactNode;
  readonly onClick?: () => void;
  readonly shape?: ButtonShape;
  readonly size?: ButtonSize;
  readonly trailingIcon?: ReactNode;
  readonly width?: ButtonWidth;
}

type ButtonContentProps =
  | { readonly icon: ReactNode; readonly ariaLabel: string; readonly children?: ReactNode }
  | { readonly icon: ReactNode; readonly ariaLabel?: undefined; readonly children: string }
  | { readonly icon?: undefined; readonly ariaLabel?: string; readonly children?: ReactNode };

type ButtonElementProps =
  | { readonly href: string; readonly target?: string; readonly type?: never }
  | {
      readonly href?: undefined;
      readonly target?: never;
      readonly type?: 'button' | 'submit' | 'reset';
    };

export type ButtonProps = BaseButtonProps & ButtonContentProps & ButtonElementProps;

const layoutClassMap = {
  center: 'LayoutCenter',
  start: 'LayoutStart',
  'space-between': 'LayoutSpaceBetween',
} as const satisfies Record<ButtonLayout, string>;

const cls = (key: string) => styles[key as keyof typeof styles] ?? '';

export const Button = forwardRef<HTMLAnchorElement | HTMLButtonElement, ButtonProps>(
  (
    {
      appearance = 'text',
      ariaLabel,
      children,
      color = 'neutral',
      disabled = false,
      href,
      icon,
      layout = 'center',
      leadingIcon,
      onClick,
      shape = 'square',
      size = 'm',
      target,
      trailingIcon,
      type = 'button',
      width = 'auto',
    },
    ref,
  ) => {
    const rootClassName = clsx(
      styles.root,
      cls(`appearance${capitalize(appearance)}Color${capitalize(color)}`),
      cls(`size${capitalize(size)}`),
      cls(`shape${capitalize(shape)}`),
      cls(`width${capitalize(width)}`),
      layout === 'center' && styles.layoutCenter,
      !icon && !leadingIcon ? styles.withoutLeadingIcon : null,
      !icon && !trailingIcon ? styles.withoutTrailingIcon : null,
      disabled && styles.disabled,
    );

    const bodyClassName = clsx(styles.body, cls(`body${layoutClassMap[layout]}`));
    const visualClassName = styles.visual;

    const resolvedAriaLabel =
      ariaLabel ?? (icon && typeof children === 'string' ? children : undefined);

    const content = icon ? (
      <span className={visualClassName}>{icon}</span>
    ) : (
      <>
        <span className={bodyClassName}>
          {leadingIcon ? <span className={visualClassName}>{leadingIcon}</span> : null}
          <span className={styles.label}>{children}</span>
        </span>
        {trailingIcon ? <span className={visualClassName}>{trailingIcon}</span> : null}
      </>
    );

    if (href !== undefined) {
      const rel = target === '_blank' ? 'noopener noreferrer' : undefined;
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          className={rootClassName}
          href={href}
          target={target}
          rel={rel}
          aria-label={resolvedAriaLabel}
          aria-disabled={disabled || undefined}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            if (disabled) {
              event.preventDefault();
              return;
            }
            onClick?.();
          }}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        className={rootClassName}
        type={type}
        aria-label={resolvedAriaLabel}
        disabled={disabled}
        onClick={onClick}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = 'Button';
