import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { ACTOR_ROLES } from "@/server/authz";
import { persistGoogleAccount } from "@/server/services/auth-persistence-service";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events",
          ].join(" "),
        },
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        if (!token.email) {
          throw new Error("Google sign-in requires an email address.");
        }

        const appUser = await persistGoogleAccount({
          email: token.email,
          name: token.name,
          image: token.picture,
          profile,
          account,
        });

        token.role = ACTOR_ROLES.HOST;
        token.provider = account.provider;
        token.appUserId = appUser.id;
      }

      if (profile?.sub && !token.sub) {
        token.sub = profile.sub;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.appUserId === "string" ? token.appUserId : "";
        session.user.role =
          token.role === ACTOR_ROLES.PLATFORM_ADMIN
            ? ACTOR_ROLES.PLATFORM_ADMIN
            : ACTOR_ROLES.HOST;
      }

      return session;
    },
  },
};
