import "@/lib/pdf-globals";
import mammoth from "mammoth";

export type ParsedResume = {
  text: string;
  fileName: string;
  fileType: string;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
/** Cap the extracted text so a decompression bomb or crafted file can't balloon memory/DB. */
const MAX_EXTRACTED_CHARS = 200_000;

export function isValidFileSize(buffer: Buffer): boolean {
  return buffer.byteLength <= MAX_FILE_BYTES;
}

/**
 * Validates the file's magic bytes so a renamed script/SVG (or any
 * non-resume binary) can't sneak past the extension check and be parsed as a
 * PDF/DOCX. Returns the detected mime, or null when the bytes don't match.
 */
function sniffMime(buffer: Buffer): string | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  // DOCX is a ZIP archive; its first two bytes are always "PK".
  if (buffer.length >= 2 && buffer.subarray(0, 2).toString("ascii") === "PK") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return null;
}

export async function parseResume(
  buffer: Buffer,
  fileName: string
): Promise<ParsedResume> {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mimeType = extToMime(ext);

  if (!mimeType) {
    throw new Error(
      "Unsupported file type. Please upload a PDF, DOCX, or TXT resume."
    );
  }

  if (buffer.byteLength === 0) {
    throw new Error("The uploaded file is empty. Please upload a resume file.");
  }

  if (!isValidFileSize(buffer)) {
    throw new Error("The uploaded file is too large. Maximum size is 5 MB.");
  }

  // Text files are trusted as-is; binary formats must match their magic bytes.
  if (mimeType !== "text/plain") {
    const sniffed = sniffMime(buffer);
    if (sniffed !== mimeType) {
      throw new Error(
        "The file content does not match its extension. Please upload a valid PDF or DOCX resume."
      );
    }
  }

  switch (mimeType) {
    case "application/pdf": {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        const text = result.text.trim();
        if (text.length > MAX_EXTRACTED_CHARS) {
          throw new Error(
            "The document contains too much text to analyse. Please upload a shorter resume."
          );
        }
        return {
          text,
          fileName,
          fileType: "pdf",
        };
      } finally {
        await parser.destroy();
      }
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      if (text.length > MAX_EXTRACTED_CHARS) {
        throw new Error(
          "The document contains too much text to analyse. Please upload a shorter resume."
        );
      }
      return {
        text,
        fileName,
        fileType: "docx",
      };
    }
    case "text/plain": {
      const text = buffer.toString("utf-8").trim();
      if (text.length > MAX_EXTRACTED_CHARS) {
        throw new Error(
          "The document contains too much text to analyse. Please upload a shorter resume."
        );
      }
      return {
        text,
        fileName,
        fileType: "txt",
      };
    }
    default:
      throw new Error(
        "Unsupported file type. Please upload a PDF, DOCX, or TXT resume."
      );
  }
}

function extToMime(ext?: string): string {
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "doc":
      return "application/msword";
    case "txt":
      return "text/plain";
    default:
      return "";
  }
}
