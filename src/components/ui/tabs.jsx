import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, style, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg p-1",
      className
    )}
    style={{ backgroundColor: "var(--bg-card)", ...style }}
    {...props} />
))
TabsList.displayName = TabsPrimitive.List.displayName

const ACTIVE_STYLE = {
  backgroundColor: "#EEF3F0",
  color: "#3C6E5A",
  border: "2px solid rgba(229, 223, 208, 1)",
};

const TabsTrigger = React.forwardRef(({ className, style, ...props }, ref) => {
  const [active, setActive] = React.useState(false);
  const elRef = React.useRef(null);

  React.useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const check = () => setActive(el.dataset.state === "active");
    check();
    const observer = new MutationObserver(check);
    observer.observe(el, { attributes: true, attributeFilter: ["data-state"] });
    return () => observer.disconnect();
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={(node) => {
        elRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      style={{ color: "var(--text-secondary)", border: "2px solid transparent", ...(active ? ACTIVE_STYLE : {}), ...style }}
      {...props} />
  );
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }