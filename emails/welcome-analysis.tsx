import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "react-email"
import { render } from "react-email"

type MajorScores = {
  ats: number
  contentQuality: number
  impactAchievements: number
  jobMatch: number
  presentationReadability: number
}

export type WelcomeAnalysisProps = {
  firstName: string
  score: number
  passed: boolean
  majorScores: Partial<MajorScores>
  topStrengths: string[]
  biggestWeaknesses: string[]
  targetRole: string
  analysisUrl: string
}

const sectionLabels: Record<keyof MajorScores, string> = {
  ats: "ATS",
  contentQuality: "Content",
  impactAchievements: "Impact",
  jobMatch: "Job match",
  presentationReadability: "Readability",
}

export function WelcomeAnalysisEmail({
  firstName = "there",
  score = 0,
  passed = false,
  majorScores = {},
  topStrengths = [],
  biggestWeaknesses = [],
  targetRole = "",
  analysisUrl = "https://swrk.ai/analyse",
}: WelcomeAnalysisProps) {
  const roleLine = targetRole ? ` for ${targetRole}` : ""

  return (
    <Html>
      <Head />
      <Preview>
        Your resume scored {String(score)}/100{roleLine} - here&apos;s how to
        improve it.
      </Preview>
      <Body style={{ margin: 0, backgroundColor: "#0b0b0f" }}>
        <Container
          style={{
            margin: "0 auto",
            padding: "32px 24px",
            maxWidth: "600px",
          }}
        >
          <Img
            src="https://swrk.ai/favicon.ico"
            alt="SWRK"
            width={40}
            height={40}
            style={{ marginBottom: "24px" }}
          />
          <Heading
            style={{ color: "#ffffff", fontSize: "24px", fontWeight: 700 }}
          >
            Welcome to SWRK{firstName !== "there" ? `, ${firstName}` : ""} 🎉
          </Heading>
          <Text
            style={{ color: "#a1a1aa", fontSize: "15px", lineHeight: "1.6" }}
          >
            We ran your resume through our full AI analysis. Here&apos;s your
            snapshot:
          </Text>

          <Section
            style={{
              border: "1px solid #27272a",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "16px",
              backgroundColor: "#121216",
            }}
          >
            <Text
              style={{ color: "#a1a1aa", fontSize: "13px", margin: "0 0 4px" }}
            >
              OVERALL SCORE
            </Text>
            <Text
              style={{
                color: passed ? "#34d399" : "#fbbf24",
                fontSize: "40px",
                fontWeight: 800,
                margin: "0",
              }}
            >
              {score}
              <span style={{ color: "#52525b", fontSize: "20px" }}>/100</span>
            </Text>
            <Hr style={{ borderColor: "#27272a", margin: "16px 0" }} />
            <table width="100%" style={{ borderCollapse: "collapse" }}>
              <tbody>
                {(Object.keys(sectionLabels) as (keyof MajorScores)[]).map(
                  (key) => (
                    <tr key={key}>
                      <td
                        style={{
                          color: "#a1a1aa",
                          fontSize: "13px",
                          padding: "3px 0",
                        }}
                      >
                        {sectionLabels[key]}
                      </td>
                      <td
                        style={{
                          color: "#ffffff",
                          fontSize: "13px",
                          textAlign: "right",
                          fontWeight: 600,
                        }}
                      >
                        {typeof majorScores[key] === "number"
                          ? majorScores[key]
                          : "-"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </Section>

          {topStrengths.length > 0 && (
            <Section style={{ marginBottom: "16px" }}>
              <Heading
                as="h2"
                style={{ color: "#34d399", fontSize: "15px", fontWeight: 700 }}
              >
                ✓ Your top strengths
              </Heading>
              {topStrengths.map((item, i) => (
                <Text
                  key={i}
                  style={{
                    color: "#a1a1aa",
                    fontSize: "14px",
                    margin: "2px 0",
                  }}
                >
                  • {item}
                </Text>
              ))}
            </Section>
          )}

          {biggestWeaknesses.length > 0 && (
            <Section style={{ marginBottom: "24px" }}>
              <Heading
                as="h2"
                style={{ color: "#f87171", fontSize: "15px", fontWeight: 700 }}
              >
                ✗ Biggest weaknesses to fix
              </Heading>
              {biggestWeaknesses.map((item, i) => (
                <Text
                  key={i}
                  style={{
                    color: "#a1a1aa",
                    fontSize: "14px",
                    margin: "2px 0",
                  }}
                >
                  • {item}
                </Text>
              ))}
            </Section>
          )}

          <Button
            href={analysisUrl}
            style={{
              display: "inline-block",
              backgroundColor: "#22c55e",
              color: "#0b0b0f",
              fontSize: "15px",
              fontWeight: 700,
              padding: "14px 28px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            View full analysis →
          </Button>

          <Hr style={{ borderColor: "#27272a", margin: "28px 0 20px" }} />
          <Text style={{ color: "#71717a", fontSize: "12px", margin: "0" }}>
            You&apos;re receiving this because you analysed a resume on SWRK.
            Your analysis is saved to your account at any time.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderWelcomeAnalysis(
  props: WelcomeAnalysisProps,
): Promise<string> {
  return render(<WelcomeAnalysisEmail {...props} />)
}
