"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

/* =========================================================
   CREATE FEEDBACK
========================================================= */
export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    if (!interviewId || !userId || !transcript?.length) {
      return { success: false };
    }

    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"), // ✅ FIXED (single argument)
      schema: feedbackSchema,
      prompt: `
You are an AI interviewer analyzing a mock interview.

Transcript:
${formattedTranscript}

Score the candidate from 0 to 100 in the following areas:
- Communication Skills
- Technical Knowledge
- Problem-Solving
- Cultural & Role Fit
- Confidence & Clarity
      `,
      system:
        "You are a professional interviewer analyzing a mock interview.",
    });

    const feedback = {
      interviewId,
      userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    const feedbackRef = feedbackId
      ? db.collection("feedback").doc(feedbackId)
      : db.collection("feedback").doc();

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

/* =========================================================
   GET INTERVIEW BY ID
========================================================= */
export async function getInterviewById(
  id: string
): Promise<Interview | null> {
  if (!id) return null;

  const interview = await db.collection("interviews").doc(id).get();
  return interview.exists ? (interview.data() as Interview) : null;
}

/* =========================================================
   GET FEEDBACK BY INTERVIEW ID
========================================================= */
export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  // ✅ Prevent invalid Firestore queries
  if (!interviewId || !userId) return null;

  const snapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Feedback;
}

/* =========================================================
   GET LATEST INTERVIEWS
========================================================= */
export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[]> {
  const { userId, limit = 20 } = params;

  // ✅ Firestore does not allow undefined in queries
  if (!userId) return [];

  const snapshot = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

/* =========================================================
   GET INTERVIEWS BY USER ID
========================================================= */
export async function getInterviewsByUserId(
  userId?: string
): Promise<Interview[]> {
  // ✅ CRITICAL GUARD
  if (!userId) return [];

  const snapshot = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}
