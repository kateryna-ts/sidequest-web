export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink dark:text-parchment">
      <h1 className="font-serif italic text-4xl mb-2">Terms of Use</h1>
      <p className="text-sm text-graphite dark:text-chalk mb-10">Last updated: April 29, 2026</p>

      <section className="flex flex-col gap-8 text-sm leading-relaxed text-graphite dark:text-chalk">

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Acceptance of Terms</h2>
          <p>By creating an account or using Side Quest, you agree to these Terms of Use. If you do not agree, do not use the service. You must be at least 18 years old to use Side Quest.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">What Side Quest Does</h2>
          <p>Side Quest is a social platform that helps people find companions for everyday errands — coffee runs, grocery trips, farmers markets, and similar activities. We match users based on location and shared interests derived from their activity.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Your Account</h2>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>You are responsible for keeping your account credentials secure.</li>
            <li>You must provide accurate information when creating your profile.</li>
            <li>You may only create one account per person.</li>
            <li>You can delete your account at any time from your profile settings.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 mt-1">
            <li>Use Side Quest for any illegal purpose or in violation of any laws.</li>
            <li>Harass, threaten, or harm other users.</li>
            <li>Post false, misleading, or deceptive content.</li>
            <li>Create fake accounts or impersonate others.</li>
            <li>Attempt to reverse-engineer, scrape, or interfere with the service.</li>
            <li>Use the app for commercial solicitation without our written permission.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">User Content</h2>
          <p>Content you post (quest descriptions, notes, profile information) remains yours. By posting it, you grant Side Quest a license to display it to other users as part of the service. You are responsible for everything you post.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Safety</h2>
          <p>Side Quest is for meeting people in public settings during everyday errands. Always meet in public places, trust your instincts, and report any user who makes you uncomfortable using the in-app report feature or by emailing <a href="mailto:safety@sidequest.app" className="underline underline-offset-2">safety@sidequest.app</a>. We reserve the right to remove any user at our discretion.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Instagram Integration</h2>
          <p>If you connect your Instagram account, you authorize Side Quest to access your public posts to generate an interest profile used for matching. You can disconnect Instagram at any time from your profile settings. Revoking access through Instagram&apos;s app also revokes our access — we will remove your derived data within 30 days.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Termination</h2>
          <p>We may suspend or terminate your account if you violate these terms, if we believe your account poses a safety risk, or at our discretion with reasonable notice. You may delete your account at any time.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Disclaimers</h2>
          <p>Side Quest is provided &quot;as is.&quot; We do not guarantee uninterrupted service, the accuracy of match suggestions, or the conduct of other users. Meeting people in person involves inherent risk — use your own judgment.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Side Quest is not liable for any indirect, incidental, or consequential damages arising from your use of the service or interactions with other users.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Changes to These Terms</h2>
          <p>We may update these terms from time to time. Continued use of Side Quest after changes are posted means you accept the updated terms. We will notify users of material changes via email or in-app notice.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink dark:text-parchment mb-2">Contact</h2>
          <p>Questions about these terms? Email us at <a href="mailto:legal@sidequest.app" className="underline underline-offset-2">legal@sidequest.app</a>.</p>
        </div>

      </section>
    </main>
  )
}
