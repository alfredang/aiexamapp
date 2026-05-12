'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ShoppingBag,
  Ticket,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type NavItem = { href: string; label: string; icon: any; children?: { href: string; label: string }[] };

const ITEMS: NavItem[] = [
  { href: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/admin-dashboard/exams',
    label: 'Exam Management',
    icon: BookOpen,
    children: [
      { href: '/admin-dashboard/exams/new', label: 'Create Exam' },
      { href: '/admin-dashboard/vendors', label: 'Vendors' }
    ]
  },
  { href: '/admin-dashboard/users', label: 'Users', icon: Users },
  { href: '/admin-dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin-dashboard/vouchers', label: 'Voucher Management', icon: Ticket },
  {
    href: '/admin-dashboard/settings',
    label: 'Settings',
    icon: SettingsIcon,
    children: [
      { href: '/admin-dashboard/settings/company', label: 'Company Info' },
      { href: '/admin-dashboard/settings/branding', label: 'Branding' },
      { href: '/admin-dashboard/settings/email-templates', label: 'Email Templates' },
      { href: '/admin-dashboard/pages', label: 'Pages' },
      { href: '/admin-dashboard/settings/payment', label: 'Payment Setting' },
      { href: '/admin-dashboard/settings/credentials', label: 'Credentials' }
    ]
  }
];

function isPathActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isItemActive(pathname: string, item: NavItem): boolean {
  const exact = item.href === '/admin-dashboard';
  if (isPathActive(pathname, item.href, exact)) return true;
  return !!item.children?.some((c) => isPathActive(pathname, c.href, false));
}

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/admin-dashboard';
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const v = localStorage.getItem('adminSidebarCollapsed');
      setCollapsed(v === '1');
      const g = localStorage.getItem('adminSidebarGroups');
      if (g) setOpenGroups(JSON.parse(g));
    } catch {}
    setMounted(true);
  }, []);

  function toggleCollapse() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem('adminSidebarCollapsed', next ? '1' : '0');
      } catch {}
      return next;
    });
  }

  function toggleGroup(href: string) {
    setOpenGroups((g) => {
      const next = { ...g, [href]: !g[href] };
      try {
        localStorage.setItem('adminSidebarGroups', JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const width = collapsed ? 'w-16' : 'w-60';

  return (
    <div className="flex min-h-[calc(100vh-6rem)] w-full">
      <aside
        className={`relative shrink-0 border-r border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900 ${width} ${
          mounted ? '' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between px-3 py-3">
          {!collapsed && (
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admin
            </span>
          )}
          <button
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 px-2 pb-4">
          {ITEMS.map((item) => {
            const { href, label, icon: Icon, children: subs } = item;
            const active = isItemActive(pathname, item);
            const hasChildren = !!subs?.length;
            // Default: open if active; user toggle overrides.
            const isOpen = openGroups[href] ?? active;

            return (
              <div key={href}>
                <div
                  className={`flex items-center gap-1 rounded-md text-sm transition ${
                    active
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  <Link
                    href={href}
                    title={collapsed ? label : undefined}
                    className="flex flex-1 items-center gap-3 rounded-md px-2.5 py-2"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                  {!collapsed && hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(href)}
                      aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`}
                      aria-expanded={isOpen}
                      className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                    </button>
                  )}
                </div>
                {!collapsed && hasChildren && isOpen && (
                  <div className="ml-7 mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 pl-2 dark:border-slate-700">
                    {subs!.map((c) => {
                      const subActive = isPathActive(pathname, c.href, false);
                      return (
                        <Link
                          key={c.href}
                          href={c.href}
                          className={`rounded-md px-2 py-1.5 text-xs transition ${
                            subActive
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                          }`}
                        >
                          {c.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
