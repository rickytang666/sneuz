import { IconChevronLeft } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy policy | Sneuz",
};

const REPO_URL = "https://github.com/rickytang666/sneuz";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Button variant="ghost" asChild className="-ml-3 mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <IconChevronLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      <h1 className="text-3xl font-semibold tracking-tight">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated November 16, 2026
      </p>

      <div className="mt-8 space-y-8 leading-relaxed [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <section>
          <h2>What Sneuz stores</h2>
          <ul>
            <li>
              Your account: name, email address and profile picture, from email
              sign-up or Google sign-in
            </li>
            <li>
              Sign-in sessions, including the IP address and browser user agent
              of each session
            </li>
            <li>
              Your sleep sessions (bedtime and wake time) and settings such as
              your target bedtime and time zone
            </li>
            <li>API keys you create, stored only as a hash</li>
          </ul>
        </section>

        <section>
          <h2>Google Health</h2>
          <p>
            If you connect Google Health, Sneuz asks for read-only access to
            your sleep data. It reads the nights in a date range you choose,
            only when you start an import, and saves the start and end time of
            each night you confirm. Sneuz never writes to Google Health and
            never reads other health data.
          </p>
          <p className="mt-2">
            Sneuz&apos;s use of data received from Google APIs follows the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </section>

        <section>
          <h2>How it&apos;s used</h2>
          <p>
            Your data is used only to run Sneuz for you: showing your sleep
            history and stats, and answering requests made with your API keys.
            It is not sold, shared, or used for advertising.
          </p>
        </section>

        <section>
          <h2>Where it&apos;s stored</h2>
          <p>
            The app runs on Vercel and the database is hosted on Neon. Both
            process data only to provide those services.
          </p>
        </section>

        <section>
          <h2>Deleting your data</h2>
          <p>
            You can delete sleep sessions and API keys in the app at any time.
            To delete your account and everything in it, or to disconnect Google
            Health, reach out through the{" "}
            <a
              href={REPO_URL}
              className="underline underline-offset-4 hover:text-foreground"
            >
              GitHub repository
            </a>
            . You can also revoke Sneuz&apos;s access in your Google account
            settings.
          </p>
        </section>
      </div>
    </div>
  );
}
