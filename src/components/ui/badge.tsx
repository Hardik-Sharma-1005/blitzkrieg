import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#f1ece2] text-slate-700",
        blue: "border-[#c9e6ef] bg-[#e8f5f8] text-[#276377]",
        green: "border-[#cde6d5] bg-[#e8f4eb] text-[#286b53]",
        amber: "border-[#f0dfb2] bg-[#faf1d8] text-[#87631d]",
        purple: "border-[#ddd3ef] bg-[#f1ecfa] text-[#64518c]",
        outline: "border-[#e3dccf] bg-[#fffdf8] text-slate-600",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
