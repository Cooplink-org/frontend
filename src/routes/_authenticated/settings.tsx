import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Cooplink" },
      { name: "description", content: "Manage your Cooplink account settings." },
      { property: "og:title", content: "Settings — Cooplink" },
      { property: "og:description", content: "Manage your Cooplink account settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">settings</div>
      <h1 className="mt-2 font-mono text-2xl tracking-tight text-foreground">Account</h1>

      <div className="mt-6 space-y-4">
        <Section title="Profile">
          <FieldRow label="Username" value="—" />
          <FieldRow label="Email" value="—" />
          <FieldRow label="Display name" value="—" />
        </Section>
        <Section title="Security">
          <FieldRow label="Two-factor auth" value="Not enabled" />
          <FieldRow label="Active sessions" value="1" />
        </Section>
        <Section title="Connected accounts">
          <FieldRow label="GitHub" value="Not connected" />
        </Section>
        <Section title="Notifications">
          <FieldRow label="Sale notifications" value="Email" />
          <FieldRow label="Review notifications" value="Email" />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md border border-border-subtle bg-background">
      <div className="border-b border-border-subtle px-5 py-2.5 font-mono text-sm text-foreground">
        {title}
      </div>
      <div className="divide-y divide-border-subtle">{children}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="font-mono text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm text-foreground">{value}</div>
    </div>
  );
}
