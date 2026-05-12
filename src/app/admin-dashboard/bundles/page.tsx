import Link from 'next/link';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { Eye, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { FilterBar, FilterField } from '@/components/admin/filter-bar';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Pager } from '@/components/admin/pager';
import { StatusBadge } from '@/components/admin/badge';
import { buildQS } from '@/components/admin/qs';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

type SearchParams = Promise<{ q?: string; status?: string; page?: string }>;

type BundleRow = Awaited<ReturnType<typeof loadBundles>>[number];

async function loadBundles(where: Prisma.BundleWhereInput, skip: number, take: number) {
  return db.bundle.findMany({
    where,
    include: {
      _count: { select: { items: true, orders: true } },
      items: { include: { exam: { select: { code: true, vendor: { select: { name: true } } } } } }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take
  });
}

export default async function AdminBundlesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const status = sp.status || '';
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.BundleWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } }
    ];
  }
  if (status === 'published') where.published = true;
  if (status === 'draft') where.published = false;

  const [total, bundles] = await Promise.all([
    db.bundle.count({ where }),
    loadBundles(where, (page - 1) * PAGE_SIZE, PAGE_SIZE)
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const baseParams = { q, status };
  const buildHref = (p: number) =>
    `/admin-dashboard/bundles${buildQS({ ...baseParams, page: p === 1 ? undefined : p })}`;

  const activeFilters = [
    q && { key: 'search', label: q, clearHref: `/admin-dashboard/bundles${buildQS({ ...baseParams, q: undefined })}` },
    status && { key: 'status', label: status, clearHref: `/admin-dashboard/bundles${buildQS({ ...baseParams, status: undefined })}` }
  ].filter(Boolean) as { key: string; label: string; clearHref: string }[];

  const columns: Column<BundleRow>[] = [
    {
      key: 'title',
      header: 'Bundle',
      cell: (b) => (
        <Link href={`/admin-dashboard/bundles/${b.id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-100">
          {b.title}
        </Link>
      )
    },
    {
      key: 'slug',
      header: 'Slug',
      cell: (b) => <span className="font-mono text-[12px]">{b.slug}</span>
    },
    {
      key: 'items',
      header: 'Items',
      align: 'right',
      cell: (b) => (
        <span className="font-mono text-[11px]" title={b.items.map((i) => `${i.exam.vendor.name} ${i.exam.code} [${i.tier}]`).join('\n')}>
          {b._count.items}
        </span>
      )
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      cell: (b) => (
        <div>
          <div className="font-semibold">{formatPrice(b.price, 'USD')}</div>
          {b.priceVoucher != null && (
            <div className="text-[10px] text-slate-500">voucher {formatPrice(b.priceVoucher, 'USD')}</div>
          )}
        </div>
      )
    },
    {
      key: 'orders',
      header: 'Orders',
      align: 'right',
      cell: (b) => <span className="font-mono text-[11px]">{b._count.orders}</span>
    },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => <StatusBadge status={b.published ? 'PUBLISHED' : 'DRAFT'} />
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      headerClassName: 'w-16',
      cell: (b) => (
        <div className="flex items-center justify-end gap-0.5">
          <Link href={`/bundles/${b.slug}`} target="_blank" rel="noreferrer" title="Preview as customer" className="icon-btn">
            <Eye className="h-3.5 w-3.5" />
          </Link>
          <Link href={`/admin-dashboard/bundles/${b.id}`} title="Edit" className="icon-btn">
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Bundles"
        subtitle={`${total} bundle${total === 1 ? '' : 's'}${pages > 1 ? ` · page ${page} of ${pages}` : ''}`}
        actions={
          <Link href="/admin-dashboard/bundles/new" className="btn-sm bg-blue-600 text-white hover:bg-blue-700">
            + Create Bundle
          </Link>
        }
      />

      <FilterBar resetHref={activeFilters.length > 0 ? '/admin-dashboard/bundles' : undefined} activeFilters={activeFilters}>
        <FilterField label="Search" className="min-w-[14rem] flex-1">
          <input name="q" defaultValue={q} placeholder="Title or slug…" className="input-sm" />
        </FilterField>
        <FilterField label="Status">
          <select name="status" defaultValue={status} className="input-sm">
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </FilterField>
      </FilterBar>

      <DataTable columns={columns} rows={bundles} rowKey={(b) => b.id} empty="No bundles yet. Click + Create Bundle to start one." />

      <Pager page={page} pages={pages} buildHref={buildHref} />
    </div>
  );
}
