import * as React from "react"
import { cn } from "@/lib/utils"

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  currentStep: number
}

export function Steps({ currentStep, className, ...props }: StepsProps) {
  const childrenArray = React.Children.toArray(props.children)
  const steps = childrenArray.filter((child) => React.isValidElement(child) && child.type === Step)

  return (
    <div className={cn("flex items-center", className)} {...props}>
      {React.Children.map(steps, (step, index) => {
        if (!React.isValidElement(step)) return null

        return React.cloneElement(step, {
          stepNumber: index,
          isActive: currentStep === index,
          isCompleted: currentStep > index,
          isLast: index === steps.length - 1,
        })
      })}
    </div>
  )
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  stepNumber?: number
  isActive?: boolean
  isCompleted?: boolean
  isLast?: boolean
}

export function Step({
  title,
  stepNumber = 0,
  isActive = false,
  isCompleted = false,
  isLast = false,
  className,
  ...props
}: StepProps) {
  return (
    <div className={cn("flex items-center", className)} {...props}>
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
            isActive
              ? "border-primary bg-primary text-primary-foreground"
              : isCompleted
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground text-muted-foreground",
          )}
        >
          {isCompleted ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            stepNumber + 1
          )}
        </div>
        <span
          className={cn(
            "mt-2 text-xs",
            isActive || isCompleted ? "text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          {title}
        </span>
      </div>
      {!isLast && <div className={cn("h-[2px] w-10 flex-1 mx-2", isCompleted ? "bg-primary" : "bg-muted")} />}
    </div>
  )
}

