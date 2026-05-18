-- Web Push subscriptions
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- Practitioner weekly availability
CREATE TABLE "PractitionerAvailability" (
    "id" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PractitionerAvailability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PractitionerAvailability_practitionerId_dayOfWeek_startMinu_key" ON "PractitionerAvailability"("practitionerId", "dayOfWeek", "startMinutes");
CREATE INDEX "PractitionerAvailability_practitionerId_idx" ON "PractitionerAvailability"("practitionerId");

ALTER TABLE "PractitionerAvailability" ADD CONSTRAINT "PractitionerAvailability_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Practitioner time-off / exceptions
CREATE TABLE "PractitionerTimeOff" (
    "id" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TIME_OFF',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PractitionerTimeOff_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PractitionerTimeOff_practitionerId_startAt_idx" ON "PractitionerTimeOff"("practitionerId", "startAt");
CREATE INDEX "PractitionerTimeOff_startAt_endAt_idx" ON "PractitionerTimeOff"("startAt", "endAt");

ALTER TABLE "PractitionerTimeOff" ADD CONSTRAINT "PractitionerTimeOff_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
