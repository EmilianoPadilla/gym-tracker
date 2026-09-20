import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-8 text-chalk">
      <h1 className="font-display text-3xl font-semibold mb-1">Privacy Policy</h1>
      <p className="text-chalkdim text-sm mb-6">Gym Tracker &middot; Last updated September 2026</p>

      <div className="space-y-5 text-sm leading-relaxed">
        <p>
          Gym Tracker is a personal fitness-tracking app built for private use by the developer,
          their family, and friends. This page explains what information the app collects and how
          it's used.
        </p>

        <div>
          <h2 className="font-semibold text-base mb-1">Information we collect</h2>
          <p>
            When you create an account, we collect your name, email address, and (if you choose to
            sign in with Google) your Google profile name, email, and profile picture. We also
            store the workout routines, exercise logs, and body metrics (weight, muscle mass, fat
            percentage, visceral fat) that you enter into the app.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-1">How we use your information</h2>
          <p>
            Your information is used solely to operate the app for you: authenticating your
            account, storing your personal workout data, and displaying your own progress back to
            you. We do not sell, share, or use your data for advertising, and we do not access
            other Google account data beyond your basic profile (name, email, picture) used to log
            you in.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-1">Where your data is stored</h2>
          <p>
            Data is stored in a private database and is only accessible through your logged-in
            account. Each person's routines, logs, and metrics are visible only to them.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-1">Google Sign-In</h2>
          <p>
            If you sign in with Google, we receive only your basic profile information (name,
            email, profile picture) via Google's standard sign-in flow. We do not request access to
            your Gmail, Drive, Calendar, or any other Google service.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-1">Deleting your data</h2>
          <p>
            To delete your account and all associated data, contact the developer at the email
            below.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-1">Contact</h2>
          <p>
            Questions about this policy or your data can be sent to{" "}
            <a href="mailto:emilianopadillarobles@gmail.com" className="underline text-brasslight">
              emilianopadillarobles@gmail.com
            </a>
            .
          </p>
        </div>
      </div>

      <Link to="/login" className="inline-block mt-8 text-sm text-chalkdim underline">
        Back to login
      </Link>
    </div>
  );
}
