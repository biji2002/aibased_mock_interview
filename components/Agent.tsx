"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createFeedback,
  finalizeInterview,
} from "@/lib/actions/general.action";

/* ============================
   ENUMS & TYPES
============================ */
enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "assistant";
  content: string;
}

interface AgentProps {
  userName?: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
}

/* ============================
   COMPONENT
============================ */
const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
}: AgentProps) => {
  const router = useRouter();

  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);

  const vapiRef = useRef<any>(null);
  const finalizedRef = useRef(false);

  /* ============================
     INIT VAPI (RUN ONCE ONLY)
  ============================ */
  useEffect(() => {
    let mounted = true;

    const initVapi = async () => {
      const Vapi = (await import("@vapi-ai/web")).default;
      if (!mounted) return;

      const vapi = new Vapi(
        process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!
      );

      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        setCallStatus(CallStatus.ACTIVE);
      });

      vapi.on("call-end", () => {
        setCallStatus(CallStatus.FINISHED);
      });

      vapi.on("message", (message: any) => {
        if (
          message?.type === "transcript" &&
          message.transcriptType === "final" &&
          (message.role === "user" ||
            message.role === "assistant")
        ) {
          setMessages(prev => [
            ...prev,
            {
              role: message.role,
              content: message.transcript,
            },
          ]);
        }
      });

      vapi.on("error", (e: any) => {
        console.error("❌ Vapi runtime error:", e);
      });
    };

    initVapi();

    return () => {
      mounted = false;
      // ❌ DO NOT stop Vapi here
    };
  }, []); // ✅ EMPTY DEP ARRAY (CRITICAL)

  /* ============================
     START CALL
  ============================ */
  const handleCall = async () => {
    if (!vapiRef.current) return;
    if (callStatus !== CallStatus.INACTIVE) return;

    setCallStatus(CallStatus.CONNECTING);

    await vapiRef.current.start(
      undefined,
      undefined,
      undefined,
      process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!
    );
  };

  /* ============================
     END CALL (USER ONLY)
  ============================ */
  const handleDisconnect = async () => {
    if (!vapiRef.current) return;
    await vapiRef.current.stop();
  };

  /* ============================
     AFTER CALL → FEEDBACK
  ============================ */
  useEffect(() => {
    if (callStatus !== CallStatus.FINISHED) return;
    if (finalizedRef.current) return;

    finalizedRef.current = true;

    const postCall = async () => {
      await new Promise(res => setTimeout(res, 1500));

      if (type === "generate") {
        router.push("/");
        return;
      }

      if (!interviewId || !userId || messages.length < 4) {
        router.push("/");
        return;
      }

      await finalizeInterview(interviewId);

      const res = await createFeedback({
        interviewId,
        userId,
        transcript: messages,
        feedbackId,
      });

      if (res.success && res.feedbackId) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        router.push("/");
      }
    };

    postCall();
  }, [callStatus, messages, interviewId, userId, feedbackId, router, type]);

  /* ============================
     UI
  ============================ */
  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <Image src="/ai-avatar.png" alt="AI" width={65} height={54} />
          <h3>AI Interviewer</h3>
        </div>

        <div className="card-border">
          <Image
            src="/user-avatar.png"
            alt="User"
            width={120}
            height={120}
            className="rounded-full"
          />
          <h3>{userName ?? "Guest"}</h3>
        </div>
      </div>

      <div className="mt-6 w-full max-w-3xl mx-auto space-y-2 text-center">
        {messages.slice(-3).map((msg, i) => (
          <p
            key={i}
            className={`text-sm ${
              msg.role === "assistant"
                ? "text-blue-400"
                : "text-green-400"
            }`}
          >
            <strong>
              {msg.role === "assistant" ? "AI" : "You"}:
            </strong>{" "}
            {msg.content}
          </p>
        ))}
      </div>

      <div className="w-full flex justify-center mt-6">
        {callStatus !== CallStatus.ACTIVE ? (
          <button
            className="btn-call"
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            {callStatus === CallStatus.CONNECTING
              ? "Connecting..."
              : "Call"}
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
