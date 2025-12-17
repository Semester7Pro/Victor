"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX, IconDatabase } from "@tabler/icons-react";
import MilvusManager from "./MilvusManager";
import { useAuth } from "@/lib/auth-context";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void; // ✅ Added onClick support
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
  const { token, isAdmin } = useAuth(); // ✅ Get auth context
  const [showMilvusManager, setShowMilvusManager] = useState(false); // ✅ State for modal

  return (
    <>
      <motion.div
        className={cn(
          "h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] shrink-0 relative",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "60px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children as React.ReactNode}

        {/* ✅ Admin-only Database Manager Button - Fixed at bottom */}
        {isAdmin && (
          <div className="mt-auto pt-4 border-t border-neutral-300 dark:border-neutral-700">
            <button
              onClick={() => setShowMilvusManager(true)}
              className={cn(
                "flex items-center justify-start gap-2 group/sidebar py-2 w-full hover:bg-purple-500/10 dark:hover:bg-purple-500/20 rounded-lg px-2 transition-colors"
              )}
              title="Milvus Database Manager (Admin)"
            >
              <IconDatabase className="text-purple-600 dark:text-purple-400 shrink-0 w-5 h-5" />
              <motion.span
                animate={{
                  display: animate ? (open ? "inline-block" : "none") : "inline-block",
                  opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className="text-purple-700 dark:text-purple-300 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 font-medium"
              >
                Database Manager
              </motion.span>
            </button>
          </div>
        )}
      </motion.div>

      {/* ✅ Milvus Manager Modal */}
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
  const { token, isAdmin } = useAuth(); // ✅ Get auth context
  const [showMilvusManager, setShowMilvusManager] = useState(false); // ✅ State for modal

  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-neutral-800 dark:text-neutral-200"
            onClick={() => setOpen(!open)}
          />
        </div>
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
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              <div className="flex-1">{children}</div>

              {/* ✅ Admin-only Database Manager Button - Mobile */}
              {isAdmin && (
                <div className="pt-4 border-t border-neutral-300 dark:border-neutral-700">
                  <button
                    onClick={() => {
                      setShowMilvusManager(true);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 w-full py-3 px-4 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 rounded-lg transition-colors"
                  >
                    <IconDatabase className="text-purple-600 dark:text-purple-400 w-6 h-6" />
                    <span className="text-purple-700 dark:text-purple-300 text-base font-medium">
                      Database Manager
                    </span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ✅ Milvus Manager Modal - Mobile */}
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

  // ✅ Handle both href and onClick
  const handleClick = (e: React.MouseEvent) => {
    if (link.onClick) {
      e.preventDefault();
      link.onClick();
    }
  };

  return (
    <a
      href={link.href}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </a>
  );
};
