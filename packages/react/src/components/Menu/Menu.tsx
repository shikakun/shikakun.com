import {
  type FloatingContext,
  FloatingFocusManager,
  FloatingList,
  FloatingPortal,
  flip,
  offset,
  type Placement,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListItem,
  useListNavigation,
  useRole,
  useTransitionStyles,
} from '@floating-ui/react';
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Button, type ButtonProps } from '../Button';
import styles from './Menu.module.css';

interface MenuContextValue {
  open: boolean;
  floatingContext: FloatingContext;
  refs: ReturnType<typeof useFloating>['refs'];
  floatingStyles: CSSProperties;
  isMounted: boolean;
  transitionStyles: CSSProperties;
  getReferenceProps: ReturnType<typeof useInteractions>['getReferenceProps'];
  getFloatingProps: ReturnType<typeof useInteractions>['getFloatingProps'];
  getItemProps: ReturnType<typeof useInteractions>['getItemProps'];
  activeIndex: number | null;
  listRef: RefObject<(HTMLElement | null)[]>;
  closeMenu: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('Menu compound components must be used within <Menu>');
  return ctx;
}

export interface MenuProps {
  readonly children?: ReactNode;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly placement?: Placement;
}

function MenuRoot({
  children,
  open: controlledOpen,
  onOpenChange,
  placement = 'bottom-start',
}: MenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const listRef = useRef<(HTMLElement | null)[]>([]);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: handleOpenChange,
    placement,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: 150,
    initial: { opacity: 0, transform: 'scale(0.95)' },
    open: { opacity: 1, transform: 'scale(1)' },
    close: { opacity: 0, transform: 'scale(0.95)' },
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });
  const listNavigation = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNavigation,
  ]);

  const closeMenu = useCallback(() => handleOpenChange(false), [handleOpenChange]);

  return (
    <MenuContext.Provider
      value={{
        open,
        floatingContext: context,
        refs,
        floatingStyles,
        isMounted,
        transitionStyles,
        getReferenceProps,
        getFloatingProps,
        getItemProps,
        activeIndex,
        listRef,
        closeMenu,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

MenuRoot.displayName = 'Menu';

type MenuTriggerType = 'button';

type MenuTriggerProps = {
  readonly type?: MenuTriggerType;
} & Omit<ButtonProps, 'onClick' | 'href' | 'target' | 'type'>;

function MenuTrigger({ type: _type = 'button', ...buttonProps }: MenuTriggerProps) {
  const { refs, getReferenceProps } = useMenuContext();
  return (
    <Button
      ref={refs.setReference as Ref<HTMLButtonElement>}
      type="button"
      {...buttonProps}
      {...(getReferenceProps() as object)}
    />
  );
}

MenuTrigger.displayName = 'Menu.Trigger';

interface MenuPopupProps {
  readonly children: ReactNode;
}

function MenuPopup({ children }: MenuPopupProps) {
  const {
    floatingContext,
    refs,
    floatingStyles,
    getFloatingProps,
    isMounted,
    transitionStyles,
    listRef,
  } = useMenuContext();

  if (!isMounted) return null;

  return (
    <FloatingPortal>
      <FloatingFocusManager context={floatingContext} modal={false}>
        <div ref={refs.setFloating} style={floatingStyles}>
          <div
            className={styles.popup}
            style={{ ...transitionStyles, transformOrigin: 'center' }}
            {...getFloatingProps()}
          >
            <FloatingList elementsRef={listRef}>
              <ul className={styles.list} role="presentation">
                {children}
              </ul>
            </FloatingList>
          </div>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
}

MenuPopup.displayName = 'Menu.Popup';

type MenuItemButtonProps = {
  readonly href?: never;
  readonly onClick?: () => void;
} & Omit<ButtonProps, 'onClick' | 'href' | 'target' | 'type' | 'appearance'>;

type MenuItemLinkProps = {
  readonly href: string;
  readonly target?: string;
} & Omit<ButtonProps, 'href' | 'target' | 'onClick' | 'type' | 'appearance'>;

export type MenuItemProps = MenuItemButtonProps | MenuItemLinkProps;

function MenuItemButton({ onClick, disabled, ...buttonProps }: MenuItemButtonProps) {
  const { getItemProps, activeIndex, closeMenu } = useMenuContext();
  const { ref, index } = useListItem();
  const isActive = activeIndex === index;
  const tabIndex = activeIndex === null ? (index === 0 ? 0 : -1) : isActive ? 0 : -1;

  return (
    <li className={styles.item} role="presentation">
      <Button
        width="full"
        layout="space-between"
        {...buttonProps}
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        appearance="text"
        shape="none"
        disabled={disabled}
        tabIndex={tabIndex}
        {...(getItemProps({
          onClick: () => {
            if (!disabled) {
              onClick?.();
              closeMenu();
            }
          },
        }) as object)}
      />
    </li>
  );
}

function MenuItemLink({ href, target, disabled, ...buttonProps }: MenuItemLinkProps) {
  const { getItemProps, activeIndex, closeMenu } = useMenuContext();
  const { ref, index } = useListItem();
  const isActive = activeIndex === index;
  const tabIndex = activeIndex === null ? (index === 0 ? 0 : -1) : isActive ? 0 : -1;

  return (
    <li className={styles.item} role="presentation">
      <Button
        width="full"
        layout="space-between"
        {...buttonProps}
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        appearance="text"
        shape="none"
        disabled={disabled}
        tabIndex={tabIndex}
        {...(getItemProps({
          onClick: () => {
            if (!disabled) closeMenu();
          },
        }) as object)}
      />
    </li>
  );
}

MenuItemLink.displayName = 'Menu.ItemLink';

function MenuItemDivider() {
  return (
    <li className={styles.item} role="presentation">
      <hr className={styles.divider} />
    </li>
  );
}

MenuItemDivider.displayName = 'Menu.Divider';

function MenuItem(props: MenuItemProps) {
  if (props.href !== undefined) {
    return <MenuItemLink {...(props as MenuItemLinkProps)} />;
  }
  return <MenuItemButton {...(props as MenuItemButtonProps)} />;
}

MenuItem.displayName = 'Menu.Item';

export const Menu = Object.assign(MenuRoot, {
  Trigger: MenuTrigger,
  Popup: MenuPopup,
  Item: MenuItem,
  Divider: MenuItemDivider,
});
