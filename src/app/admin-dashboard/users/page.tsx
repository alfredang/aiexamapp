import Link from 'next/link';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { PageHeader } from '@/components/admin/page-header';
import { FilterBar, FilterField } from '@/components/admin/filter-bar';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Pager } from '@/components/admin/pager';
import { Badge } from '@/components/admin/badge';
import { buildQS } from '@/components/admin/qs';
import { Download, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

type SearchParams = Promise<{
  q?: string;
  status?: string;
  tag?: string;
  from?: string;
  to?: string;
  page?: string;
}>;

type UserRow = Awaited<ReturnType<typeof loadUsers>>[number];

async function loadUsers(where: Prisma.UserWhereInput, skip: number, take: number) {
  return db.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take,
    include: {
      tags: { include: { tag: true } },
      _count: { select: { orders: true, entitlements: true, attempts: true } }
    }
  });
}

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const status = sp.status || '';
  const tagSlug = (sp.tag || '').trim();
  const fromStr = (sp.from || '').trim();
  const toStr = (sp.to || '').trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.UserWhereInput = { role: 'USER' };
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } }
    ];
  }
  if (status === 'active') where.active = true;
  if (status === 'suspended') where.active = false;
  if (status === 'anonymized') where.anonymizedAt = { not: null };
  if (tagSlug) where.tags = { some: { tag: { slug: tagSlug } } };
  const fromDate = fromStr ? new Date(fromStr) : null;
  const toDate = toStr ? new Date(toStr) : null;
  if (toDate) toDate.setHours(23, 59, 59, 999);
  if ((fromDate && !isNaN(fromDate.getTime())) || (toDate && !isNaN(toDate.getTime()))) {
    where.createdAt = {
      ...(fromDate && !isNaN(fromDate.getTime()) ? { gte: fromDate } : {}),
      ...(toDate && !isNaN(toDate.getTime()) ? { lte: toDate } : {})
    };
  }

  const [total, users, tags] = await Promise.all([
    db.user.count({ where }),
    loadUsers(where, (page - 1) * PAGE_SIZE, PAGE_SIZE),
    db.tag.findMany({ orderBy: { label: 'asc' } })
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const baseParams = { q, status, tag: tagSlug, from: fromStr, to: toStr };
  const buildHref = (p: number) =>
    `/admin-dashboard/users${buildQS({ ...baseParams, page: p === 1 ? undefined : p })}`;

  const activeFilters = [
    q && { key: 'search', label: q, clearHref: `/admin-dashboard/users${buildQS({ ...baseParams, q: undefined })}` },
    status && { key: 'status', label: status, clearHref: `/admin-dashboard/users${buildQS({ ...baseParams, status: undefined })}` },
    tagSlug && { key: 'tag', label: tags.find((t) => t.slug === tagSlug)?.label ?? tagSlug, clearHref: `/admin-dashboard/users${buildQS({ ...baseParams, tag: undefined })}` },
    fromStr && { key: 'from', label: fromStr, clearHref: `/admin-dashboard/users${buildQS({ ...baseParams, from: undefined })}` },
    toStr && { key: 'to', label: toStr, clearHref: `/admin-dashboard/users${buildQS({ ...baseParams, to: undefined })}` }
  ].filter(Boolean) as { key: string; label: string; clearHref: string }[];

  const exportHref = `/api/admin/users/export${buildQS(baseParams)}`;

  const columns: Column<UserRow>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (u) => (
        <Link href={`/admin-dashboard/users/${u.id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-100">
          {u.name || <span className="text-slate-400">—</span>}
        </Link>
      )
    },
    {
      key: 'email',
      header: 'Email',
      cell: (u) => <span className="text-[12px] text-slate-700 dark:text-slate-200">{u.email}</span>
    },
    {
      key: 'tags',
      header: 'Tags',
      cell: (u) =>
        u.tags.length === 0 ? (
          <span className="text-slate-400">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {u.tags.map(({ tag }) => (
              <Link
                key={tag.id}
                href={`/admin-dashboard/users${buildQS({ ...baseParams, tag: tag.slug, page: undefined })}`}
                className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 hover:bg-blue-100 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {tag.label}
              </Link>
            ))}
          </div>
        )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => (
        <Badge variant={u.anonymizedAt ? 'muted' : u.active ? 'success' : 'danger'}>
          {u.anonymizedAt ? 'ANON' : u.active ? 'ACTIVE' : 'SUSPENDED'}
        </Badge>
      )
    },
    {
      key: 'orders',
      header: 'Orders',
      align: 'right',
      cell: (u) => <span className="font-mono text-[11px]">{u._count.orders}</span>
    },
    {
      key: 'entitlements',
      header: 'Ents',
      align: 'right',
      cell: (u) => <span className="font-mono text-[11px]">{u._count.entitlements}</span>
    },
    {
      key: 'attempts',
      header: 'Attempts',
      align: 'right',
      cell: (u) => <span className="font-mono text-[11px]">{u._count.attempts}</span>
    },
    {
      key: 'joined',
      header: 'Joined',
      cell: (u) => <span className="text-[11px] text-slate-500">{u.createdAt.toISOString().slice(0, 10)}</span>
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      headerClassName: 'w-12',
      cell: (u) => (
        <Link href={`/admin-dashboard/users/${u.id}`} title="View" className="icon-btn">
          <Eye className="h-3.5 w-3.5" />
        </Link>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${total} user${total === 1 ? '' : 's'}${pages > 1 ? ` · page ${page} of ${pages}` : ''}`}
        actions={
          <a
            href={exportHref}
            className="btn-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
            download
          >
            <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
          </a>
        }
      />

      <FilterBar resetHref={activeFilters.length > 0 ? '/admin-dashboard/users' : undefined} activeFilters={activeFilters}>
        <FilterField label="Search" className="min-w-[12rem] flex-1">
          <input name="q" defaultValue={q} placeholder="Email or name…" className="input-sm" />
        </FilterField>
        <FilterField label="Status">
          <select name="status" defaultValue={status} className="input-sm">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="anonymized">Anonymized</option>
          </select>
        </FilterField>
        <FilterField label="Tag">
          <select name="tag" defaultValue={tagSlug} className="input-sm">
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.slug}>{t.label}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="From">
          <input type="date" name="from" defaultValue={fromStr} className="input-sm" />
        </FilterField>
        <FilterField label="To">
          <input type="date" name="to" defaultValue={toStr} className="input-sm" />
        </FilterField>
      </FilterBar>

      <DataTable columns={columns} rows={users} rowKey={(u) => u.id} empty="No users match the filters." />

      <Pager page={page} pages={pages} buildHref={buildHref} />
    </div>
  );
}
