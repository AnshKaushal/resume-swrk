"use client"

import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  href?: string
}

/**
 * Theme-aware logo.
 * - Light / dark variants are swapped with the Tailwind `.dark` class to
 *   avoid hydration mismatch and theme flash.
 */
export function Logo({ className, href }: LogoProps) {
  const content = (
    <>
      <Image
        src="/logo-dark.svg"
        alt="SWRK - AI Resume Optimizer"
        width={130}
        height={38}
        priority
        unoptimized
        className="h-8 w-auto dark:hidden"
      />
      <Image
        src="/logo-light.svg"
        alt="SWRK - AI Resume Optimizer"
        width={130}
        height={38}
        priority
        unoptimized
        className="hidden h-8 w-auto dark:block"
      />
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cn("flex items-center", className)}>
        {content}
      </Link>
    )
  }

  return <div className={cn("flex items-center", className)}>{content}</div>
}
