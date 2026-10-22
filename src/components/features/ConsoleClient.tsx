"use client";

import { SignInButton, SignOutButton } from "@clerk/nextjs";
import {
  ArrowRight,
  FolderKanban,
  LayoutGrid,
  Plus,
  Rocket,
  ShieldAlert,
} from "lucide-react";
import { useActionState, useState } from "react";
import { createWorkspace } from "@/server/actions/workspace";

interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
}

interface ConsoleClientProps {
  isAuthenticated: boolean;
  userWorkspaces: WorkspaceItem[];
}

interface ActionState {
  error: string | null;
  success: string | null;
}

export function ConsoleClient({
  isAuthenticated,
  userWorkspaces,
}: ConsoleClientProps) {
  const [slugPrefix, setSlugPrefix] = useState("");

  const [createState, createAction, createPending] = useActionState(
    async (
      _prevState: ActionState,
      formData: FormData,
    ): Promise<ActionState> => {
      const name = formData.get("name") as string;
      const slug = formData.get("slug") as string;

      if (!name || !slug) {
        return { error: "Name and Slug are required", success: null };
      }

      // Slug validation (alphanumeric and dashes only)
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return {
          error:
            "Slug must contain only lowercase letters, numbers, and dashes",
          success: null,
        };
      }

      try {
        const res = await createWorkspace({ name, slug });
        if (res.error) {
          return { error: res.error, success: null };
        }

        // Successful workspace creation: redirect to subdomain context!
        const host = window.location.host;
        const protocol = window.location.protocol;
        const parts = host.split(".");

        let redirectUrl = "";
        if (parts.length > 2) {
          parts[0] = slug;
          redirectUrl = `${protocol}//${parts.join(".")}`;
        } else {
          redirectUrl = `${protocol}//${slug}.${host}`;
        }

        window.location.href = redirectUrl;
        return { success: "Redirecting...", error: null };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create workspace";
        return { error: message, success: null };
      }
    },
    { error: null, success: null } as ActionState,
  );

  const getWorkspaceUrl = (slug: string) => {
    if (typeof window === "undefined") return "";
    const host = window.location.host;
    const protocol = window.location.protocol;
    const parts = host.split(".");

    if (parts.length > 2) {
      parts[0] = slug;
      return `${protocol}//${parts.join(".")}`;
    }
    return `${protocol}//${slug}.${host}`;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setSlugPrefix(generatedSlug);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-5xl mx-auto w-full">
      {/* Hero Section */}
      <section className="text-center space-y-3 py-10 max-w-2xl mx-auto">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono text-muted-foreground border border-border bg-card">
          Next.js 15 · Neon Postgres RLS
        </span>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground font-sans">
          Multi-Tenant Workspace Console
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          Production multi-tenant architecture with PostgreSQL Row-Level
          Security, subdomain tenancy routing, Clerk authentication, and Stripe
          billing.
        </p>
      </section>

      {/* Main console content */}
      {!isAuthenticated ? (
        <div className="w-full max-w-md p-6 md:p-8 bg-card border border-border rounded-lg text-center space-y-6 mt-4">
          <div className="space-y-1">
            <h2 className="text-base font-medium text-foreground">
              Sign In to Continue
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Authenticate to manage workspaces and access isolated tenant
              environments.
            </p>
          </div>
          <SignInButton>
            <button
              type="button"
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 focus:outline-none"
            >
              Sign In to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </SignInButton>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Workspaces List */}
          <section className="space-y-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-muted-foreground" />
              Workspaces ({userWorkspaces.length})
            </h2>

            {userWorkspaces.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded-lg text-center bg-card">
                <LayoutGrid className="w-8 h-8 text-muted-foreground/60 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-foreground">
                  No workspaces found
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first workspace context using the form.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {userWorkspaces.map((ws) => (
                  <a
                    key={ws.id}
                    href={getWorkspaceUrl(ws.slug)}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-muted-foreground/30 hover:bg-card-subtle transition-colors group"
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {ws.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                        {ws.slug}.lvh.me
                      </p>
                    </div>
                    <span className="text-xs text-foreground font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Enter
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* Create Workspace Form */}
          <section className="p-6 bg-card border border-border rounded-lg space-y-5 h-fit">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-muted-foreground" />
              Create New Workspace
            </h2>

            <form action={createAction} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-xs text-muted-foreground font-medium"
                >
                  Workspace Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  placeholder="Acme Corp"
                  onChange={handleNameChange}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-muted-foreground/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="slug"
                  className="text-xs text-muted-foreground font-medium"
                >
                  Subdomain Slug
                </label>
                <div className="flex rounded-md bg-background border border-border focus-within:border-muted-foreground/50 overflow-hidden transition-colors">
                  <input
                    type="text"
                    name="slug"
                    id="slug"
                    required
                    placeholder="acme"
                    value={slugPrefix}
                    onChange={(e) =>
                      setSlugPrefix(
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      )
                    }
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none"
                  />
                  <span className="bg-card-subtle border-l border-border text-xs text-muted-foreground font-mono px-3 flex items-center select-none">
                    .lvh.me
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={createPending}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 focus:outline-none"
              >
                <Rocket className="w-4 h-4 shrink-0" />
                {createPending ? "Creating Workspace..." : "Create Workspace"}
              </button>

              {createState.error && (
                <div className="p-3 rounded-md bg-destructive/20 border border-destructive-border text-xs text-destructive-foreground font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {createState.error}
                </div>
              )}
              {createState.success && (
                <p className="text-xs text-foreground font-medium">
                  {createState.success}
                </p>
              )}
            </form>
          </section>
        </div>
      )}

      {/* Sign Out Trigger when authenticated */}
      {isAuthenticated && (
        <div className="mt-10 text-center">
          <SignOutButton>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              Sign out of account
            </button>
          </SignOutButton>
        </div>
      )}
    </div>
  );
}
