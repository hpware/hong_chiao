"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
  onToggle?: () => void;
  size?: "icon" | "icon-sm" | "sm";
};

export function ThemeToggle({
  className,
  showLabel = false,
  onToggle,
  size,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "切換為淺色模式" : "切換為深色模式";
  const Icon = isDark ? Sun : Moon;
  const buttonSize = size ?? (showLabel ? "sm" : "icon");

  const button = (
    <Button
      type="button"
      variant="ghost"
      size={buttonSize}
      aria-label={label}
      className={cn(
        "border border-border/70 bg-muted/35 text-foreground hover:bg-muted",
        showLabel && "w-full justify-start gap-2 text-sm",
        className,
      )}
      onClick={() => {
        toggleTheme();
        onToggle?.();
      }}
    >
      <Icon className={showLabel ? "size-4" : "size-4.5"} />
      {showLabel ? (
        <span className="group-data-[collapsible=icon]:hidden">
          {isDark ? "淺色模式" : "深色模式"}
        </span>
      ) : null}
    </Button>
  );

  if (showLabel) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
