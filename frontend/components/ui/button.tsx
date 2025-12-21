import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
        outline: "",
        secondary: "",
        ghost: "",
        link: "",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Get variant-specific styles
    const getVariantStyles = () => {
      switch (variant) {
        case "default":
          return {
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
          };
        case "destructive":
          return {
            backgroundColor: 'hsl(var(--destructive))',
            color: 'hsl(var(--destructive-foreground))',
          };
        case "outline":
          return {
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'hsl(var(--input))',
            backgroundColor: 'hsl(var(--background))',
          };
        case "secondary":
          return {
            backgroundColor: 'hsl(var(--secondary))',
            color: 'hsl(var(--secondary-foreground))',
          };
        case "ghost":
          return {
            backgroundColor: 'transparent',
          };
        case "link":
          return {
            color: 'hsl(var(--primary))',
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
          };
        default:
          return {};
      }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (props.disabled) return;
      
      switch (variant) {
        case "default":
          e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.9)';
          break;
        case "destructive":
          e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.9)';
          break;
        case "outline":
          e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
          e.currentTarget.style.color = 'hsl(var(--accent-foreground))';
          break;
        case "secondary":
          e.currentTarget.style.backgroundColor = 'hsl(var(--secondary) / 0.8)';
          break;
        case "ghost":
          e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
          e.currentTarget.style.color = 'hsl(var(--accent-foreground))';
          break;
        case "link":
          e.currentTarget.style.textDecoration = 'underline';
          break;
      }
      
      props.onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      const variantStyles = getVariantStyles();
      
      switch (variant) {
        case "default":
          e.currentTarget.style.backgroundColor = 'hsl(var(--primary))';
          break;
        case "destructive":
          e.currentTarget.style.backgroundColor = 'hsl(var(--destructive))';
          break;
        case "outline":
          e.currentTarget.style.backgroundColor = 'hsl(var(--background))';
          e.currentTarget.style.color = '';
          break;
        case "secondary":
          e.currentTarget.style.backgroundColor = 'hsl(var(--secondary))';
          break;
        case "ghost":
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '';
          break;
        case "link":
          // Link maintains underline
          break;
      }
      
      props.onMouseLeave?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
      e.currentTarget.style.outline = 'none';
      e.currentTarget.style.boxShadow = '0 0 0 2px hsl(var(--ring))';
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
      e.currentTarget.style.boxShadow = 'none';
      props.onBlur?.(e);
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{
          ...getVariantStyles(),
          ...style,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };