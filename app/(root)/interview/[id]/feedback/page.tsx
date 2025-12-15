import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

const FeedbackPage = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  if (!feedback) redirect("/");

  return (
    <section className="section-feedback">
      <h1 className="text-4xl font-semibold text-center">
        Feedback on the <span className="capitalize">{interview.role}</span>{" "}
        Interview
      </h1>

      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <Image src="/star.svg" width={22} height={22} alt="star" />
          <p>
            Overall Score:{" "}
            <span className="font-bold text-primary-200">
              {feedback.totalScore}
            </span>
            /100
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
          <p>{dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")}</p>
        </div>
      </div>

      <hr className="my-6" />

      <p>{feedback.finalAssessment}</p>

      <div className="mt-6">
        <h2 className="font-semibold">Breakdown:</h2>
        {feedback.categoryScores.map(
          (category: Feedback["categoryScores"][0], index: number) => (
            <div key={index}>
              <p className="font-bold">
                {index + 1}. {category.name} ({category.score}/100)
              </p>
              <p>{category.comment}</p>
            </div>
          )
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold">Strengths</h3>
        <ul>
          {feedback.strengths.map((s: string, i: number) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold">Areas for Improvement</h3>
        <ul>
          {feedback.areasForImprovement.map((a: string, i: number) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>

      <div className="flex gap-4 mt-8">
        <Button className="btn-secondary flex-1">
          <Link href="/">Back to Dashboard</Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link href={`/interview/${id}`}>Retake Interview</Link>
        </Button>
      </div>
    </section>
  );
};

export default FeedbackPage;
