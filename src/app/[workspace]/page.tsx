import { eq, sql } from "drizzle-orm";
import {
  Activity,
  ArrowUpRight,
  Database,
  TrendingUp,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";
import { withAdmin, withTenant } from "@/server/db/rls";
import { workspaceMembers, workspaces } from "@/server/db/schema";

interface DashboardPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function WorkspaceDashboard({
  params,
}: DashboardPageProps) {
  const { workspace: slug } = await params;

  // Resolve the workspace metadata bypassing RLS (metadata lookup)
  const workspace = await withAdmin(async (adminDb) => {
    return await adminDb.query.workspaces.findFirst({
      where: eq(workspaces.slug, slug),
    });
  });

  if (!workspace) {
    notFound();
  }

  // Retrieve isolated workspace metrics under RLS tenant scope
  const stats = await withTenant(workspace.id, async (tenantDb) => {
    const memberCountResult = await tenantDb
      .select({ count: sql<number>`count(*)` })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspace.id));

    return {
      memberCount: memberCountResult[0]?.count ?? 0,
    };
  });

  // Architectural editorial metrics
  const metrics = [
    {
      name: "Team Members",
      value: stats.memberCount.toString(),
      change: "+1 new this week",
      icon: Users,
    },
    {
      name: "API Invocations",
      value: workspace.plan === "pro" ? "142,892" : "2,410",
      change:
        workspace.plan === "pro" ? "+14.2% growth" : "24% of monthly quota",
      icon: Activity,
    },
    {
      name: "Database Storage",
      value: workspace.plan === "pro" ? "1.84 GB" : "12.4 MB",
      change:
        workspace.plan === "pro" ? "Unbounded RLS active" : "500MB quota limit",
      icon: Database,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground font-sans">
            {workspace.name} Dashboard
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Workspace context rewritten from subdomains. Domain isolation:{" "}
            <code className="text-foreground font-mono text-xs px-1.5 py-0.5 rounded bg-card border border-border">
              {workspace.slug}.lvh.me
            </code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider bg-card border border-border text-foreground">
            {workspace.plan} tier
          </span>
        </div>
      </header>

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <article
            key={m.name}
            className="p-5 bg-card border border-border rounded-lg flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {m.name}
              </span>
              <m.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="mt-4">
              <span className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight tabular-nums">
                {m.value}
              </span>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3 text-muted-foreground" />
                {m.change}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* Feature Walkthrough Showcase */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="p-5 bg-card border border-border rounded-lg flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground mb-2">
              Workspace Isolation Details
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              This dashboard uses PostgreSQL Row-Level Security (RLS) data
              partitioning. All database transactions are executed inside
              session context bound to this tenant identifier:
            </p>
            <div className="bg-card-subtle p-3.5 rounded border border-border font-mono text-xs text-foreground space-y-2">
              <div>
                <span className="text-muted-foreground">
                  {"// Active Tenant RLS Scope ID:"}
                </span>
                <p className="text-foreground mt-0.5 truncate">
                  {workspace.id}
                </p>
              </div>
              <div className="border-t border-border-subtle pt-2">
                <span className="text-muted-foreground">
                  {"// SQL Security isolation policy:"}
                </span>
                <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                  CREATE POLICY tenant_isolation ON workspaces FOR ALL USING
                  (tenant_id = app.current_tenant_id());
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="p-5 bg-card border border-border rounded-lg flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground mb-2">
              Subscription & Resources
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {workspace.plan === "pro"
                ? "Your workspace has active Pro enterprise capabilities. You have Stripe subscription integration, expanded storage quotas, and dedicated database policies."
                : "Your workspace is operating under standard free tier quotas. Invocations are capped at 5,000 monthly executions with standard shared database resources."}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Subscription Status:{" "}
              <span className="text-foreground font-mono uppercase">
                {workspace.subscriptionStatus ?? "Active"}
              </span>
            </div>
            <a
              href="billing"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-muted-foreground transition-colors"
            >
              {workspace.plan === "pro"
                ? "Manage Subscription"
                : "Upgrade to Pro"}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </article>
      </section>
    </div>
  );
}
