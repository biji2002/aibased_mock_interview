import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { role, level, techstack, type, amount } = await req.json();

  const prompt = `
You are an interview question generator.

Generate exactly ${amount} ${type} interview questions.

Role: ${role}
Level: ${level}
Tech stack: ${techstack.join(", ")}

Respond ONLY with valid JSON.
Example:
["Question 1", "Question 2"]
`;

  const result = await generateText({
    model: groq("llama3-70b-8192"),
    prompt,
    temperature: 0.3,
  });

  const questions = JSON.parse(result.text.trim());

  return Response.json({
    success: true,
    questions,
    source: "groq",
  });
}
