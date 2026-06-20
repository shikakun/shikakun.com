import type { KebabCaseAria } from 'aria-attribute-types';
import clsx from 'clsx';
import type { ChangeEvent, Ref } from 'react';
import { forwardRef, useId } from 'react';
import { Text } from '../Text';
import { getTextFieldClassNames, type TextFieldWidth } from './getTextFieldClassNames';
import styles from './TextField.module.css';

export type { TextFieldWidth };

export type TextFieldType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

export type TextFieldInputMode =
  | 'none'
  | 'text'
  | 'tel'
  | 'url'
  | 'email'
  | 'numeric'
  | 'decimal'
  | 'search';

export type AutocompleteAttributeType =
  | 'additional-name'
  | 'address-level1'
  | 'address-level2'
  | 'address-level3'
  | 'address-level4'
  | 'address-line1'
  | 'address-line2'
  | 'address-line3'
  | 'bday-day'
  | 'bday-month'
  | 'bday-year'
  | 'bday'
  | 'cc-additional-name'
  | 'cc-csc'
  | 'cc-exp-month'
  | 'cc-exp-year'
  | 'cc-exp'
  | 'cc-family-name'
  | 'cc-given-name'
  | 'cc-name'
  | 'cc-number'
  | 'cc-type'
  | 'country-name'
  | 'country'
  | 'current-password'
  | 'current-password webauthn'
  | 'email'
  | 'family-name'
  | 'given-name'
  | 'honorific-prefix'
  | 'honorific-suffix'
  | 'impp'
  | 'language'
  | 'name'
  | 'new-password'
  | 'nickname'
  | 'off'
  | 'on'
  | 'one-time-code'
  | 'organization-title'
  | 'organization'
  | 'photo'
  | 'postal-code'
  | 'sex'
  | 'street-address'
  | 'tel-area-code'
  | 'tel-country-code'
  | 'tel-extension'
  | 'tel-local-prefix'
  | 'tel-local-suffix'
  | 'tel-local'
  | 'tel-national'
  | 'tel'
  | 'transaction-amount'
  | 'transaction-currency'
  | 'url'
  | 'username'
  | 'username webauthn';

interface BaseTextFieldProps
  extends Omit<KebabCaseAria<'textbox'>, 'aria-invalid' | 'aria-required' | 'aria-disabled'> {
  /**
   * ラベル
   * 指定しない場合はaria-labelまたはaria-labelledbyを指定してください
   */
  readonly label?: string;
  /**
   * 入力する内容を説明するテキスト
   */
  readonly description?: string;
  /**
   * エラーメッセージ
   * errorがtrueのときに表示します
   */
  readonly errorMessage?: string;
  readonly error?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly required?: boolean;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readonly autoComplete?: AutocompleteAttributeType;
  readonly inputMode?: TextFieldInputMode;
  readonly id?: string;
  readonly name?: string;
  readonly width?: TextFieldWidth;
}

type SingleLineTextFieldProps = BaseTextFieldProps & {
  readonly type?: TextFieldType;
  readonly rows?: 1;
};

type MultiLineTextFieldProps = BaseTextFieldProps & {
  readonly type?: never;
  readonly rows: number;
};

export type TextFieldProps = SingleLineTextFieldProps | MultiLineTextFieldProps;

export const TextField = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(
  (
    {
      label,
      description,
      errorMessage,
      error = false,
      disabled = false,
      readOnly = false,
      required = false,
      value,
      defaultValue,
      onChange,
      autoComplete,
      inputMode,
      id,
      name,
      width = 'full',
      type = 'text',
      rows,
      'aria-describedby': ariaDescribedby,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      ...ariaProps
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const isMultiLine = rows != null && rows > 1;
    const showError = Boolean(error && errorMessage);
    const hasFieldChrome = label != null || description != null || showError;

    const descriptionId = description != null ? `${inputId}-description` : undefined;
    const errorId = showError ? `${inputId}-error` : undefined;
    const describedBy = clsx(ariaDescribedby, descriptionId, errorId) || undefined;

    const controlClassName = clsx(getTextFieldClassNames({ width, error, isMultiLine }));

    const commonProps = {
      id: inputId,
      name,
      className: controlClassName,
      disabled,
      readOnly,
      required,
      autoComplete,
      inputMode,
      value,
      defaultValue,
      onChange,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': describedBy,
      'aria-invalid': error || undefined,
    };

    const control = isMultiLine ? (
      <textarea
        {...(ariaProps as object)}
        {...commonProps}
        ref={ref as Ref<HTMLTextAreaElement>}
        rows={rows}
      />
    ) : (
      <input
        {...(ariaProps as object)}
        {...commonProps}
        ref={ref as Ref<HTMLInputElement>}
        type={type}
      />
    );

    if (!hasFieldChrome) {
      return control;
    }

    return (
      <div className={styles.field}>
        {label != null && (
          <label htmlFor={inputId} className={styles.label}>
            <Text fontSize="m" lineHeight="dense">
              {label}
            </Text>
            {required && (
              <span className={styles.requiredIcon}>
                <Text fontSize="s" lineHeight="dense" kerning={true}>
                  （必須）
                </Text>
              </span>
            )}
          </label>
        )}
        {control}
        {(showError || description) && (
          <div className={styles.footer}>
            {showError && (
              <Text
                as="p"
                id={errorId}
                role="alert"
                fontSize="s"
                lineHeight="dense"
                className={styles.errorMessage}
              >
                {errorMessage}
              </Text>
            )}
            {description != null && (
              <Text
                as="p"
                id={descriptionId}
                fontSize="s"
                lineHeight="dense"
                className={styles.description}
              >
                {description}
              </Text>
            )}
          </div>
        )}
      </div>
    );
  },
);

TextField.displayName = 'TextField';
