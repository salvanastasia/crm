import type React from "react"
import { cn } from "@/lib/utils"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <path d="M16 2v5h5" />
      <path d="M21 6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11v5" />
    </svg>
  )
}

