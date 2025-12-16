import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const {
      role,
      level,
      techstack,
      type,
      amount,
      userid,
    } = await req.json();

    if (
      !role ||
      !level ||
      !techstack ||
      !type ||
      !amount ||
      !userid
    ) {
      return Response.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = `
You are an interview question generator.

Generate exactly ${amount} ${type} interview questions.

Role: ${role}
Level: ${level}
Tech stack: ${
      Array.isArray(techstack)
        ? techstack.join(", ")
        : techstack
    }

Respond ONLY with valid JSON.
Example:
["Question 1", "Question 2"]

Do not include any extra text.
Do not use special characters like / * #.
`;

    const result = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.3,
    });

    const questions = JSON.parse(result.text.trim());

    const interview = {
      role,
      type,
      level,
      techstack: Array.isArray(techstack)
        ? techstack
        : techstack.split(",").map((t: string) => t.trim()),
      questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Interview generation error:", error);

    return Response.json(
      { success: false, error: "Failed to generate interview" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json(
    { success: true, message: "Interview API is working" },
    { status: 200 }
  );
}
