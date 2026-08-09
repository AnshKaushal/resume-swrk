"use client"

import {
  CircleCheck,
  LockOpen,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PurchaseInfo } from "@/lib/use-checkout"

export function PurchaseSuccessDialog({
  purchase,
  onClose,
}: {
  purchase: PurchaseInfo
  onClose: () => void
}) {
  const isUnlock = purchase.kind === "unlock"

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-12 items-center justify-center rounded-none border border-emerald-600/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {isUnlock ? (
                <LockOpen className="size-6" />
              ) : (
                <CircleCheck className="size-6" />
              )}
            </span>
            <DialogTitle className="text-base">
              {isUnlock
                ? "Full analysis unlocked!"
                : purchase.planId === "pro"
                  ? "Pro activated. Welcome aboard!"
                  : "Thanks for purchasing!"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {isUnlock
                ? "All sections, scores, and premium fixes for this analysis are now available."
                : purchase.planId === "pro"
                  ? "You now have unlimited analyses and access to all premium features."
                  : "5 analyses have been added to your account. You can start analysing right away."}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} className="gap-2">
            <Sparkles className="size-3.5" />
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
