import { describe, expect, it } from "vitest";

import { parseAppEnv } from "./env";

describe("parseAppEnv", () => {
  it("accepts a fully configured environment object", () => {
    const env = parseAppEnv({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      NEXTAUTH_SECRET: "secret",
      NEXTAUTH_URL: "http://localhost:3000",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      GOOGLE_ENCRYPTION_KEY: "encryption-key",
      RESEND_API_KEY: "resend-key",
      MAIL_FROM: "noreply@example.com",
      APP_TIMEZONE: "Asia/Seoul",
    });

    expect(env.APP_TIMEZONE).toBe("Asia/Seoul");
    expect(env.MAIL_FROM).toBe("noreply@example.com");
  });

  it("fails when a required key is missing", () => {
    expect(() =>
      parseAppEnv({
        NODE_ENV: "development",
        NEXTAUTH_SECRET: "secret",
        NEXTAUTH_URL: "http://localhost:3000",
        GOOGLE_CLIENT_ID: "google-client-id",
        GOOGLE_CLIENT_SECRET: "google-client-secret",
        GOOGLE_ENCRYPTION_KEY: "encryption-key",
        RESEND_API_KEY: "resend-key",
        MAIL_FROM: "noreply@example.com",
      }),
    ).toThrow();
  });
});
