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
  readonly ariaLabel?: string;
  readonly children?: ReactNode;
  readonly color?: ButtonColor;
  readonly disabled?: boolean;
  readonly icon?: ReactNode;
  readonly layout?: ButtonLayout;
  readonly leadingIcon?: ReactNode;
  readonly onClick?: () => void;
  readonly shape?: ButtonShape;
  readonly size?: ButtonSize;
  readonly trailingIcon?: ReactNode;
  readonly width?: ButtonWidth;
}

interface AnchorButtonProps extends BaseButtonProps {
  readonly href: string;
  readonly target?: string;
  readonly type?: never;
}

interface NativeButtonProps extends BaseButtonProps {
  readonly href?: never;
  readonly target?: never;
  readonly type?: 'button' | 'submit' | 'reset';
}

export type ButtonProps = AnchorButtonProps | NativeButtonProps;

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
      cls(`appearance${capitalize(appearance)}`),
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
    const mediaClassName = clsx(styles.media, cls(`mediaSize${capitalize(size)}`));

    const resolvedAriaLabel =
      ariaLabel ?? (icon && typeof children === 'string' ? children : undefined);

    const content = icon ? (
      <span className={mediaClassName}>{icon}</span>
    ) : (
      <>
        <span className={bodyClassName}>
          {leadingIcon ? <span className={mediaClassName}>{leadingIcon}</span> : null}
          <span className={styles.label}>{children}</span>
        </span>
        {trailingIcon ? <span className={mediaClassName}>{trailingIcon}</span> : null}
      </>
    );

    if (href !== undefined) {
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          className={rootClassName}
          href={href}
          target={target}
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
