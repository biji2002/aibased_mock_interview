import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { role, level, techstack, type, amount } = await req.json();

  const { text } = await generateText({
    model: google("gemini-2.0-flash-001"),
    prompt: `
Prepare interview questions.

Role: ${role}
Experience level: ${level}
Tech stack: ${techstack}
Interview type: ${type}
Number of questions: ${amount}

Return ONLY a JSON array like:
["Question 1", "Question 2"]
`,
  });

  return Response.json({
    questions: JSON.parse(text),
  });
}

export async function GET() {
  return Response.json({ ok: true });
}
