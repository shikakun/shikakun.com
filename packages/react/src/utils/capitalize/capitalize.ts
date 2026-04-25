/**
 * 文字列の先頭の1文字目を大文字にします。
 */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
