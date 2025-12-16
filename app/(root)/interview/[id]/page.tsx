import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";

export default async function Home() {
  const user = await getCurrentUser();

  // ❌ DO NOT REDIRECT HERE
  if (!user) return null;

  const [userInterviews, latestInterviews] = await Promise.all([
    getInterviewsByUserId(user.id),
    getLatestInterviews({ userId: user.id }),
  ]);

  return (
    <>
      {/* CTA */}
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <Button asChild className="btn-primary">
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>

        <Image src="/robot.png" alt="robot" width={400} height={400} />
      </section>

      {/* Your Interviews */}
      <section className="mt-10">
        <h2>Your Interviews</h2>
        <div className="interviews-section">
          {userInterviews.length ? (
            userInterviews.map(interview => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>No interviews yet</p>
          )}
        </div>
      </section>

      {/* Take Interviews */}
      <section className="mt-10">
        <h2>Take Interviews</h2>
        <div className="interviews-section">
          {latestInterviews.length ? (
            latestInterviews.map(interview => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>No interviews available</p>
          )}
        </div>
      </section>
    </>
  );
}
