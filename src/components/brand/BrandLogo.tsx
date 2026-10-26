import { useTheme } from "@/components/layout/SidebarContext";

type BrandLogoProps = {
  className?: string;
  markOnly?: boolean;
};

export function BrandLogo({ className = "", markOnly = false }: BrandLogoProps) {
  const { theme } = useTheme();
  return (
    <img
      src={markOnly ? "/blitzkrieg-bolt.svg" : `/blitzkrieg-wordmark-${theme}.svg`}
      alt={markOnly ? "blitzkrieg bolt mark" : "blitzkrieg"}
      className={className}
    />
  );
}
