"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createFeedback,
  finalizeInterview,
} from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "assistant";
  content: string;
  isPartial?: boolean;
}

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
  const finalizedRef = useRef(false);
  const vapiRef = useRef<any>(null);

  /* ============================
     INIT VAPI (CLIENT ONLY)
  ============================ */
  useEffect(() => {
    let mounted = true;

    const initVapi = async () => {
      const Vapi = (await import("@vapi-ai/web")).default;
      if (!mounted) return;

      vapiRef.current = new Vapi(
        process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!
      );

      vapiRef.current.on("call-start", () => {
        setCallStatus(CallStatus.ACTIVE);
      });

      vapiRef.current.on("call-end", () => {
        setCallStatus(CallStatus.FINISHED);
      });

      /* ===== SUBTITLES (PARTIAL + FINAL) ===== */
      vapiRef.current.on("message", (message: any) => {
        if (message?.type !== "transcript") return;
        if (message.role !== "user" && message.role !== "assistant") return;

        // LIVE subtitle
        if (message.transcriptType === "partial") {
          setMessages(prev => {
            const copy = [...prev];

            // Replace last partial line
            if (
              copy.length &&
              copy[copy.length - 1].isPartial &&
              copy[copy.length - 1].role === message.role
            ) {
              copy[copy.length - 1] = {
                role: message.role,
                content: message.transcript,
                isPartial: true,
              };
              return copy;
            }

            return [
              ...copy,
              {
                role: message.role,
                content: message.transcript,
                isPartial: true,
              },
            ];
          });
        }

        // FINAL subtitle
        if (message.transcriptType === "final") {
          setMessages(prev => [
            ...prev.filter(
              m => !(m.role === message.role && m.isPartial)
            ),
            {
              role: message.role,
              content: message.transcript,
              isPartial: false,
            },
          ]);
        }
      });
    };

    initVapi();

    return () => {
      mounted = false;
      vapiRef.current?.stop?.();
    };
  }, []);

  /* ============================
     START CALL (WORKFLOW MODE)
  ============================ */
  const handleCall = async () => {
    if (!vapiRef.current) return;

    setCallStatus(CallStatus.CONNECTING);

    await vapiRef.current.start(
      undefined,
      undefined,
      undefined,
      process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID
    );
  };

  /* ============================
     END CALL
  ============================ */
  const handleDisconnect = async () => {
    await vapiRef.current?.stop();
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
        transcript: messages.filter(m => !m.isPartial),
        feedbackId,
      });

      if (res.success && res.feedbackId) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        router.push("/");
      }
    };

    postCall();
  }, [callStatus]);

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
          <h3>{userName}</h3>
        </div>
      </div>

      {/* 🔤 SUBTITLES */}
      <div className="mt-6 w-full max-w-3xl mx-auto space-y-2 text-center">
        {messages.slice(-5).map((msg, i) => (
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
