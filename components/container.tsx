import type { ComponentPropsWithoutRef, ElementType } from "react"

import { cn } from "@/lib/utils"

interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  as?: ElementType
}

export function Container({
  as: Tag = "div",
  className,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    >
      {props.children}
    </Tag>
  )
}
