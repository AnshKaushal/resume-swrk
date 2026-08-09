import nodemailer from "nodemailer"
import { renderWelcomeAnalysis } from "@/emails/welcome-analysis"

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  const user = process.env.APP_EMAIL
  const pass = process.env.APP_PASSWORD
  if (!user || !pass) return null

  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST ?? "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT ?? 465),
    secure:
      process.env.MAIL_SECURE === undefined
        ? true
        : process.env.MAIL_SECURE === "true",
    auth: { user, pass },
  })
  return transporter
}

export async function sendWelcomeAnalysisEmail(params: {
  to: string
  firstName?: string
  score: number
  passed: boolean
  majorScores: Record<string, number>
  topStrengths: string[]
  biggestWeaknesses: string[]
  targetRole: string
  analysisUrl: string
}): Promise<boolean> {
  const t = getTransporter()
  if (!t) return false

  const html = await renderWelcomeAnalysis({
    firstName: params.firstName ?? "there",
    score: params.score,
    passed: params.passed,
    majorScores: params.majorScores,
    topStrengths: params.topStrengths.slice(0, 3),
    biggestWeaknesses: params.biggestWeaknesses.slice(0, 3),
    targetRole: params.targetRole,
    analysisUrl: params.analysisUrl,
  })

  await t.sendMail({
    from: process.env.MAIL_FROM ?? process.env.APP_EMAIL,
    to: params.to,
    subject: `Your resume scored ${params.score}/100 - full analysis inside`,
    html,
  })
  return true
}
