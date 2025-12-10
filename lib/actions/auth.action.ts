"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

/* =========================
   SET SESSION COOKIE
========================= */
export async function setSessionCookie(idToken: string) {
  const cookieStore = (await cookies()) as any; // ✅ FIX

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION * 1000,
  });

  cookieStore.set("session", sessionCookie, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

/* =========================
   SIGN UP
========================= */
export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;

  try {
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists) {
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };
    }

    await db.collection("users").doc(uid).set({
      name,
      email,
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch {
    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

/* =========================
   SIGN IN ✅ FIXED
========================= */
export async function signIn(params: SignInParams) {
  const { email, idToken } = params;

  try {
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord) {
      return {
        success: false,
        message: "User does not exist. Create an account.",
      };
    }

    await setSessionCookie(idToken);

    return {
      success: true,
      message: "Signed in successfully",
    };
  } catch {
    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

/* =========================
   SIGN OUT
========================= */
export async function signOut() {
  const cookieStore = (await cookies()) as any; // ✅ FIX
  cookieStore.delete("session");
}

/* =========================
   GET CURRENT USER
========================= */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies(); // ✅ get() is typed correctly

  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    const userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();

    if (!userRecord.exists) return null;

    return {
      ...(userRecord.data() as User),
      id: userRecord.id,
    };
  } catch {
    return null;
  }
}

/* =========================
   AUTH CHECK
========================= */
export async function isAuthenticated() {
  return !!(await getCurrentUser());
}
