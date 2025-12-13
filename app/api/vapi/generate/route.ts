import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const runtime = "nodejs";

// ✅ Mock questions for fallback (NO AI)
const MOCK_QUESTIONS = [
  "Explain the difference between props and state in React",
  "What is the virtual DOM and why is it used",
  "Explain the useEffect hook and its dependency array",
  "How does JavaScript handle closures",
  "What is event delegation in JavaScript",
];

export async function POST(req: Request) {
  try {
    const { role, level, techstack, type, amount } = await req.json();

    const prompt = `
Prepare ${amount} interview questions.

Role: ${role}
Level: ${level}
Tech stack: ${techstack}
Focus: ${type}

Return ONLY a JSON array like:
["Question 1", "Question 2"]
`;

    // 🔹 TRY AI FIRST
    const result = await generateText({
      model: google("gemini-2.0-flash"),
      prompt,
    });

    // 🔹 Try to parse AI response
    let questions: string[];
    try {
      questions = JSON.parse(result.text);
    } catch {
      questions = result.text
        .split("\n")
        .filter(Boolean)
        .map(q => q.replace(/^[0-9.\-\s]+/, ""));
    }

    return Response.json({
      success: true,
      questions,
      source: "ai",
    });

  } catch (error) {
    console.warn("⚠️ AI failed, using mock questions");

    // 🔴 FALLBACK: NO AI, NO BILLING
    return Response.json({
      success: true,
      questions: MOCK_QUESTIONS.slice(0, 5),
      source: "mock",
    });
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: "VAPI generate endpoint working",
  });
}
