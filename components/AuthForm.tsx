"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FormField";

type AuthFormProps = {
  type: "sign-in" | "sign-up";
};

const authFormSchema = (type: AuthFormProps["type"]) =>
  z.object({
    name: type === "sign-up" ? z.string().min(3, "Name is too short") : z.string().optional(),
    email: z.string().email("Invalid email"),
    password: z.string().min(3, "Password too short"),
  });

const AuthForm = ({ type }: AuthFormProps) => {
  const router = useRouter();
  const isSignIn = type === "sign-in";

  const form = useForm<z.infer<ReturnType<typeof authFormSchema>>>({
    resolver: zodResolver(authFormSchema(type)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<ReturnType<typeof authFormSchema>>) => {
    try {
      if (!isSignIn) {
        // ================= SIGN UP =================
        const { name, email, password } = data;

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success("Account created successfully. Please sign in.");

        // ✅ force fresh auth page
        window.location.replace("/sign-in");
        return;
      }

      // ================= SIGN IN =================
      const { email, password } = data;

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const idToken = await userCredential.user.getIdToken();

      if (!idToken) {
        toast.error("Authentication failed. Please try again.");
        return;
      }

      const result = await signIn({ email, idToken });

      if (!result?.success) {
        toast.error("Sign in failed. Please try again.");
        return;
      }

      toast.success("Signed in successfully");

      // ✅ HARD redirect (critical for App Router + server auth)
      window.location.replace("/");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center items-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">PrepWise</h2>
        </div>

        <h3 className="text-center">
          Practice job interviews with AI
        </h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-4"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your name"
                type="text"
              />
            )}

            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Your email address"
              type="email"
            />

            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

            <Button
              type="submit"
              className="btn w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Please wait..."
                : isSignIn
                ? "Sign In"
                : "Create Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm">
          {isSignIn ? "No account yet?" : "Already have an account?"}
          <Link
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="ml-1 font-bold text-user-primary"
          >
            {isSignIn ? "Sign Up" : "Sign In"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
