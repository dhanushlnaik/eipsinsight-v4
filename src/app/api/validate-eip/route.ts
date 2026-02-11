import { NextRequest, NextResponse } from "next/server";

interface ValidationResult {
  success: boolean;
  messages: Array<{ level: "error" | "warning" | "info"; message: string }>;
}

// Basic client-side EIP preamble validation
// A full eipw-lint-js integration can be added later
function validateEIPMarkdown(md: string): ValidationResult {
  const messages: Array<{ level: "error" | "warning" | "info"; message: string }> = [];

  // Check frontmatter exists
  const fmMatch = md.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    messages.push({ level: "error", message: "Missing YAML frontmatter (---)" });
    return { success: false, messages };
  }

  const fm = fmMatch[1];

  // Required fields
  const requiredFields = ["eip", "title", "description", "author", "status", "type", "created"];
  for (const field of requiredFields) {
    const regex = new RegExp(`^${field}:\\s*.+`, "im");
    if (!regex.test(fm)) {
      messages.push({ level: "error", message: `Missing required preamble field: ${field}` });
    }
  }

  // Status validation
  const statusMatch = fm.match(/^status:\s*(.+)/im);
  if (statusMatch) {
    const validStatuses = ["Draft", "Review", "Last Call", "Final", "Stagnant", "Withdrawn", "Living"];
    if (!validStatuses.includes(statusMatch[1].trim())) {
      messages.push({ level: "error", message: `Invalid status: "${statusMatch[1].trim()}". Must be one of: ${validStatuses.join(", ")}` });
    }
  }

  // Type validation
  const typeMatch = fm.match(/^type:\s*(.+)/im);
  if (typeMatch) {
    const validTypes = ["Standards Track", "Meta", "Informational"];
    if (!validTypes.includes(typeMatch[1].trim())) {
      messages.push({ level: "error", message: `Invalid type: "${typeMatch[1].trim()}". Must be one of: ${validTypes.join(", ")}` });
    }
  }

  // Category validation (required for Standards Track)
  if (typeMatch && typeMatch[1].trim() === "Standards Track") {
    const catMatch = fm.match(/^category:\s*(.+)/im);
    if (!catMatch) {
      messages.push({ level: "warning", message: "Category is recommended for Standards Track EIPs" });
    } else {
      const validCats = ["Core", "Networking", "Interface", "ERC"];
      if (!validCats.includes(catMatch[1].trim())) {
        messages.push({ level: "error", message: `Invalid category: "${catMatch[1].trim()}". Must be one of: ${validCats.join(", ")}` });
      }
    }
  }

  // Last Call deadline check
  if (statusMatch && statusMatch[1].trim() === "Last Call") {
    if (!/^last-call-deadline:\s*.+/im.test(fm)) {
      messages.push({ level: "error", message: "last-call-deadline is required when status is Last Call" });
    }
  }

  // Check for required sections
  const body = md.slice(fmMatch[0].length);
  if (!/## Abstract/i.test(body)) {
    messages.push({ level: "warning", message: "Missing ## Abstract section" });
  }
  if (!/## Security Considerations/i.test(body)) {
    messages.push({ level: "warning", message: "Missing ## Security Considerations section (required for Final status)" });
  }

  // EIP number format
  const eipMatch = fm.match(/^eip:\s*(\d+)/im);
  if (eipMatch) {
    const num = parseInt(eipMatch[1], 10);
    if (num <= 0) {
      messages.push({ level: "error", message: "EIP number must be a positive integer" });
    }
  }

  const hasErrors = messages.some((m) => m.level === "error");
  return { success: !hasErrors, messages };
}

export async function POST(req: NextRequest) {
  try {
    const { markdownContent } = await req.json();

    if (!markdownContent || typeof markdownContent !== "string") {
      return NextResponse.json(
        { success: false, messages: [{ level: "error", message: "Markdown content is required" }] },
        { status: 400 }
      );
    }

    const result = validateEIPMarkdown(markdownContent);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json(
      { success: false, messages: [{ level: "error", message: "Validation failed" }] },
      { status: 500 }
    );
  }
}
