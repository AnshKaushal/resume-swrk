import type { AnalyseResponse } from "./analyse"

const SECTION_LABELS: Record<string, string> = {
  ats: "ATS Score",
  contentQuality: "Content Quality",
  impactAchievements: "Impact & Achievements",
  jobMatch: "Job Match",
  presentationReadability: "Presentation & Readability",
}

const SECTION_COLORS: Record<string, { light: string; dark: string }> = {
  ats: { light: "#2563eb", dark: "#60a5fa" },
  contentQuality: { light: "#059669", dark: "#34d399" },
  impactAchievements: { light: "#d97706", dark: "#fbbf24" },
  jobMatch: { light: "#7c3aed", dark: "#a78bfa" },
  presentationReadability: { light: "#e11d48", dark: "#fb7185" },
}

function themePalette(dark: boolean) {
  return dark
    ? {
        bg: "#16171a",
        card: "#24262b",
        fg: "#fafbfa",
        muted: "#36393f",
        mutedFg: "#a8adb5",
        border: "rgba(255,255,255,0.10)",
        ok: "#34d399",
        bad: "#fb7185",
        primary: "#5b5bd6",
      }
    : {
        bg: "#ffffff",
        card: "#ffffff",
        fg: "#16181d",
        muted: "#f3f4f4",
        mutedFg: "#6b7280",
        border: "#e5e7e9",
        ok: "#059669",
        bad: "#e11d48",
        primary: "#4444c8",
      }
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function verdict(score: number): string {
  if (score >= 80) return "Strong · interviews likely"
  if (score >= 60) return "Room for improvement"
  if (score >= 50) return "Good · minor improvements recommended"
  return "Needs significant work"
}

const ICON = {
  gauge:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 13.5a5.5 5.5 0 1 0-4.89-3"/><path d="M8 8.5l3-3"/></svg>',
  check:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6.2"/><path d="M5.2 8.4l1.9 1.9 3.7-4.2"/></svg>',
  cross:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6.2"/><path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4"/></svg>',
  lock: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="7" width="9" height="6.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',
  trending:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 12l4-4 3 3 5-5"/><path d="M11 6h3v3"/></svg>',
  target:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r="0.6" fill="currentColor"/></svg>',
  sparkles:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M8 2l1.4 3.6L13 7l-3.6 1.4L8 12l-1.4-3.6L3 7l3.6-1.4z"/><path d="M13 11l.6 1.4L15 13l-1.4.6L13 15l-.6-1.4L11 13l1.4-.6z"/></svg>',
  list: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 4h8M6 8h8M6 12h8"/><circle cx="2.6" cy="4" r="0.7" fill="currentColor"/><circle cx="2.6" cy="8" r="0.7" fill="currentColor"/><circle cx="2.6" cy="12" r="0.7" fill="currentColor"/></svg>',
}

function majorRows(
  analysis: AnalyseResponse["analysis"],
  p: ReturnType<typeof themePalette>,
): string {
  return Object.entries(SECTION_LABELS)
    .map(([key, label]) => {
      const color = SECTION_COLORS[key]?.light ?? p.primary
      const value = Math.round(
        analysis.majorScores[key as keyof typeof analysis.majorScores] ?? 0,
      )
      const width = Math.min(100, Math.max(0, value))
      const weight =
        key === "ats" || key === "contentQuality"
          ? "25%"
          : key === "impactAchievements" || key === "jobMatch"
            ? "20%"
            : "10%"
      return `<div class="major">
        <div class="major-head">
          <span class="major-label" style="color:${color}">${escapeHtml(label)} <span class="weight">· ${weight}</span></span>
          <span class="major-value">${value}/100</span>
        </div>
        <div class="bar"><div class="bar-fill" style="width:${width}%;background:${color}"></div></div>
      </div>`
    })
    .join("")
}

function listCard(
  title: string,
  icon: string,
  items: string[],
  tone: "emerald" | "rose" | "plain",
  p: ReturnType<typeof themePalette>,
  empty = "None identified.",
): string {
  const dot = tone === "emerald" ? p.ok : tone === "rose" ? p.bad : p.primary
  const rows =
    items.length > 0
      ? items
          .map(
            (i) =>
              `<li><span class="dot" style="background:${dot}"></span><span>${escapeHtml(i)}</span></li>`,
          )
          .join("")
      : `<li class="muted">${escapeHtml(empty)}</li>`
  return `<div class="card">
    <div class="card-title">${icon}<span>${escapeHtml(title)}</span></div>
    <ul class="list">${rows}</ul>
  </div>`
}

function checksBlock(
  checks: AnalyseResponse["analysis"]["checks"],
  p: ReturnType<typeof themePalette>,
): string {
  const grouped = new Map<string, AnalyseResponse["analysis"]["checks"]>()
  for (const check of checks) {
    const list = grouped.get(check.section) ?? []
    list.push(check)
    grouped.set(check.section, list)
  }

  const sections = Array.from(grouped.entries())
    .map(([section, list]) => {
      const color = SECTION_COLORS[section]?.light ?? p.fg
      const passed = list.filter((c) => c.passed).length
      const rows = list
        .map((c) => {
          const locked = c.locked === true
          const failed = !locked && !c.passed
          const icon = locked
            ? `<span class="ci" style="color:${p.mutedFg}">${ICON.lock}</span>`
            : failed
              ? `<span class="ci" style="color:${p.bad}">${ICON.cross}</span>`
              : `<span class="ci" style="color:${p.ok}">${ICON.check}</span>`
          const score =
            c.score !== null && c.score !== undefined
              ? `${c.score}/100`
              : "&mdash;"
          return `<div class="check ${failed ? "failed" : ""}">
            ${icon}
            <div class="check-body">
              <div class="check-head">
                <span class="check-label">${escapeHtml(c.label)}</span>
                <span class="check-score">${score}</span>
              </div>
              <div class="check-cat">${escapeHtml(c.category)}${locked ? " · locked" : ""}</div>
              ${c.feedback ? `<div class="check-feedback">${escapeHtml(c.feedback)}</div>` : ""}
            </div>
          </div>`
        })
        .join("")
      return `<div class="checks-group">
        <div class="group-title" style="color:${color}">${escapeHtml(SECTION_LABELS[section] ?? section)}
          <span class="group-count">${passed}/${list.length} passed</span>
        </div>
        ${rows}
      </div>`
    })
    .join("")

  return (
    sections ||
    `<p class="muted" style="padding:6px 2px">No checks available.</p>`
  )
}

export function buildAnalysisReportHtml(
  result: AnalyseResponse,
  dark: boolean = false,
): string {
  const p = themePalette(dark)
  const { analysis } = result
  const score = Math.round(analysis.scores.value ?? 0)
  const scoreColor = score >= 80 ? p.ok : score >= 60 ? p.primary : p.bad
  const date = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const roleLine = result.targetRole
    ? ` · targeting ${escapeHtml(result.targetRole)}`
    : ""
  const passedChecks = analysis.checks.filter(
    (c) => c.passed && c.locked !== true,
  ).length
  const visibleChecks = analysis.checks.length
  const lockedChecks = analysis.checks.filter((c) => c.locked).length

  const improve = analysis.aiInsights.rewriteSuggestions?.trim()
  const sectionSuggestions = analysis.aiInsights.sectionSuggestions ?? []
  const keywordChips =
    analysis.aiInsights.suggestedKeywords.length > 0
      ? analysis.aiInsights.suggestedKeywords
          .map((k) => `<span class="chip">${escapeHtml(k)}</span>`)
          .join("")
      : "<p class='muted' style='padding:2px'>Add a job description to get keyword suggestions.</p>"

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Resume Analysis - ${escapeHtml(result.fileName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Geist:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 13mm 12mm; }
  html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    background: ${p.bg};
    color: ${p.fg};
    font-family: "Geist", "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
  }
  .card {
    background: ${p.card};
    border: 1px solid ${p.border};
    border-radius: 0;
    padding: 18px 20px;
    margin-bottom: 14px;
    page-break-inside: avoid;
  }
  .brand {
    display: flex; justify-content: space-between; align-items: flex-end;
    padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid ${p.border};
  }
  .brand-mark { display: flex; align-items: center; gap: 8px; font-family: "Space Grotesk", sans-serif; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; font-size: 11pt; }
  .brand-dot { width: 14px; height: 14px; background: ${p.primary}; }
  .brand-meta { color: ${p.mutedFg}; font-size: 8pt; text-align: right; }
  .page-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
  .page-head h1 { font-family: "Space Grotesk", sans-serif; font-size: 19pt; font-weight: 600; letter-spacing: -0.01em; }
  .page-sub { color: ${p.mutedFg}; font-size: 9pt; margin-top: 2px; }
  .score-row { display: grid; grid-template-columns: 200px 1fr; gap: 14px; margin-bottom: 14px; }
  .gauge { text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px; }
  .gauge-label { font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em; color: ${p.mutedFg}; }
  .gauge-score { font-family: "Space Grotesk", sans-serif; font-size: 46pt; font-weight: 700; line-height: 1; color: ${scoreColor}; }
  .gauge-out { font-size: 8pt; color: ${p.mutedFg}; margin-top: 4px; }
  .gauge-bar { width: 150px; height: 8px; background: ${p.muted}; margin-top: 10px; }
  .gauge-fill { height: 100%; background: ${scoreColor}; }
  .gauge-verdict { margin-top: 10px; font-size: 9pt; font-weight: 600; }
  .card-title { display: flex; align-items: center; gap: 8px; font-size: 10.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 14px; color: ${p.fg}; }
  .card-title svg { color: ${p.mutedFg}; }
  .major { margin-bottom: 12px; }
  .major:last-child { margin-bottom: 0; }
  .major-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
  .major-label { font-size: 9.5pt; font-weight: 600; }
  .major-label .weight { color: ${p.mutedFg}; font-weight: 400; }
  .major-value { font-weight: 700; font-variant-numeric: tabular-nums; }
  .bar { height: 8px; background: ${p.muted}; }
  .bar-fill { height: 100%; }
  .insights { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .insights .card { margin-bottom: 14px; }
  .list { list-style: none; }
  .list li { display: flex; align-items: flex-start; gap: 8px; padding: 3px 0; font-size: 9pt; }
  .dot { width: 5px; height: 5px; flex: 0 0 5px; margin-top: 6px; }
  .muted { color: ${p.mutedFg}; }
  .checks-group { margin-bottom: 16px; }
  .checks-group:last-child { margin-bottom: 0; }
  .group-title { font-size: 10pt; font-weight: 600; padding: 4px 0 8px; border-bottom: 1px solid ${p.border}; margin-bottom: 2px; }
  .group-count { color: ${p.mutedFg}; font-weight: 500; font-size: 8pt; margin-left: 8px; text-transform: none; }
  .check { display: flex; gap: 10px; padding: 9px 0; border-bottom: 1px solid ${p.border}; }
  .check:last-child { border-bottom: 0; }
  .check.failed { background: rgba(225,29,72,0.05); margin: 0 -10px; padding-left: 10px; padding-right: 10px; }
  .ci { flex: 0 0 14px; margin-top: 1px; }
  .check-body { flex: 1; min-width: 0; }
  .check-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .check-label { font-size: 9.5pt; font-weight: 600; }
  .check-score { font-weight: 700; font-variant-numeric: tabular-nums; color: ${p.fg}; }
  .check-cat { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.05em; color: ${p.mutedFg}; margin-top: 1px; }
  .check-feedback { font-size: 8.5pt; color: ${p.mutedFg}; margin-top: 3px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { border: 1px solid ${p.border}; background: ${p.muted}; padding: 3px 8px; font-size: 8.5pt; }
  .improve { white-space: pre-line; font-size: 9pt; color: ${p.fg}; }
  .section-list { list-style: none; margin-top: 8px; }
  .section-list li { display: flex; align-items: flex-start; gap: 8px; padding: 2px 0; font-size: 9pt; }
  .section-list svg { color: ${p.ok}; flex: 0 0 14px; margin-top: 2px; }
  .footer { text-align: center; color: ${p.mutedFg}; font-size: 8pt; margin-top: 22px; padding-top: 12px; border-top: 1px solid ${p.border}; }
  .weights { color: ${p.mutedFg}; font-size: 7.5pt; text-align: center; margin-top: 10px; }
</style>
</head>
<body>
  <div class="brand">
    <div class="brand-mark"><span class="brand-dot"></span>SWRK&nbsp;·&nbsp;Resume Optimizer</div>
    <div class="brand-meta">Analysis report<br />${escapeHtml(date)}</div>
  </div>

  <div class="page-head">
    <div>
      <h1>Analysis results</h1>
      <div class="page-sub">${escapeHtml(result.fileName)}${result.fileType ? ` (${escapeHtml(result.fileType)})` : ""}${roleLine}</div>
    </div>
  </div>

  <div class="score-row">
    <div class="card gauge">
      <div class="gauge-label">Overall score</div>
      <div class="gauge-score">${score}</div>
      <div class="gauge-out">out of 100</div>
      <div class="gauge-bar"><div class="gauge-fill" style="width:${Math.min(100, Math.max(0, score))}%"></div></div>
      <div class="gauge-verdict">${escapeHtml(verdict(score))}</div>
    </div>
    <div class="card">
      <div class="card-title">${ICON.gauge}Major scores</div>
      ${majorRows(analysis, p)}
    </div>
  </div>

  <div class="insights">
    ${listCard("Top strengths", ICON.sparkles, analysis.aiInsights.topStrengths ?? [], "emerald", p)}
    ${listCard("Biggest weaknesses", ICON.target, analysis.aiInsights.biggestWeaknesses ?? [], "rose", p)}
  </div>

  <div class="insights">
    ${listCard("Skill gap analysis", ICON.trending, analysis.aiInsights.skillGapAnalysis ?? [], "plain", p)}
    <div class="card">
      <div class="card-title">${ICON.target}Suggested keywords</div>
      <div class="chips">${keywordChips}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">${ICON.list}Checks by section
      <span class="group-count" style="margin-left:8px">${passedChecks} / ${visibleChecks} passed${lockedChecks > 0 ? ` · ${lockedChecks} locked` : ""}</span>
    </div>
    ${checksBlock(analysis.checks, p)}
  </div>

  ${
    improve
      ? `<div class="card">
        <div class="card-title">${ICON.sparkles}How to improve</div>
        <div class="improve">${escapeHtml(improve)}</div>
        ${
          sectionSuggestions.length > 0
            ? `<ul class="section-list">${sectionSuggestions
                .map(
                  (s) => `<li>${ICON.check}<span>${escapeHtml(s)}</span></li>`,
                )
                .join("")}</ul>`
            : ""
        }
      </div>`
      : ""
  }

  <div class="weights">Score based on a weighted model: ATS 25% · Content 25% · Impact 20% · Job Match 20% · Readability 10%.</div>
  <div class="footer">Generated by SWRK Resume Optimizer &middot; swrk.ai</div>
</body>
</html>`
}

export function exportAnalysisAsPdf(result: AnalyseResponse): boolean {
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  const html = buildAnalysisReportHtml(result, dark)
  const win = window.open("", "_blank", "width=860,height=1000,noopener=yes")
  if (!win) return false
  win.opener = null
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  const trigger = () => {
    win.focus()
    win.print()
  }
  if (win.document.readyState === "complete") {
    setTimeout(trigger, 120)
  } else {
    win.onload = trigger
    setTimeout(trigger, 900)
  }
  return true
}
