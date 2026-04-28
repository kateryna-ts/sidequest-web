export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink dark:text-parchment">
      <h1 className="font-serif italic text-4xl mb-2">Privacy Policy</h1>
      <p className="text-sm text-graphite dark:text-chalk mb-10">Last updated: April 27, 2026</p>

      <section className="flex flex-col gap-8 text-sm leading-relaxed text-graphite dark:text-chalk">

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">What is Side Quest?</h2>
          <p>Side Quest is a social app that helps people find companions for everyday errands — coffee runs, grocery trips, farmers markets, and more. We match users based on shared interests and proximity.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Information We Collect</h2>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li><strong>Account data:</strong> email address (if you sign in with email), or Instagram username and user ID (if you sign in with Instagram).</li>
            <li><strong>Location data:</strong> approximate location when you post a quest, used only to match you with nearby people. We do not store or track your location continuously.</li>
            <li><strong>Quest data:</strong> the errand type, time, and note you post.</li>
            <li><strong>Instagram data:</strong> if you connect Instagram, we access your public posts to build an interest profile ("taste fingerprint") used for matching. We store a derived interest vector — not your posts or images.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">How We Use Your Information</h2>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>To match you with compatible people going on similar errands nearby.</li>
            <li>To send and receive "waves" (match requests) between users.</li>
            <li>To generate icebreaker messages using AI when two users match.</li>
            <li>We do not sell your data to third parties. Ever.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Data Sharing</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 mt-1">
            <li><strong>Supabase</strong> — database and authentication (data stored in the US).</li>
            <li><strong>OpenAI</strong> — generates icebreaker messages from anonymized match data.</li>
            <li><strong>Meta / Instagram</strong> — used only when you choose to sign in or connect Instagram.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Data Retention</h2>
          <p>Quests expire automatically after 24 hours. You can delete your account at any time from your profile — this permanently removes all your data including quests, waves, and your interest profile.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Your Rights</h2>
          <p>You can request a copy of your data or ask us to delete it at any time by emailing us or using the in-app account deletion option. If you signed in with Instagram, you can also revoke access through Instagram&apos;s app settings — we will remove your data within 30 days.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Children</h2>
          <p>Side Quest is not intended for users under 13. We do not knowingly collect data from children.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Contact</h2>
          <p>Questions? Email us at <a href="mailto:privacy@sidequest.app" className="underline underline-offset-2">privacy@sidequest.app</a>.</p>
        </div>

      </section>
    </main>
  )
}
