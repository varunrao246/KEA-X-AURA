# Supabase Auth setup

The login page uses Supabase Auth for real email/password accounts. The current prototype keeps
curriculum, mastery, attempts and interventions in its existing local AURA store so the adaptive
engine remains unchanged; Supabase is the identity backend in this delivery.

## Before sharing the app

1. In Supabase, open **Authentication → Providers → Email** and ensure email/password sign-in is enabled.
   For a local demo, turn **Confirm Email** off in that Email provider. This prevents confirmation
   messages and lets registrations sign in immediately. Turn it back on for a public production app.
2. In **Authentication → URL Configuration**, add your deployed URL and your local development URL
   (for example `http://localhost:3000`) as redirect URLs. This is required when email confirmation
   is enabled.
3. Copy `.env.example` to `.env.local` if it is not already present. Set a long, random
   `AUTH_SECRET` before production deployment. Never add a Supabase service-role key to this app.
4. Optionally set `FACILITATOR_INVITE_CODE` to limit facilitator registration to your school team.

## Account behaviour

- A student who registers receives a fresh profile and mastery row for each existing topic, then
  continues through onboarding to choose interests.
- A facilitator receives the facilitator experience and cannot enter student routes. Facilitator
  access is provisioned only through AURA's registration route; a user who signs up directly in
  Supabase is treated as a student until an administrator provisions the role in AURA.
- Demo accounts are intentionally retained under **Use a ready-made demo account** so judges can
  show the seeded adaptive story without creating credentials.
- When Supabase **Confirm email** is enabled, registration tells the user to verify their inbox;
  the signed AURA session is issued only after a successful sign-in.

## Scope of this integration

Supabase Auth is connected and no service-role credential is required. Moving the full adaptive
store into Supabase Postgres should be a separate migration: it needs the final table design, RLS
policies and a safe data migration for mastery, attempts and interventions. That work should not
be guessed or mixed into an authentication change.

## “Email rate limit exceeded”

This is an upstream Supabase quota, not a database error in AURA. Supabase's built-in mail provider
allows only two authentication emails per hour per project. For development, disable **Confirm
Email** as above, wait for the quota to reset, and delete any unwanted unconfirmed test users in
**Authentication → Users** before registering the same address again. For production, configure a
transactional mail provider in **Authentication → Emails → SMTP Settings**; the built-in provider
is not intended for real traffic.
