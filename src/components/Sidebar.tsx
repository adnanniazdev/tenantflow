"use client";

import { UserButton } from "@clerk/nextjs";
import {
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  Plus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
}

interface SidebarProps {
  currentWorkspace: WorkspaceInfo;
  workspaces: WorkspaceInfo[];
}

export function Sidebar({ currentWorkspace, workspaces }: SidebarProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Helper to construct domain-based workspace switching URLs
  const handleWorkspaceChange = (slug: string) => {
    if (slug === currentWorkspace.slug) {
      setDropdownOpen(false);
      return;
    }
    const host = window.location.host;
    const protocol = window.location.protocol;
    const parts = host.split(".");

    let targetUrl = "";
    if (parts.length > 2) {
      // Subdomain active (e.g., [tenant].lvh.me:3000)
      parts[0] = slug;
      targetUrl = `${protocol}//${parts.join(".")}`;
    } else {
      // Standard domain or localhost (e.g., lvh.me:3000)
      targetUrl = `${protocol}//${slug}.${host}`;
    }

    window.location.href = targetUrl;
  };

  const pathPrefix = pathname.startsWith(`/${currentWorkspace.slug}`)
    ? `/${currentWorkspace.slug}`
    : "";

  const navItems = [
    {
      name: "Dashboard",
      href: `${pathPrefix}/`,
      icon: LayoutDashboard,
    },
    {
      name: "Team Members",
      href: `${pathPrefix}/members`,
      icon: Users,
    },
    {
      name: "Billing Settings",
      href: `${pathPrefix}/billing`,
      icon: CreditCard,
    },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full text-foreground">
      {/* Workspace Switcher */}
      <div className="p-4 border-b border-sidebar-border relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between bg-card px-3 py-2 rounded-md border border-border hover:border-muted-foreground/30 transition-colors text-left focus:outline-none"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-muted-foreground font-mono">
              Workspace
            </span>
            <span className="text-sm text-foreground font-medium truncate">
              {currentWorkspace.name}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
        </button>

        {dropdownOpen && (
          <>
            {/* biome-ignore lint/a11y/useButtonType: backdrop */}
            <button
              onClick={() => setDropdownOpen(false)}
              className="fixed inset-0 z-10 w-full h-full cursor-default bg-transparent"
              aria-label="Close workspace dropdown"
            />
            <div className="absolute left-4 right-4 mt-2 bg-card border border-border rounded-md py-1.5 z-20 max-h-60 overflow-y-auto">
              <div className="px-3 py-1 text-[11px] font-mono text-muted-foreground">
                Switch Workspace
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => handleWorkspaceChange(ws.slug)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                    ws.slug === currentWorkspace.slug
                      ? "text-foreground font-medium bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-card-subtle"
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}
              <div className="border-t border-border-subtle my-1" />
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  const host = window.location.host;
                  const protocol = window.location.protocol;
                  const parts = host.split(".");

                  // Redirect to main console to create workspace
                  let consoleUrl = "";
                  if (parts.length > 2) {
                    parts.shift(); // Remove the subdomain part
                    consoleUrl = `${protocol}//${parts.join(".")}`;
                  } else {
                    consoleUrl = `${protocol}//${host}`;
                  }
                  window.location.href = consoleUrl;
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                Create New Workspace
              </button>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const hrefNormalized = item.href.replace(/\/$/, "");
          const pathnameNormalized = pathname.replace(/\/$/, "");
          // Check active state (if dashboard root matching or prefix matching)
          const isActive =
            hrefNormalized === pathPrefix
              ? pathnameNormalized === pathPrefix
              : pathnameNormalized.startsWith(hrefNormalized);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-card text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-card-subtle border border-transparent"
              }`}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border flex items-center justify-between gap-3 bg-card-subtle">
        <div className="flex items-center gap-2.5 min-w-0">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "w-8 h-8 rounded-full border border-border",
              },
            }}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-muted-foreground">Signed in</span>
            <span className="text-xs font-medium text-foreground truncate leading-snug">
              {currentWorkspace.name} Member
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
