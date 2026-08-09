export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape HTML-significant characters so a "</script>" inside any string
  // value (e.g. a blog title or excerpt) can't break out of this script tag
  // and execute as markup. JSON.stringify alone is not XSS-safe inline.
  const safeJson = JSON.stringify(data)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  )
}
