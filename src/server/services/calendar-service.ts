import { google } from "googleapis";

import { getPrismaClient } from "@/lib/db/prisma";
import type { TimeInterval } from "@/lib/availability/types";
import { decryptSecret } from "@/lib/security/encryption";

async function getGoogleCalendarAccountForUser(userId: string) {
  const prisma = getPrismaClient();
  const account = await prisma.calendarAccount.findFirst({
    where: {
      userId,
      provider: "GOOGLE",
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!account) {
    throw new Error("No Google calendar account is connected for this host.");
  }

  return account;
}

function createOAuthClient(accessToken: string, refreshToken?: string | null) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL,
  );

  client.setCredentials({
    access_token: accessToken || undefined,
    refresh_token: refreshToken ?? undefined,
  });

  return client;
}

async function createCalendarApiForUser(userId: string) {
  const account = await getGoogleCalendarAccountForUser(userId);
  const accessToken = decryptSecret(account.accessTokenEnc);
  const refreshToken = account.refreshTokenEnc
    ? decryptSecret(account.refreshTokenEnc)
    : null;
  const auth = createOAuthClient(accessToken, refreshToken);

  return {
    account,
    calendar: google.calendar({ version: "v3", auth }),
  };
}

export async function syncConnectedCalendars(userId: string) {
  const prisma = getPrismaClient();
  const { account, calendar } = await createCalendarApiForUser(userId);
  const response = await calendar.calendarList.list();
  const items = response.data.items ?? [];

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const externalCalendarId = item.id;

      if (!externalCalendarId) {
        continue;
      }

      await tx.connectedCalendar.upsert({
        where: {
          calendarAccountId_externalCalendarId: {
            calendarAccountId: account.id,
            externalCalendarId,
          },
        },
        update: {
          userId,
          summary: item.summary ?? externalCalendarId,
          isPrimary: Boolean(item.primary),
        },
        create: {
          userId,
          calendarAccountId: account.id,
          externalCalendarId,
          summary: item.summary ?? externalCalendarId,
          isPrimary: Boolean(item.primary),
          selectedForBusyCheck: Boolean(item.primary),
        },
      });
    }
  });

  return prisma.connectedCalendar.findMany({
    where: {
      userId,
      calendarAccountId: account.id,
    },
    orderBy: [{ isPrimary: "desc" }, { summary: "asc" }],
  });
}

export async function getBusyIntervals(input: {
  userId: string;
  from: Date;
  to: Date;
}): Promise<TimeInterval[]> {
  const prisma = getPrismaClient();
  const selectedCalendars = await prisma.connectedCalendar.findMany({
    where: {
      userId: input.userId,
      selectedForBusyCheck: true,
    },
    select: {
      externalCalendarId: true,
    },
  });

  if (selectedCalendars.length === 0) {
    return [];
  }

  const { calendar } = await createCalendarApiForUser(input.userId);
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: input.from.toISOString(),
      timeMax: input.to.toISOString(),
      items: selectedCalendars.map((item) => ({
        id: item.externalCalendarId,
      })),
    },
  });

  const calendars = response.data.calendars ?? {};
  const intervals: TimeInterval[] = [];

  for (const calendarResult of Object.values(calendars)) {
    for (const busy of calendarResult.busy ?? []) {
      if (!busy.start || !busy.end) {
        continue;
      }

      intervals.push({
        start: new Date(busy.start),
        end: new Date(busy.end),
      });
    }
  }

  return intervals;
}

export async function createCalendarEvent(input: {
  userId: string;
  title: string;
  description?: string | null;
  inviteeName: string;
  inviteeEmail: string;
  start: Date;
  end: Date;
  timezone: string;
}) {
  const { calendar } = await createCalendarApiForUser(input.userId);
  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: input.title,
      description: input.description ?? undefined,
      start: {
        dateTime: input.start.toISOString(),
        timeZone: input.timezone,
      },
      end: {
        dateTime: input.end.toISOString(),
        timeZone: input.timezone,
      },
      attendees: [
        {
          displayName: input.inviteeName,
          email: input.inviteeEmail,
        },
      ],
    },
  });

  return {
    id: response.data.id,
  };
}

export async function cancelCalendarEvent(input: {
  userId: string;
  externalEventId: string;
}) {
  const { calendar } = await createCalendarApiForUser(input.userId);

  await calendar.events.delete({
    calendarId: "primary",
    eventId: input.externalEventId,
  });
}

export async function listConnectedCalendars(userId: string) {
  const prisma = getPrismaClient();
  return prisma.connectedCalendar.findMany({
    where: {
      userId,
    },
    orderBy: [{ isPrimary: "desc" }, { summary: "asc" }],
  });
}

export async function updateBusyCheckSelection(input: {
  userId: string;
  calendarId: string;
  selectedForBusyCheck: boolean;
}) {
  const prisma = getPrismaClient();
  const calendar = await prisma.connectedCalendar.findFirst({
    where: {
      id: input.calendarId,
      userId: input.userId,
    },
  });

  if (!calendar) {
    throw new Error("Calendar not found for this host.");
  }

  return prisma.connectedCalendar.update({
    where: {
      id: calendar.id,
    },
    data: {
      selectedForBusyCheck: input.selectedForBusyCheck,
    },
  });
}
