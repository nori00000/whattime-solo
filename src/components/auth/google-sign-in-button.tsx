"use client";

import { signIn } from "next-auth/react";

type Props = {
  callbackUrl?: string;
};

export function GoogleSignInButton({ callbackUrl = "/dashboard" }: Props) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
      className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
    >
      Continue with Google
    </button>
  );
}
