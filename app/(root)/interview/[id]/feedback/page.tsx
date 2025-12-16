import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewById,
  getFeedbackByInterviewId,
} from "@/lib/actions/general.action";

const FeedbackPage = async ({ params }: any) => {
  const user = await getCurrentUser();
  const interview = await getInterviewById(params.id);

  if (!user || !interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: params.id,
    userId: user.id,
  });

  if (!feedback) redirect("/");

  return (
    <section className="section-feedback">
      <h1>
        Feedback for <span className="capitalize">{interview.role}</span>
      </h1>

      <div className="flex gap-6 mt-4">
        <p>Score: {feedback.totalScore}/100</p>
        <p>{dayjs(feedback.createdAt).format("MMM D, YYYY")}</p>
      </div>

      <p className="mt-6">{feedback.finalAssessment}</p>

      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link href="/">Back to Dashboard</Link>
        </Button>
        <Button asChild>
          <Link href={`/interview/${params.id}`}>Retake</Link>
        </Button>
      </div>
    </section>
  );
};

export default FeedbackPage;
