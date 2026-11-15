import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Privacy notice, terms and contact page.
 *
 * They describe what PinPoint really does. The three values below are set at build time (see .env.example);
 * until they are, a visible "[set ...]" marker is shown so an unfinished page cannot go live unnoticed.
 * This is a plain-language draft, not legal advice: have it checked (DPDP Act 2023, IT Rules 2021) before launch.
 */
const env = import.meta.env as Record<string, string | undefined>;
const OPERATOR = env.VITE_OPERATOR_NAME || '[set VITE_OPERATOR_NAME]';
const CONTACT_EMAIL = env.VITE_CONTACT_EMAIL || '[set VITE_CONTACT_EMAIL]';
const GRIEVANCE_OFFICER = env.VITE_GRIEVANCE_OFFICER || '[set VITE_GRIEVANCE_OFFICER]';
const UPDATED = '15 November 2026';

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-10">
      <h1 className="text-5xl">{title}</h1>
      <p className="label mt-1">Last updated {UPDATED}</p>
      <div className="mt-6 flex flex-col gap-4 text-[15px] leading-relaxed [&_h2]:mt-4 [&_h2]:text-2xl [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
    </div>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy notice">
      <p>
        PinPoint is a community map. This page says what we keep about you, why, who can see it, and how to have it
        deleted. It is run by <strong>{OPERATOR}</strong>.
      </p>

      <h2>What we keep</h2>
      <ul>
        <li><strong>Your account:</strong> e-mail address, username, display name, short bio, and your password in a scrambled (hashed) form. We cannot read your password.</li>
        <li><strong>What you add:</strong> maps, places (name, description, tags, coordinates), photos, notes, confirmations ("still here") and reports.</li>
        <li><strong>Security records:</strong> the time and IP address of sign-ups, sign-ins and failed sign-ins, and a log of who deleted or removed what. We use them to stop abuse and to investigate problems.</li>
      </ul>
      <p>We do not use advertising or analytics trackers, and we do not sell your data.</p>

      <h2>Who can see it</h2>
      <ul>
        <li><strong>Public maps and the places on them</strong> can be seen by anyone, with your username and display name as the author. Do not put your home address in a public place.</li>
        <li><strong>Private maps</strong> can be seen by you and by people you share them with.</li>
        <li>Your e-mail address is not shown to other users.</li>
        <li><strong>Photos:</strong> we remove hidden details such as GPS position, time and camera model from every photo you upload, but the picture itself can show where you are. Anyone who has the link to a photo can open it.</li>
      </ul>

      <h2>Other services the page talks to</h2>
      <ul>
        <li>Map pictures come from OpenStreetMap, and fonts from Google Fonts. Your browser contacts them when a page loads, so they see your IP address.</li>
        <li>If you press "locate me", your browser asks permission and we use your position only to centre the map on your device.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        Until you delete it. Deleting your account (Profile, "Delete account") removes your account and everything
        you own, including your maps with all the places on them, your places, your photos and notes. Copies in
        backups disappear when the backup expires (about 30 days). Security records without your name may be kept for up to a year.
      </p>

      <h2>Your rights</h2>
      <p>
        You can see and edit your details on your profile page, delete your account there, and ask us for a copy of
        your data, a correction, or to remove content about you. Write to <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        If we do not answer in 15 days, or you are not happy with the answer, contact our grievance officer on the{' '}
        <Link to="/contact" className="underline">contact page</Link>. Under India's Digital Personal Data Protection Act 2023 you may also
        complain to the Data Protection Board of India.
      </p>

      <h2>Children</h2>
      <p>PinPoint is for people aged 18 and over. If you think a child has made an account, tell us and we will delete it.</p>

      <h2>Changes</h2>
      <p>If this notice changes in a way that matters, we will say so on the sign-in page.</p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of use">
      <p>By creating an account or adding content to PinPoint you agree to these terms. PinPoint is run by <strong>{OPERATOR}</strong>.</p>

      <h2>Your account</h2>
      <ul>
        <li>You must be 18 or older, give a real e-mail address, and keep your password to yourself.</li>
        <li>You are responsible for what is done with your account.</li>
      </ul>

      <h2>What you add</h2>
      <ul>
        <li>You keep ownership of your content. You allow PinPoint to store it and show it to the people who can see it (everyone for public maps).</li>
        <li>Only add places and photos you have the right to share. Do not add photos of people without their permission.</li>
        <li>Do not add anything unlawful, hateful, misleading, or spam, anything that exposes private homes or personal details, or places that are dangerous to visit without a clear warning.</li>
        <li>Do not try to break, overload or scrape the service, or access other people's private data.</li>
      </ul>

      <h2>Moderation</h2>
      <p>
        Anyone can report a place. Moderators can remove places and may remove accounts that break these terms. Map
        owners can remove places from their own maps. We may remove content without notice when it breaks these terms or the law.
      </p>

      <h2>Takedown requests</h2>
      <p>
        If something on PinPoint is unlawful, infringes your rights, or shows your personal information, write to{' '}
        <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with a link to the place and what is wrong. We aim to act within 72 hours.
      </p>

      <h2>No guarantees</h2>
      <p>
        Places are added by people and may be wrong, closed or unsafe. Check before you travel. PinPoint is provided "as
        is", without promises that it is always available or free of mistakes, and we are not liable for loss caused by relying on it, as far as the law allows.
      </p>

      <h2>Ending your use</h2>
      <p>You can delete your account at any time from your profile. See the <Link to="/privacy" className="underline">privacy notice</Link> for what happens to your data.</p>
    </Page>
  );
}

export function Contact() {
  return (
    <Page title="Contact">
      <p>For questions, takedown requests and privacy requests write to:</p>
      <p>
        <strong>{OPERATOR}</strong><br />
        <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h2>Grievance officer</h2>
      <p>
        If you have a complaint about content or about how your data is handled, and you are not satisfied with our first answer:
      </p>
      <p>
        <strong>{GRIEVANCE_OFFICER}</strong><br />
        <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <p>We acknowledge complaints within 24 hours and aim to resolve them within 15 days.</p>
    </Page>
  );
}
