"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/app/providers";
import { CommandMenu } from "@/components/command-menu";
import { EnvironmentNotice } from "@/components/environment-notice";
import { EnvironmentSwitcher } from "@/components/environment-switcher";
import { navigationGroups } from "@/lib/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { environment } = useWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcut, setShortcut] = useState("Ctrl K");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setShortcut("⌘K");
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    const navigation = navigationRef.current;
    const focusableSelector = "a, button, select, input, textarea, [tabindex]:not([tabindex='-1'])";
    const getFocusable = () => Array.from(navigation?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    getFocusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (window.innerWidth < 1024) {
        menuButtonRef.current?.focus();
      }
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        inert={commandOpen || mobileOpen ? true : undefined}
        href="#main-content"
        className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Skip to main content
      </a>
      <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside
          ref={navigationRef}
          id="primary-navigation"
          inert={commandOpen ? true : undefined}
          className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-line bg-panel transition-transform lg:w-[248px] lg:translate-x-0 ${mobileOpen ? "translate-x-0 max-lg:visible" : "-translate-x-full max-lg:invisible"}`}
          aria-label="Primary navigation"
        >
          <div className="border-b border-line px-5 py-5">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-xs font-black text-white">
                D/X
              </span>
              <span>
                <span className="block text-sm font-black tracking-[-0.01em] text-ink">DEPLOYX</span>
                <span className="block text-xs text-muted">Deployment operations</span>
              </span>
            </Link>
          </div>
          <div className="border-b border-line px-4 py-4">
            <p className="mb-2 px-1 text-xs font-bold text-muted">Active environment</p>
            <EnvironmentSwitcher />
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navigationGroups.map((group) => (
              <div key={group.label} className="mb-5">
                <p className="mb-1 px-3 text-xs font-bold text-muted">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? "bg-ink font-bold text-white" : "font-semibold text-ink hover:bg-canvas"}`}
                      >
                        <span
                          className={`flex h-7 w-8 shrink-0 items-center justify-center rounded text-[11px] font-black ${active ? "bg-accent text-white" : "bg-muted-soft text-muted group-hover:bg-surface group-hover:text-ink"}`}
                        >
                          {item.short}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-line px-5 py-4">
            <p className="text-sm font-bold text-ink">FDE workspace</p>
            <p className="mt-1 text-xs text-muted">ACME / {environment}</p>
          </div>
        </aside>
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-ink/35 lg:hidden"
          />
        ) : null}
        <div className="min-w-0 lg:col-start-2">
          <header inert={commandOpen || mobileOpen ? true : undefined} className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-canvas/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-expanded={mobileOpen}
                aria-controls="primary-navigation"
                className="min-h-11 rounded-lg border border-line bg-surface px-3 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
              >
                Menu
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">ACME / {environment}</p>
                <p className="truncate text-xs text-muted">Forward deployment workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-md bg-amber-soft px-2 py-1 text-xs font-bold text-amber-ink sm:inline-flex">
                Simulation data
              </span>
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="inline-flex min-h-11 items-center gap-3 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-4"
              >
                <span>Search</span>
                <kbd className="hidden rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-muted sm:inline">
                  {shortcut}
                </kbd>
              </button>
            </div>
          </header>
          <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />
          <main id="main-content" inert={commandOpen || mobileOpen ? true : undefined} aria-hidden={mobileOpen ? "true" : undefined} className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <EnvironmentNotice />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
