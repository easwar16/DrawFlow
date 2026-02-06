"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import axios from "axios";
import { CheckCircle2Icon, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  userSigninSchema,
  userSigninType,
  userSignupSchema,
} from "@repo/backend-common/zod";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ButtonGroup } from "@/components/ui/button-group";
import { Label } from "@/components/ui/label";

export default function Auth() {
  const [show, setShow] = useState(false);
  const router = useRouter();
  const [isSignin, setIsSignIn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const resetInputs = () => {
    if (emailRef.current) emailRef.current.value = "";
    if (nameRef.current) nameRef.current.value = "";
    if (photoRef.current) photoRef.current.value = "";
    if (passwordRef.current) passwordRef.current.value = "";
  };
  const signinActionHandler = async () => {
    const payload = {
      email: emailRef?.current?.value,
      password: passwordRef.current?.value,
    };
    const result = userSigninSchema.safeParse(payload);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};

      result.error.issues.forEach((err) => {
        const field = err.path[0] as string | undefined;
        if (field) {
          fieldErrors[field] = err.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    const signedIn = await axios.post(
      `${process.env.NEXT_PUBLIC_HTTP_URL}/signin`,
      payload,
      {
        withCredentials: true,
      }
    );
    if (signedIn.data.token) {
      resetInputs();
    }

    axios.get("/api/auth/me", { withCredentials: true }).then((res) => {
      if (res.data.authenticated) {
        router.replace("/canvas/default");
      }
    });
  };
  const signupActionHandler = async () => {
    const payload = {
      email: emailRef?.current?.value,
      name: nameRef?.current?.value,
      photo: photoRef?.current?.value,
      password: passwordRef.current?.value,
    };

    const result = userSignupSchema.safeParse(payload);
    console.log(payload);
    console.log(result);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};

      result.error.issues.forEach((err) => {
        const field = err.path[0] as string | undefined;
        if (field) {
          fieldErrors[field] = err.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }
    const signup = await axios.post(
      `${process.env.NEXT_PUBLIC_HTTP_URL}/signup`,
      payload
    );
    if (signup.data.userId) {
      resetInputs();
      setIsSignIn(true);
    }
  };

  useEffect(() => {
    axios.get("/api/auth/me", { withCredentials: true }).then((res) => {
      if (res.data.authenticated) {
        router.replace("/canvas/default");
      }
    });
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen justify-center items-center bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <ButtonGroup>
          <Button
            variant="outline"
            onClick={() => setIsSignIn(false)}
            className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-6 py-2.5 rounded-md hover:scale-105 transition-all"
          >
            Sign Up
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsSignIn(true)}
            className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-6 py-2.5 rounded-md hover:scale-105 transition-all"
          >
            Sign In
          </Button>
        </ButtonGroup>
      </div>

      <div className="glass-effect rounded-xl p-10 w-[420px] shadow-xl border border-white/10">
        <div className="flex justify-center my-4 text-2xl font-bold bg-gradient-to-r from-emerald-400 to-pink-400 bg-clip-text text-transparent">
          {isSignin ? "SignIn" : "Signup"}{" "}
        </div>

        {/* Email */}
        <div className="mb-2">
          <div className="grid gap-3">
            <Label className="text-white" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              ref={emailRef}
              type="email"
              placeholder="sample@gmail.com"
              className="text-lg text-white"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-pink-300 mt-1">{errors.email}</p>
          )}
        </div>
        {!isSignin ? (
          <div>
            <div className="mb-2">
              <div className="grid gap-3">
                <Label className="text-white" htmlFor="name">
                  Name
                </Label>
                <Input
                  id="name"
                  ref={nameRef}
                  type="text"
                  placeholder="Name"
                  className="text-lg text-white"
                />
              </div>
              {errors.name && (
                <p className="text-sm text-pink-300 mt-1">{errors.name}</p>
              )}
            </div>
            <div className="mb-2">
              <div className="grid gap-3">
                <Label className="text-white" htmlFor="photo">
                  Photo URL
                </Label>
                <Input
                  id="photo"
                  ref={photoRef}
                  type="text"
                  placeholder="Photo URL"
                  className="text-lg text-white"
                />
              </div>
            </div>
          </div>
        ) : (
          <></>
        )}

        {/* Password + Eye */}
        <div className="relative mb-8">
          <div className="grid gap-3">
            <Label className="text-white" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              ref={passwordRef}
              type={show ? "text" : "password"}
              placeholder="Password"
              className="text-lg pr-12 text-white" // space for the eye icon
            />

            <button
              type="button"
              onClick={() => setShow(!show)}
              className={`absolute top-6 inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200 ${errors.password ? "bottom-6" : " "}`}
            >
              {show ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-pink-300 mt-1">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-center">
          <Button
            size={"lg"}
            variant={"outline"}
            className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-pink-400 bg-clip-text text-transparent"
            onClick={isSignin ? signinActionHandler : signupActionHandler}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
