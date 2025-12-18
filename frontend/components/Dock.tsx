import React, {
  Children,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from "motion/react";
import { cn } from "@/lib/utils";

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
  isActive?: boolean;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelWidth?: number;
  baseItemSize?: number;
  dockWidth?: number;
  magnification?: number;
  spring?: SpringOptions;
};

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  mouseY: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
  isActive?: boolean;
};

function DockItem({
  children,
  className = "",
  onClick,
  mouseY,
  spring,
  distance,
  magnification,
  baseItemSize,
  isActive,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseY, (val) => {
    const rect =
      ref.current?.getBoundingClientRect() ?? ({
        y: 0,
        height: baseItemSize,
      } as DOMRect);
    return val - rect.y - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center rounded-2xl cursor-pointer transition-all duration-300",
        "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md",
        "border border-white/20 dark:border-white/10",
        "shadow-lg shadow-black/5 dark:shadow-black/20",
        "hover:shadow-xl hover:shadow-primary/20 hover:border-primary/40",
        "hover:from-primary/10 hover:to-primary/5",
        isActive && "border-primary/50 from-primary/20 to-primary/10 shadow-primary/30",
        className
      )}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, (child) =>
        React.isValidElement(child)
          ? cloneElement(
              child as React.ReactElement<{ isHovered?: MotionValue<number> }>,
              { isHovered }
            )
          : child
      )}
      
      {/* Active indicator dot */}
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50"
        />
      )}
    </motion.div>
  );
}

type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

export function DockLabel({ children, className = "", isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -5, scale: 0.95 }}
          animate={{ opacity: 1, x: 12, scale: 1 }}
          exit={{ opacity: 0, x: -5, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "absolute left-full top-1/2 -translate-y-1/2 w-fit whitespace-pre",
            "rounded-xl px-4 py-2 text-sm font-semibold",
            "bg-gradient-to-r from-card to-card/90 backdrop-blur-xl",
            "border border-white/20 dark:border-white/10",
            "shadow-xl shadow-black/10 dark:shadow-black/30",
            "text-foreground",
            className
          )}
          role="tooltip"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DockIcon({
  children,
  className = "",
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-center text-foreground transition-colors", className)}>
      {children}
    </div>
  );
}

export function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelWidth = 72,
  dockWidth = 200,
  baseItemSize = 50,
}: DockProps) {
  const mouseY = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxWidth = useMemo(
    () => Math.max(dockWidth, magnification + magnification / 2 + 4),
    [dockWidth, magnification]
  );

  const widthRow = useTransform(isHovered, [0, 1], [panelWidth, maxWidth]);
  const width = useSpring(widthRow, spring);

  return (
    <motion.div style={{ width }} className="flex items-start justify-start">
      <motion.div
        onMouseMove={(e: React.MouseEvent) => {
          isHovered.set(1);
          mouseY.set(e.pageY);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseY.set(Infinity);
        }}
        className={cn(
          "fixed left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 rounded-3xl p-3 z-50",
          "bg-gradient-to-b from-card/70 via-card/60 to-card/70",
          "backdrop-blur-xl backdrop-saturate-150",
          "border border-white/30 dark:border-white/10",
          "shadow-2xl shadow-black/10 dark:shadow-black/40",
          className
        )}
        style={{ width: panelWidth }}
        role="toolbar"
        aria-label="Application dock"
      >
        {/* Tricolor accent bar */}
        <div className="absolute -top-px left-4 right-4 h-1 rounded-full overflow-hidden flex opacity-80">
          <div className="flex-1 bg-gradient-to-r from-saffron to-saffron/80" />
          <div className="flex-1 bg-gradient-to-r from-white/90 to-white/70" />
          <div className="flex-1 bg-gradient-to-r from-gov-green/80 to-gov-green" />
        </div>

        {/* Logo/Brand area */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-2 shadow-lg shadow-primary/30">
          <span className="text-primary-foreground font-bold text-lg">भ</span>
        </div>

        {/* Separator */}
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseY={mouseY}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            isActive={item.isActive}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}

        {/* Bottom accent */}
        <div className="w-6 h-1 rounded-full bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40 mt-2" />
      </motion.div>
    </motion.div>
  );
}

export default Dock;
