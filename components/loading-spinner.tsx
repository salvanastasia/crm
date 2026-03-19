export function LoadingSpinner({ size = "medium" }: { size?: "small" | "medium" | "large" }) {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-3",
    large: "h-12 w-12 border-4",
  }

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClasses[size]} rounded-full border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin`}
      ></div>
    </div>
  )
}

