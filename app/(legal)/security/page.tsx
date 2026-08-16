export default function SecurityDisclosuresPage() {
  return (
    <article className="prose prose-sm max-w-none space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Security Disclosures</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Access Control</h2>
        <p className="text-sm text-muted-foreground">
          All data access is enforced through role-based Firestore security rules at the database
          layer. Unauthenticated requests are rejected outright, and each role (Owner, Manager,
          Worker, Client) can only read or write data appropriate to its permissions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Data in Transit</h2>
        <p className="text-sm text-muted-foreground">
          All communication with our servers and Firebase backend is encrypted via HTTPS/TLS.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Rate Limiting</h2>
        <p className="text-sm text-muted-foreground">
          API endpoints are protected by rate limiting to mitigate abuse and denial-of-service
          attempts.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Reporting a Vulnerability</h2>
        <p className="text-sm text-muted-foreground">
          If you discover a security vulnerability, please report it to your system administrator
          immediately rather than disclosing it publicly.
        </p>
      </section>
    </article>
  );
}