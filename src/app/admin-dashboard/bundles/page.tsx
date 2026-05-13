import Link from 'next/link';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { Eye, Pencil, Copy, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { FilterBar, FilterField } from '@/components/admin/filter-bar';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Pager } from '@/components/admin/pager';
import { StatusBadge } from '@/components/admin/badge';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { SelectAllCheckbox, SelectedCounter } from '@/components/admin/bulk-select';
import { buildQS } from '@/components/admin/qs';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

type SearchParams = Promise<{ q?: string; status?: string; vendor?: string; level?: string; page?: string }>;

type BundleRow = Awaited<ReturnType<typeof loadBundles>>[number];

async function loadBundles(where: Prisma.BundleWhereInput, skip: number, take: number) {
  return db.bundle.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { items: true, orders: true } },
      items: {
        orderBy: { position: 'asc' },
        include: {
          exam: { select: { code: true, questionCount: true, durationMinutes: true, level: true, vendor: { select: { name: true } } } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take
  });
}

async function duplicateBundle(formData: FormData) {
  'use server';
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return;
  const id = String(formData.get('id'));
  const orig = await db.bundle.findUnique({ where: { id }, include: { items: true } });
  if (!orig) return;
  const suffix = `-copy-${Date.now().toString(36).slice(-4)}`;
  const cloned = await db.bundle.create({
    data: {
      slug: `${orig.slug}${suffix}`,
      title: `${orig.title} (copy)`,
      description: orig.description,
      price: orig.price,
      priceVoucher: orig.priceVoucher,
      published: false,
      createdById: user.id,
      items: {
        create: orig.items.map((i) => ({ examId: i.examId, tier: i.tier, position: i.position }))
      }
    }
  });
  await db.adminLog.create({
    data: { adminId: user.id, action: 'bundle.duplicate', targetType: 'Bundle', targetId: id, metadata: { newBundleId: cloned.id } }
  });
  revalidatePath('/admin-dashboard/bundles');
}

async function bulkBundleAction(formData: FormData) {
  'use server';
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return;
  const op = String(formData.get('op') || '');
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  if (!ids.length) return;
  if (op === 'publish') {
    const result = await db.bundle.updateMany({ where: { id: { in: ids } }, data: { published: true } });
    await db.adminLog.create({
      data: { adminId: user.id, action: 'bundle.bulk_publish', targetType: 'Bundle', targetId: ids[0], metadata: { ids, count: result.count } }
    });
  } else if (op === 'unpublish') {
    const result = await db.bundle.updateMany({ where: { id: { in: ids } }, data: { published: false } });
    await db.adminLog.create({
      data: { adminId: user.id, action: 'bundle.bulk_unpublish', targetType: 'Bundle', targetId: ids[0], metadata: { ids, count: result.count } }
    });
  }
  revalidatePath('/admin-dashboard/bundles');
}

async function deleteBundleFromList(formData: FormData) {
  'use server';
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return;
  const id = String(formData.get('id'));
  const b = await db.bundle.findUnique({ where: { id }, include: { _count: { select: { orders: true } } } });
  if (!b) return;
  if (b._count.orders > 0) {
    // Soft-disable to preserve order history.
    await db.bundle.update({ where: { id }, data: { published: false } });
  } else {
    await db.bundleItem.deleteMany({ where: { bundleId: id } });
    await db.bundle.delete({ where: { id } });
  }
  await db.adminLog.create({
    data: {
      adminId: user.id,
      action: b._count.orders > 0 ? 'bundle.disabled' : 'bundle.delete',
      targetType: 'Bundle',
      targetId: id,
      metadata: {}
    }
  });
  revalidatePath('/admin-dashboard/bundles');
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * The bundle's "exam code" should be the underlying certification code
 * (e.g. SAA-C03), not a per-variant suffix (SAA-C03-P1). Strip any -PN or
 * -PRACTICE-N suffix from the first item's exam code.
 */
function bundleBaseCode(code: string | undefined): string | null {
  if (!code) return null;
  return code.replace(/-(?:P|PRACTICE-)\d+$/i, '');
}

const LEVELS = ['Foundational', 'Associate', 'Professional', 'Specialty'];

export default async function AdminBundlesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const status = sp.status || '';
  const vendorFilter = sp.vendor || '';
  const levelFilter = sp.level || '';
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
  if (vendorFilter) {
    where.items = { ...(where.items as any), some: { exam: { vendor: { slug: vendorFilter } } } };
  }
  if (levelFilter) {
    where.items = { ...(where.items as any), some: { exam: { ...(vendorFilter ? { vendor: { slug: vendorFilter } } : {}), level: levelFilter } } };
  }

  const [vendors, total, bundles] = await Promise.all([
    db.vendor.findMany({ orderBy: { name: 'asc' } }),
    db.bundle.count({ where }),
    loadBundles(where, (page - 1) * PAGE_SIZE, PAGE_SIZE)
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const baseParams = { q, status, vendor: vendorFilter, level: levelFilter };
  const buildHref = (p: number) =>
    `/admin-dashboard/bundles${buildQS({ ...baseParams, page: p === 1 ? undefined : p })}`;

  const activeFilters = [
    vendorFilter && {
      key: 'vendor',
      label: vendors.find((v) => v.slug === vendorFilter)?.name ?? vendorFilter,
      clearHref: `/admin-dashboard/bundles${buildQS({ ...baseParams, vendor: undefined })}`
    },
    levelFilter && {
      key: 'level',
      label: levelFilter,
      clearHref: `/admin-dashboard/bundles${buildQS({ ...baseParams, level: undefined })}`
    },
    q && { key: 'search', label: q, clearHref: `/admin-dashboard/bundles${buildQS({ ...baseParams, q: undefined })}` },
    status && { key: 'status', label: status, clearHref: `/admin-dashboard/bundles${buildQS({ ...baseParams, status: undefined })}` }
  ].filter(Boolean) as { key: string; label: string; clearHref: string }[];

  const BULK_FORM_ID = 'admin-bundles-bulk-form';

  const columns: Column<BundleRow>[] = [
    {
      key: 'select',
      header: '',
      headerClassName: 'w-10',
      cell: (b) => (
        <input
          type="checkbox"
          name="ids"
          value={b.id}
          form={BULK_FORM_ID}
          aria-label={`Select ${b.slug}`}
          className="h-4 w-4 cursor-pointer accent-blue-600"
        />
      )
    },
    {
      key: 'vendor',
      header: 'Vendor',
      cell: (b) => <span className="text-slate-700 dark:text-slate-200">{b.items[0]?.exam.vendor.name ?? '—'}</span>
    },
    {
      key: 'title',
      header: 'Bundle Name',
      cell: (b) => (
        <Link
          href={`/admin-dashboard/bundles/${b.id}`}
          className="block max-w-[24rem] truncate font-medium text-slate-900 hover:underline dark:text-slate-100"
          title={b.title}
        >
          {b.title}
        </Link>
      )
    },
    {
      key: 'code',
      header: 'Exam Code',
      headerClassName: 'w-24',
      cell: (b) => {
        const code = bundleBaseCode(b.items[0]?.exam.code);
        return code ? (
          <span className="whitespace-nowrap font-mono text-[12px]">{code}</span>
        ) : (
          <span className="text-slate-400">—</span>
        );
      }
    },
    {
      key: 'practiceExams',
      header: 'Practice Exams',
      cell: (b) =>
        b.items.length > 0 ? (
          <div
            className="flex max-w-[22rem] flex-nowrap items-center gap-1 overflow-x-auto"
            title={b.items.map((i) => `${i.exam.vendor.name} ${i.exam.code} [${i.tier}]`).join('\n')}
          >
            {b.items.map((it) => (
              <span
                key={it.id}
                className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-mono text-[10px] ${
                  it.tier === 'VOUCHER'
                    ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {it.exam.code}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        )
    },
    { key: 'level', header: 'Level', cell: (b) => b.items[0]?.exam.level ?? '—' },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => <StatusBadge status={b.published ? 'PUBLISHED' : 'DRAFT'} />
    },
    {
      key: 'numExams',
      header: '# Exams',
      align: 'right',
      cell: (b) => (
        <span className="font-mono text-[11px]" title={b.items.map((i) => `${i.exam.vendor.name} ${i.exam.code} [${i.tier}]`).join('\n')}>
          {b._count.items}
        </span>
      )
    },
    {
      key: 'qPerExam',
      header: 'Q / Exam',
      align: 'right',
      cell: (b) => b.items[0]?.exam.questionCount ?? '—'
    },
    {
      key: 'duration',
      header: 'Duration',
      align: 'right',
      cell: (b) => (b.items[0] ? `${b.items[0].exam.durationMinutes} min` : '—')
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      cell: (b) => (
        <span className="whitespace-nowrap font-semibold" title={b.priceVoucher != null ? `voucher ${formatPrice(b.priceVoucher, 'USD')}` : undefined}>
          {formatPrice(b.price, 'USD')}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      cell: (b) => <span className="whitespace-nowrap text-[12px] text-slate-600 dark:text-slate-300">{fmtDate(b.createdAt)}</span>
    },
    {
      key: 'updatedAt',
      header: 'Edited',
      cell: (b) => <span className="whitespace-nowrap text-[12px] text-slate-600 dark:text-slate-300">{fmtDate(b.updatedAt)}</span>
    },
    {
      key: 'createdBy',
      header: 'Created by',
      cell: (b) =>
        b.createdBy ? (
          <span className="whitespace-nowrap text-[12px] text-slate-700 dark:text-slate-200">{b.createdBy.name || b.createdBy.email}</span>
        ) : (
          <span className="text-slate-400">—</span>
        )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      headerClassName: 'w-36',
      cell: (b) => (
        <div className="flex items-center justify-end gap-0.5">
          <Link href={`/bundles/${b.slug}`} target="_blank" rel="noreferrer" title="Preview as customer" className="icon-btn">
            <Eye className="h-3.5 w-3.5" />
          </Link>
          <Link href={`/admin-dashboard/bundles/${b.id}`} title="Edit (search & add exams)" className="icon-btn">
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <form action={duplicateBundle} className="inline-flex">
            <input type="hidden" name="id" value={b.id} />
            <button title="Duplicate bundle (items copy as DRAFT)" className="icon-btn">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </form>
          <form action={deleteBundleFromList} className="inline-flex">
            <input type="hidden" name="id" value={b.id} />
            <ConfirmButton
              message={
                b._count.orders > 0
                  ? `Disable bundle "${b.title}"? It has ${b._count.orders} order(s) so it can't be hard-deleted.`
                  : `Hard-delete bundle "${b.title}"? Permanent. Allowed only when there are no orders.`
              }
              title={b._count.orders > 0 ? 'Disable (has orders)' : 'Hard delete'}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </ConfirmButton>
          </form>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="View Bundled Exams"
        subtitle={`${total} bundle${total === 1 ? '' : 's'}${pages > 1 ? ` · page ${page} of ${pages}` : ''}`}
        actions={
          <Link href="/admin-dashboard/bundles/new" className="btn-sm bg-blue-600 text-white hover:bg-blue-700">
            + Create Bundle
          </Link>
        }
      />

      <FilterBar resetHref={activeFilters.length > 0 ? '/admin-dashboard/bundles' : undefined} activeFilters={activeFilters}>
        <FilterField label="Vendor">
          <select name="vendor" defaultValue={vendorFilter} className="input-sm">
            <option value="">All vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.slug}>{v.name}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Level">
          <select name="level" defaultValue={levelFilter} className="input-sm">
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Status">
          <select name="status" defaultValue={status} className="input-sm">
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </FilterField>
        <FilterField label="Search" className="min-w-[14rem] flex-1">
          <input name="q" defaultValue={q} placeholder="Title or slug…" className="input-sm" />
        </FilterField>
      </FilterBar>

      <form
        id={BULK_FORM_ID}
        action={bulkBundleAction}
        className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] dark:border-slate-700 dark:bg-slate-900/40"
      >
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-slate-700 dark:text-slate-200">
          <SelectAllCheckbox formId={BULK_FORM_ID} className="h-4 w-4 accent-blue-600" />
          Select all
        </label>
        <span className="text-slate-400">·</span>
        <span className="text-slate-600 dark:text-slate-400">
          <SelectedCounter formId={BULK_FORM_ID} /> selected
        </span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-500">With selected:</span>
        <button
          type="submit"
          name="op"
          value="publish"
          className="btn-sm bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Publish
        </button>
        <button
          type="submit"
          name="op"
          value="unpublish"
          className="btn-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Unpublish
        </button>
      </form>

      <DataTable columns={columns} rows={bundles} rowKey={(b) => b.id} empty="No bundles yet. Click + Create Bundle to start one." />

      <Pager page={page} pages={pages} buildHref={buildHref} />
    </div>
  );
}
