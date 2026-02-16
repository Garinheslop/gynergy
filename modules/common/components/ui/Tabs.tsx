"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useId,
  KeyboardEvent,
  ReactNode,
} from "react";

import { cn } from "@lib/utils/style";

// Types
type TabsVariant = "underline" | "pills" | "enclosed";
type TabsSize = "sm" | "md" | "lg";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: TabsVariant;
  size: TabsSize;
  baseId: string;
  registerTab: (id: string) => void;
  unregisterTab: (id: string) => void;
  tabs: string[];
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs compound components must be used within a Tabs component");
  }
  return context;
}

// Style configurations
const variantStyles: Record<TabsVariant, { list: string; tab: string; activeTab: string }> = {
  underline: {
    list: "border-b border-grey-700",
    tab: "border-b-2 border-transparent -mb-px text-grey-400 hover:text-grey-200 hover:border-grey-500",
    activeTab: "border-action-500 text-white",
  },
  pills: {
    list: "gap-2",
    tab: "rounded-lg text-grey-400 hover:text-grey-200 hover:bg-grey-800",
    activeTab: "bg-action-600 text-white hover:bg-action-600 hover:text-white",
  },
  enclosed: {
    list: "border-b border-grey-700",
    tab: "border border-transparent rounded-t-lg -mb-px text-grey-400 hover:text-grey-200 bg-grey-800/50",
    activeTab: "border-grey-700 border-b-grey-900 bg-grey-900 text-white",
  },
};

const sizeStyles: Record<TabsSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

// Root component
interface TabsProps {
  children: ReactNode;
  defaultTab?: string;
  defaultValue?: string; // Alias for defaultTab
  value?: string;
  onChange?: (tabId: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  className?: string;
}

function TabsRoot({
  children,
  defaultTab,
  defaultValue,
  value,
  onChange,
  variant = "underline",
  size = "md",
  className,
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || defaultValue || "");
  const [tabs, setTabs] = useState<string[]>([]);
  const baseId = useId();

  const activeTab = value !== undefined ? value : internalActiveTab;

  const setActiveTab = useCallback(
    (id: string) => {
      if (value === undefined) {
        setInternalActiveTab(id);
      }
      onChange?.(id);
    },
    [value, onChange]
  );

  const registerTab = useCallback((id: string) => {
    setTabs((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const unregisterTab = useCallback((id: string) => {
    setTabs((prev) => prev.filter((t) => t !== id));
  }, []);

  return (
    <TabsContext.Provider
      value={{
        activeTab,
        setActiveTab,
        variant,
        size,
        baseId,
        registerTab,
        unregisterTab,
        tabs,
      }}
    >
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// Tab list component
interface TabListProps {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

function TabList({ children, className, "aria-label": ariaLabel }: TabListProps) {
  const { variant, tabs, activeTab, setActiveTab } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.indexOf(activeTab);
    let newIndex = currentIndex;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case "ArrowRight":
        e.preventDefault();
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case "Home":
        e.preventDefault();
        newIndex = 0;
        break;
      case "End":
        e.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex && tabs[newIndex]) {
      setActiveTab(tabs[newIndex]);
      // Focus the new tab button
      const tabButtons = listRef.current?.querySelectorAll('[role="tab"]');
      (tabButtons?.[newIndex] as HTMLButtonElement)?.focus();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn("flex", variantStyles[variant].list, className)}
    >
      {children}
    </div>
  );
}

// Individual tab component
interface TabProps {
  children: ReactNode;
  value: string;
  disabled?: boolean;
  icon?: string;
  className?: string;
}

function Tab({ children, value, disabled = false, icon, className }: TabProps) {
  const { activeTab, setActiveTab, variant, size, baseId, registerTab, unregisterTab } =
    useTabsContext();
  const isActive = activeTab === value;

  // Register/unregister tab on mount/unmount
  useState(() => {
    registerTab(value);
    return () => unregisterTab(value);
  });

  return (
    <button
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={cn(
        "focus-visible:ring-action-500 focus-visible:ring-offset-grey-900 inline-flex items-center gap-2 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        sizeStyles[size],
        variantStyles[variant].tab,
        isActive && variantStyles[variant].activeTab,
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {icon && <i className={cn(icon, "text-current")} aria-hidden="true" />}
      {children}
    </button>
  );
}

// Tab panel component
interface TabPanelProps {
  children: ReactNode;
  value: string;
  className?: string;
  forceMount?: boolean;
}

function TabPanel({ children, value, className, forceMount = false }: TabPanelProps) {
  const { activeTab, baseId } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive && !forceMount) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      hidden={!isActive}
      className={cn("focus:outline-none", isActive ? "block" : "hidden", className)}
    >
      {children}
    </div>
  );
}

// Create compound component
const Tabs = Object.assign(TabsRoot, {
  List: TabList,
  Tab: Tab,
  Panel: TabPanel,
});

// Export all components
export { Tabs, TabList, Tab, TabPanel };
