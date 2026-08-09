"use client"

import { useSyncExternalStore } from "react"
import { clearFixesCache } from "@/lib/fix-cache"

export const ANALYSIS_STORAGE_KEY = "resume-analysis"
export const ANALYSIS_CHANGE_EVENT = "resume-analysis-change"
export const PENDING_KEY = "resume-pending-analysis"

export type AnalysisData = import("@/lib/analyse").AnalyseResponse

/**
 * Single shared analysis store. Every page (analyse, result, fix, analyses)
 * must read/write through this module so the in-memory snapshot can never go
 * stale across page mounts.
 *
 * A previous bug had each page keeping its own copy of this module with its own
 * module-level `cachedSnapshot`. A stale truthy snapshot survived unmounts, so
 * after localStorage was cleared the /analyse page still "saw" the old result,
 * auto-redirected to /analyse/result, which read empty storage and rendered
 * "No analysis found" - and every "Analyse a resume" click looped back.
 */
let version = 0
let cachedSnapshot: AnalysisData | null | undefined
let cachedVersion = -1

function readStoredAnalysis(): AnalysisData | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(ANALYSIS_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AnalysisData
  } catch {
    return null
  }
}

function refreshSnapshot(): AnalysisData | null {
  cachedSnapshot = readStoredAnalysis()
  cachedVersion = version
  return cachedSnapshot
}

function getSnapshot(): AnalysisData | null {
  if (cachedVersion !== version) refreshSnapshot()
  return cachedSnapshot ?? refreshSnapshot()
}

function notifyAnalysisChange() {
  version++
  refreshSnapshot()
  window.dispatchEvent(new Event(ANALYSIS_CHANGE_EVENT))
}

export function saveAnalysis(data: AnalysisData) {
  try {
    localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore storage failures
  }
  notifyAnalysisChange()
}

export function setAnalysisAppliedFixes(
  analysis: AnalysisData,
  appliedFixes: string[],
) {
  saveAnalysis({ ...analysis, appliedFixes })
}

export function clearAnalysis() {
  try {
    localStorage.removeItem(ANALYSIS_STORAGE_KEY)
    localStorage.removeItem("resume-fix-section")
  } catch {
    // ignore storage failures
  }
  clearFixesCache()
  notifyAnalysisChange()
}

export function useAnalysisStorage() {
  return useSyncExternalStore<AnalysisData | null>(
    (onStoreChange) => {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === ANALYSIS_STORAGE_KEY) {
          refreshSnapshot()
        }
        onStoreChange()
      }
      window.addEventListener(ANALYSIS_CHANGE_EVENT, onStoreChange)
      window.addEventListener("storage", handleStorage)
      return () => {
        window.removeEventListener(ANALYSIS_CHANGE_EVENT, onStoreChange)
        window.removeEventListener("storage", handleStorage)
      }
    },
    getSnapshot,
    () => null,
  )
}
