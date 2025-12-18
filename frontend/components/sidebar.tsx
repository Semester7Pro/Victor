"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX, IconDatabase } from "@tabler/icons-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import MilvusManager from "./MilvusManager";
import { useAuth } from "@/lib/auth-context";

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
      {children}
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
          "h-full hidden md:flex md:flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          className
        )}
        animate={{
          width: animate ? (open ? "256px" : "64px") : "256px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {/* Tricolor top bar */}
        <div className="h-1 tricolor-bar" />

        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-sidebar-border">
          <motion.div
            animate={{
              opacity: animate ? (open ? 1 : 0) : 1,
              display: animate ? (open ? "flex" : "none") : "flex",
            }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">भ</span>
            </div>
            <span className="font-semibold text-sidebar-foreground whitespace-nowrap">RAG Portal</span>
          </motion.div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="h-8 w-8 hover:bg-primary/10 shrink-0"
          >
            {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {children as React.ReactNode}
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
                    "w-full gap-3 h-11 px-3 transition-all duration-200",
                    "hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400",
                    open ? "justify-start" : "justify-center px-2"
                  )}
                >
                  <IconDatabase className="h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400" />
                  <motion.span
                    animate={{
                      display: animate ? (open ? "inline-block" : "none") : "inline-block",
                      opacity: animate ? (open ? 1 : 0) : 1,
                    }}
                    className="text-purple-700 dark:text-purple-300 font-medium truncate"
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

  return (
    <>
      <div
        className={cn(
          "h-14 px-4 flex flex-row md:hidden items-center justify-between bg-sidebar border-b border-sidebar-border"
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
        
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-sidebar z-[100] flex flex-col",
                className
              )}
            >
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
                  onClick={() => setOpen(!open)}
                />
              </div>

              {/* Main navigation */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {children}
              </nav>

              {/* Admin-only Database Manager Button - Mobile */}
              {isAdmin && (
                <div className="p-4 border-t border-sidebar-border">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowMilvusManager(true);
                      setOpen(false);
                    }}
                    className="w-full justify-start gap-3 h-11 px-3 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    <IconDatabase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-purple-700 dark:text-purple-300 font-medium">
                      Database Manager
                    </span>
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
            "flex items-center gap-3 h-11 px-3 transition-all duration-200 rounded-md",
            "hover:bg-primary/10 hover:text-primary",
            open ? "justify-start" : "justify-center px-2",
            className
          )}
          {...props}
        >
          <span className="shrink-0">{link.icon}</span>

          <motion.span
            animate={{
              display: animate ? (open ? "inline-block" : "none") : "inline-block",
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
            className="text-sidebar-foreground group-hover:text-primary text-sm truncate whitespace-nowrap"
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