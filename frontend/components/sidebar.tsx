"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX, IconDatabase } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import MilvusManager from "./MilvusManager";
import { useAuth } from "@/lib/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      <TooltipProvider delayDuration={0}>
        {children}
      </TooltipProvider>
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  const { token, isAdmin } = useAuth();
  const [showMilvusManager, setShowMilvusManager] = useState(false);

  return (
    <>
      <motion.div
        className={cn(
          "h-full hidden md:flex md:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
          className
        )}
        animate={{
          width: animate ? (open ? "16rem" : "3rem") : "16rem",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {/* Tricolor top bar */}
        <div className="h-1 tricolor-bar" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 p-2 border-b border-sidebar-border">
          <motion.div
            animate={{
              opacity: animate ? (open ? 1 : 0) : 1,
              display: animate ? (open ? "flex" : "none") : "flex",
            }}
            className="flex items-center gap-2 px-2"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">भ</span>
            </div>
            <span className="font-semibold text-sidebar-foreground whitespace-nowrap">RAG Portal</span>
          </motion.div>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 min-h-0 overflow-auto p-2">
          <div className="flex flex-col gap-1">
            {children as React.ReactNode}
          </div>
        </nav>

        {/* Admin-only Database Manager Button - Fixed at bottom */}
        {isAdmin && (
          <div className="p-2 border-t border-sidebar-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => setShowMilvusManager(true)}
                  className={cn(
                    "w-full gap-2 h-8 text-sm transition-all",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "text-purple-700 dark:text-purple-300",
                    open ? "justify-start px-2" : "justify-center p-2"
                  )}
                >
                  <IconDatabase className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                  <motion.span
                    animate={{
                      display: animate ? (open ? "inline-block" : "none") : "inline-block",
                      opacity: animate ? (open ? 1 : 0) : 1,
                    }}
                    className="font-medium truncate"
                  >
                    Database Manager
                  </motion.span>
                </Button>
              </TooltipTrigger>
              {!open && (
                <TooltipContent side="right" className="font-medium">
                  Database Manager
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}
      </motion.div>

      {/* Milvus Manager Modal */}
      {showMilvusManager && token && (
        <MilvusManager
          authToken={token}
          onClose={() => setShowMilvusManager(false)}
        />
      )}
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  const { token, isAdmin } = useAuth();
  const [showMilvusManager, setShowMilvusManager] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      {/* Mobile header */}
      <div
        className={cn(
          "h-14 px-4 flex flex-row md:hidden items-center justify-between bg-sidebar text-sidebar-foreground border-b border-sidebar-border"
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">भ</span>
          </div>
          <span className="font-semibold text-sidebar-foreground">RAG Portal</span>
        </div>
        <IconMenu2
          className="text-sidebar-foreground cursor-pointer"
          onClick={() => setOpen(!open)}
        />
      </div>

      {/* Mobile sheet sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className={cn(
            "w-72 bg-sidebar text-sidebar-foreground p-0 border-sidebar-border",
            "[&>button]:hidden",
            className
          )}
        >
          <div className="flex h-full flex-col">
            {/* Tricolor top bar */}
            <div className="h-1 tricolor-bar" />
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">भ</span>
                </div>
                <span className="font-semibold text-sidebar-foreground">RAG Portal</span>
              </div>
              <IconX
                className="text-sidebar-foreground cursor-pointer"
                onClick={() => setOpen(false)}
              />
            </div>

            {/* Main navigation */}
            <nav className="flex-1 min-h-0 overflow-auto p-2">
              <div className="flex flex-col gap-1">
                {children}
              </div>
            </nav>

            {/* Admin-only Database Manager Button - Mobile */}
            {isAdmin && (
              <div className="p-2 border-t border-sidebar-border">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowMilvusManager(true);
                    setOpen(false);
                  }}
                  className="w-full justify-start gap-2 h-8 text-sm px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-purple-700 dark:text-purple-300"
                >
                  <IconDatabase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium">
                    Database Manager
                  </span>
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Milvus Manager Modal - Mobile */}
      {showMilvusManager && token && (
        <MilvusManager
          authToken={token}
          onClose={() => setShowMilvusManager(false)}
        />
      )}
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();

  const handleClick = (e: React.MouseEvent) => {
    if (link.onClick) {
      e.preventDefault();
      link.onClick();
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={link.href}
          onClick={handleClick}
          className={cn(
            "flex items-center gap-2 h-8 text-sm rounded-md transition-all",
            "text-sidebar-foreground outline-none ring-sidebar-ring",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground",
            open ? "justify-start px-2" : "justify-center p-2",
            className
          )}
          {...props}
        >
          <span className="shrink-0 [&>svg]:size-4">{link.icon}</span>

          <motion.span
            animate={{
              display: animate ? (open ? "inline-block" : "none") : "inline-block",
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
            className="truncate whitespace-nowrap"
          >
            {link.label}
          </motion.span>
        </a>
      </TooltipTrigger>
      {!open && (
        <TooltipContent side="right" className="font-medium">
          {link.label}
        </TooltipContent>
      )}
    </Tooltip>
  );
};