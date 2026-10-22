"use client";

import { Mail, Shield, UserMinus, UserPlus } from "lucide-react";
import { useActionState, useTransition } from "react";
import {
  inviteMember,
  removeMember,
  updateMemberRole,
} from "@/server/actions/workspace";

interface Member {
  role: "owner" | "admin" | "member";
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  expiresAt: Date;
}

interface MembersClientProps {
  workspaceSlug: string;
  currentUserId: string;
  initialMembers: Member[];
  initialInvitations: Invitation[];
}

interface ActionState {
  error: string | null;
  success: string | null;
}

export function MembersClient({
  workspaceSlug,
  currentUserId,
  initialMembers,
  initialInvitations,
}: MembersClientProps) {
  const [isPending, startTransition] = useTransition();

  // Invite action state with explicit typing
  const [inviteState, inviteAction, invitePending] = useActionState(
    async (
      _prevState: ActionState,
      formData: FormData,
    ): Promise<ActionState> => {
      const email = formData.get("email") as string;
      const role = formData.get("role") as "admin" | "member";

      if (!email) return { error: "Email is required", success: null };

      try {
        const res = await inviteMember({ workspaceSlug, email, role });
        if (res.error) {
          return { error: res.error, success: null };
        }
        return { success: "Invitation sent successfully!", error: null };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send invitation";
        return {
          error: message,
          success: null,
        };
      }
    },
    { error: null, success: null } as ActionState,
  );

  const handleRoleChange = async (userId: string, role: "admin" | "member") => {
    startTransition(async () => {
      try {
        const res = await updateMemberRole({ workspaceSlug, userId, role });
        if (res.error) alert(res.error);
        else window.location.reload();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update role";
        alert(message);
      }
    });
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    startTransition(async () => {
      try {
        const res = await removeMember({ workspaceSlug, userId });
        if (res.error) alert(res.error);
        else window.location.reload();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to remove member";
        alert(message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Invite Member Section */}
      <section className="p-5 md:p-6 bg-card border border-border rounded-lg">
        <h2 className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
          <UserPlus className="w-4 h-4 text-muted-foreground" />
          Invite Team Member
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Send an invitation to join this workspace under RLS tenant security
          scope.
        </p>

        <form action={inviteAction} className="space-y-4 max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="colleague@company.com"
                required
                className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-muted-foreground/50 transition-colors"
              />
            </div>

            <div className="w-full sm:w-36">
              <select
                name="role"
                id="role"
                defaultValue="member"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:border-muted-foreground/50 transition-colors uppercase font-mono"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={invitePending}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 focus:outline-none"
            >
              {invitePending ? "Sending..." : "Send Invite"}
            </button>
          </div>

          {inviteState.error && (
            <div className="p-3 rounded-md bg-destructive/20 border border-destructive-border text-xs text-destructive-foreground font-medium">
              {inviteState.error}
            </div>
          )}
          {inviteState.success && (
            <p className="text-xs text-foreground font-medium">
              {inviteState.success}
            </p>
          )}
        </form>
      </section>

      {/* Members List */}
      <section className="p-5 md:p-6 bg-card border border-border rounded-lg space-y-4">
        <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          Active Members ({initialMembers.length})
        </h2>

        <div className="divide-y divide-border-subtle overflow-hidden">
          {initialMembers.map((member) => (
            <div
              key={member.user.id}
              className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* biome-ignore lint/performance/noImgElement: Clerk avatar dynamic fetch */}
                <img
                  src={
                    member.user.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${member.user.name}`
                  }
                  alt={member.user.name || "User Avatar"}
                  className="w-8 h-8 rounded-full border border-border bg-card-subtle object-cover shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {member.user.name}
                    </span>
                    {member.user.id === currentUserId && (
                      <span className="text-[10px] text-muted-foreground font-mono bg-card-subtle px-1.5 py-0.5 rounded border border-border shrink-0">
                        You
                      </span>
                    )}
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-border bg-card-subtle text-foreground shrink-0">
                      {member.role}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                    {member.user.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Role Switcher */}
                {member.role !== "owner" && (
                  <select
                    value={member.role}
                    disabled={member.user.id === currentUserId || isPending}
                    onChange={(e) =>
                      handleRoleChange(
                        member.user.id,
                        e.target.value as "admin" | "member",
                      )
                    }
                    className="bg-card-subtle border border-border hover:border-muted-foreground/30 disabled:opacity-50 text-[11px] font-mono uppercase text-foreground rounded px-2.5 py-1 focus:outline-none transition-colors"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                )}

                {/* Remove Member Button */}
                <button
                  type="button"
                  disabled={
                    member.role === "owner" ||
                    member.user.id === currentUserId ||
                    isPending
                  }
                  onClick={() => handleRemove(member.user.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive-foreground disabled:opacity-30 transition-colors rounded hover:bg-destructive/10 focus:outline-none shrink-0"
                  title="Remove Member"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pending Invitations */}
      {initialInvitations.length > 0 && (
        <section className="p-5 md:p-6 bg-card border border-border rounded-lg space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Pending Invitations ({initialInvitations.length})
          </h2>
          <div className="divide-y divide-border-subtle">
            {initialInvitations.map((invite) => (
              <div
                key={invite.id}
                className="py-3 flex items-center justify-between first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground font-mono truncate">
                    {invite.email}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground bg-card-subtle border border-border px-1.5 py-0.5 rounded uppercase tracking-wider ml-1 shrink-0">
                    {invite.role}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  Expires {new Date(invite.expiresAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
