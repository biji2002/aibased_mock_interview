"use server";

import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

/* =========================
   CREATE INTERVIEW ✅
========================= */
export async function createInterview({
  userId,
  role,
  level,
  type,
  techstack,
  questions,
}: {
  userId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  questions: string[];
}) {
  if (!userId || !role || !questions || questions.length === 0) {
    console.error("❌ Invalid interview params");
    return { success: false };
  }

  const ref = db.collection("interviews").doc();

  await ref.set({
    userId,
    role,
    level,
    type,
    techstack,
    questions,
    finalized: false,
    createdAt: new Date().toISOString(),
  });

  return {
    success: true,
    interviewId: ref.id,
  };
}

/* =========================
   FINALIZE INTERVIEW ✅
========================= */
export async function finalizeInterview(interviewId: string) {
  if (!interviewId) {
    console.error("❌ Missing interviewId while finalizing");
    return;
  }

  await db.collection("interviews").doc(interviewId).update({
    finalized: true,
  });
}

/* =========================
   CREATE FEEDBACK ✅
========================= */
export async function createFeedback({
  interviewId,
  userId,
  transcript,
  feedbackId,
}: CreateFeedbackParams) {
  if (!interviewId || !userId || transcript.length === 0) {
    console.error("❌ Invalid feedback params");
    return { success: false };
  }

  const formattedTranscript = transcript
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const { object } = await generateObject({
    model: groq("llama3-70b-8192"),
    schema: feedbackSchema,
    prompt: `
You are a senior interviewer.

Evaluate the interview transcript and return structured feedback.

TRANSCRIPT:
${formattedTranscript}
`,
  });

  const ref = feedbackId
    ? db.collection("feedback").doc(feedbackId)
    : db.collection("feedback").doc();

  await ref.set({
    interviewId,
    userId,
    ...object,
    createdAt: new Date().toISOString(),
  });

  return { success: true, feedbackId: ref.id };
}

/* =========================
   GET INTERVIEW BY ID
========================= */
export async function getInterviewById(id: string): Promise<Interview | null> {
  if (!id) return null;

  const doc = await db.collection("interviews").doc(id).get();
  return doc.exists ? ({ id: doc.id, ...(doc.data() as any) }) : null;
}

/* =========================
   GET FEEDBACK BY INTERVIEW
========================= */
export async function getFeedbackByInterviewId({
  interviewId,
  userId,
}: GetFeedbackByInterviewIdParams): Promise<Feedback | null> {
  const snap = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as any) };
}

/* =========================
   GET USER INTERVIEWS
========================= */
export async function getInterviewsByUserId(userId?: string) {
  if (!userId) return [];

  const snap = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
}

/* =========================
   GET LATEST INTERVIEWS
========================= */
export async function getLatestInterviews({
  userId,
  limit = 20,
}: GetLatestInterviewsParams) {
  const snap = await db
    .collection("interviews")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
}
