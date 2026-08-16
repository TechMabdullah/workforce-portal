export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-sm max-w-none space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Data We Collect</h2>
        <p className="text-sm text-muted-foreground">
          We collect account information (name, email, phone number), attendance data (clock-in/out
          timestamps, geolocation coordinates, verification photos), order and delivery records, chat
          messages, and financial ledger entries necessary to operate the workforce management platform.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Geolocation Processing</h2>
        <p className="text-sm text-muted-foreground">
          Location data is captured only at the moment of clock-in to verify attendance against
          registered business coordinates. We do not track location continuously or outside of the
          clock-in action.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Media &amp; Storage</h2>
        <p className="text-sm text-muted-foreground">
          Verification photos, proof-of-delivery images, and receipt uploads are stored securely and
          are only accessible to authorized personnel (administrators, managers, and the individual
          the record belongs to) per our role-based access rules.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Data Retention</h2>
        <p className="text-sm text-muted-foreground">
          Attendance, order, and financial records are retained for the duration of your employment
          or business relationship with the company, plus any additional period required by applicable
          labor or financial recordkeeping law.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Data Deletion Requests</h2>
        <p className="text-sm text-muted-foreground">
          You may request deletion of your personal data by contacting your organization&apos;s administrator.
          Note that certain records (e.g. financial ledger entries) may be retained where required for
          legal or accounting compliance, even after a deletion request.
        </p>
      </section>
    </article>
  );
}