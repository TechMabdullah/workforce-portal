export default function TermsOfServicePage() {
  return (
    <article className="prose prose-sm max-w-none space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Acceptance of Terms</h2>
        <p className="text-sm text-muted-foreground">
          By accessing or using this platform, you agree to be bound by these Terms of Service and
          any policies referenced herein.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Account Responsibilities</h2>
        <p className="text-sm text-muted-foreground">
          You are responsible for maintaining the confidentiality of your login credentials and for
          all activity that occurs under your account. Clock-ins, order updates, and financial entries
          submitted under your account are treated as authoritative records.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Acceptable Use</h2>
        <p className="text-sm text-muted-foreground">
          The platform may not be used to submit false attendance records, falsify delivery
          confirmations, or misrepresent financial transactions. Violations may result in account
          suspension.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Service Availability</h2>
        <p className="text-sm text-muted-foreground">
          We aim for high availability but do not guarantee uninterrupted access. Scheduled
          maintenance or unforeseen outages may temporarily affect service.
        </p>
      </section>
    </article>
  );
}