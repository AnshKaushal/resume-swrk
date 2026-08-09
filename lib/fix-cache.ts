"use client"

import type { AnalyseResponse, Fix, SectionKey } from "@/lib/analyse"

const FIXES_CACHE_KEY = "resume-fixes-cache"

export type FixesCache = Partial<
  Record<SectionKey, { fingerprint: string; fixes: Fix[] }>
>

export function readFixesCache(): FixesCache {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(FIXES_CACHE_KEY) ?? "{}")
  } catch {
    return {}
  }
}

export function clearFixesCache() {
  try {
    localStorage.removeItem(FIXES_CACHE_KEY)
  } catch {
    // ignore storage failures
  }
}

export function writeFixesCache(
  section: SectionKey,
  fixes: Fix[],
  fingerprint: string,
) {
  try {
    const cache = readFixesCache()
    cache[section] = { fingerprint, fixes }
    localStorage.setItem(FIXES_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore storage failures
  }
}

export function readSectionFixes(
  data: AnalyseResponse,
  section: SectionKey,
): Fix[] {
  const cached = readFixesCache()[section]
  if (cached && cached.fingerprint === fingerprintFor(data, section)) {
    return cached.fixes
  }
  return []
}

export function fingerprintFor(data: AnalyseResponse, section: SectionKey): string {
  const failed = data.analysis.checks
    .filter((c) => c.section === section && !c.passed)
    .map((c) => c.label)
    .sort()
  return JSON.stringify([
    data.resumeText,
    data.targetRole,
    data.unlocked,
    failed,
  ])
}
