import type { KebabCaseAria } from 'aria-attribute-types';
import clsx from 'clsx';
import type { MouseEvent, ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import { capitalize } from '../../utils/capitalize';
import { Interactive } from '../Interactive';
import styles from './Button.module.css';

export type ButtonAppearance = 'text' | 'outlined' | 'tinted' | 'filled';
export type ButtonColor = 'primary' | 'neutral' | 'informative' | 'negative';
export type ButtonSize = 's' | 'm';
export type ButtonShape = 'square' | 'circle' | 'none';
export type ButtonWidth = 'auto' | 'full' | 'half' | 'third';
export type ButtonLayout = 'center' | 'start' | 'space-between';

interface BaseButtonProps extends Omit<KebabCaseAria<'button'>, 'aria-label' | 'aria-disabled'> {
  readonly appearance?: ButtonAppearance;
  readonly color?: ButtonColor;
  readonly disabled?: boolean;
  readonly layout?: ButtonLayout;
  readonly leadingIcon?: ReactNode;
  readonly onClick?: () => void;
  readonly shape?: ButtonShape;
  readonly size?: ButtonSize;
  readonly tabIndex?: number;
  readonly trailingIcon?: ReactNode;
  readonly width?: ButtonWidth;
}

type ButtonContentProps =
  | { readonly icon: ReactNode; readonly 'aria-label': string; readonly children?: ReactNode }
  | { readonly icon: ReactNode; readonly 'aria-label'?: undefined; readonly children: string }
  | { readonly icon?: ReactNode; readonly 'aria-label'?: string; readonly children?: ReactNode };

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
      'aria-label': ariaLabel,
      appearance = 'text',
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
      tabIndex,
      target,
      trailingIcon,
      type = 'button',
      width = 'auto',
      ...ariaProps
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
    // filled は background-color を直接変化させるため、オーバーレイが二重にかからないよう color を渡さない
    const interactiveColor = appearance === 'filled' ? undefined : color;

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
        <Interactive
          as="a"
          ref={ref as Ref<HTMLAnchorElement>}
          color={interactiveColor}
          className={rootClassName}
          href={href}
          target={target}
          rel={rel}
          aria-label={resolvedAriaLabel}
          aria-disabled={disabled || undefined}
          tabIndex={tabIndex}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            if (disabled) {
              event.preventDefault();
              return;
            }
            onClick?.();
          }}
          {...(ariaProps as object)}
        >
          {content}
        </Interactive>
      );
    }

    return (
      <Interactive
        as="button"
        ref={ref as Ref<HTMLButtonElement>}
        color={interactiveColor}
        className={rootClassName}
        type={type}
        aria-label={resolvedAriaLabel}
        disabled={disabled}
        tabIndex={tabIndex}
        onClick={onClick}
        {...(ariaProps as object)}
      >
        {content}
      </Interactive>
    );
  },
);

Button.displayName = 'Button';
