import Link from 'next/link';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { Eye, Pencil, Trash2, BookOpenCheck, Archive, ArchiveRestore, Copy } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { FilterBar, FilterField } from '@/components/admin/filter-bar';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Pager } from '@/components/admin/pager';
import { StatusBadge } from '@/components/admin/badge';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { buildQS } from '@/components/admin/qs';
import { SelectAllCheckbox, SelectedCounter } from '@/components/admin/bulk-select';

export const dynamic = 'force-dynamic';

async function deleteExam(formData: FormData) {
  'use server';
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return;
  const id = String(formData.get('id'));
  if (!id) return;
  const [attempts, orders] = await Promise.all([
    db.attempt.count({ where: { examId: id } }),
    db.order.count({ where: { examId: id } })
  ]);
  if (attempts > 0 || orders > 0) return; // refuse if referenced
  await db.question.deleteMany({ where: { examId: id } });
  await db.entitlement.deleteMany({ where: { examId: id } });
  await db.exam.delete({ where: { id } });
  await db.adminLog.create({
    data: { adminId: user.id, action: 'exam.delete', targetType: 'Exam', targetId: id, metadata: {} }
  });
  revalidatePath('/admin-dashboard/exams');
}

async function archiveExam(formData: FormData) {
  'use server';
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return;
  const id = String(formData.get('id'));
  if (!id) return;
  await db.exam.update({ where: { id }, data: { deletedAt: new Date(), published: false } });
  await db.adminLog.create({
    data: { adminId: user.id, action: 'exam.archive', targetType: 'Exam', targetId: id, metadata: {} }
  });
  revalidatePath('/admin-dashboard/exams');
}

async function restoreExam(formData: FormData) {
  'use server';
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return;
  const id = String(formData.get('id'));
  if (!id) return;
  await db.exam.update({ where: { id }, data: { deletedAt: null } });
  await db.adminLog.create({
    data: { adminId: user.id, action: 'exam.restore', targetType: 'Exam', targetId: id, metadata: {} }
  });
  revalidatePath('/admin-dashboard/exams');
}

async function bulkExamAction(formData: FormData) {
  'use server';
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return;
  const op = String(formData.get('op') || '');
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  if (!ids.length) return;
  if (op === 'publish') {
    const result = await db.exam.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { published: true }
    });
    await db.adminLog.create({
      data: { adminId: user.id, action: 'exam.bulk_publish', targetType: 'Exam', targetId: ids[0], metadata: { ids, count: result.count } }
    });
  } else if (op === 'unpublish') {
    const result = await db.exam.updateMany({
      where: { id: { in: ids } },
      data: { published: false }
    });
    await db.adminLog.create({
      data: { adminId: user.id, action: 'exam.bulk_unpublish', targetType: 'Exam', targetId: ids[0], metadata: { ids, count: result.count } }
    });
  } else if (op === 'archive') {
    const result = await db.exam.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date(), published: false }
    });
    await db.adminLog.create({
      data: { adminId: user.id, action: 'exam.bulk_archive', targetType: 'Exam', targetId: ids[0], metadata: { ids, count: result.count } }
    });
  }
  revalidatePath('/admin-dashboard/exams');
}

async function duplicateExam(formData: FormData) {
  'use server';
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return;
  const id = String(formData.get('id'));
  if (!id) return;
  const orig = await db.exam.findUnique({ where: { id }, include: { questions: true } });
  if (!orig) return;
  // Append a copy suffix to code+slug; admin can rename after.
  const suffix = `-copy-${Date.now().toString(36).slice(-4)}`;
  const cloned = await db.exam.create({
    data: {
      vendorId: orig.vendorId,
      code: `${orig.code}${suffix}`,
      slug: `${orig.slug}${suffix}`,
      title: `${orig.title} (copy)`,
      description: orig.description,
      level: orig.level,
      durationMinutes: orig.durationMinutes,
      passingScore: orig.passingScore,
      questionCount: orig.questionCount,
      examSets: orig.examSets,
      infoUrl: orig.infoUrl,
      domains: orig.domains as any,
      pricePractice: orig.pricePractice,
      priceBundle: orig.priceBundle,
      priceVoucher: orig.priceVoucher,
      published: false
    }
  });
  if (orig.questions.length) {
    await db.question.createMany({
      data: orig.questions.map((q) => ({
        examId: cloned.id,
        stem: q.stem,
        type: q.type,
        domain: q.domain,
        difficulty: q.difficulty,
        explanation: q.explanation,
        options: q.options as any,
        correct: q.correct as any,
        references: q.references as any,
        status: 'DRAFT',
        generatedBy: q.generatedBy,
        isTeaser: false
      }))
    });
  }
  await db.adminLog.create({
    data: { adminId: user.id, action: 'exam.duplicate', targetType: 'Exam', targetId: id, metadata: { newExamId: cloned.id } }
  });
  revalidatePath('/admin-dashboard/exams');
}

const LEVELS = ['Foundational', 'Associate', 'Professional', 'Specialty'];
const PAGE_SIZE = 50;

type ExamRow = Awaited<ReturnType<typeof loadExams>>[number];

async function loadExams(where: any, skip: number, take: number) {
  return db.exam.findMany({
    where,
    include: {
      vendor: true,
      _count: { select: { questions: true, attempts: true, orders: true } }
    },
    orderBy: [{ vendor: { name: 'asc' } }, { title: 'asc' }],
    skip,
    take
  });
}

export default async function AdminExamsPage({
  searchParams
}: {
  searchParams: Promise<{ vendor?: string; level?: string; q?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const vendorFilter = sp.vendor || '';
  const levelFilter = sp.level || '';
  const q = (sp.q || '').trim();
  const archived = sp.archived === '1';
  const requestedPage = Math.max(1, Number(sp.page || 1) || 1);

  const where = {
    ...(archived ? { deletedAt: { not: null } } : { deletedAt: null }),
    ...(vendorFilter ? { vendor: { slug: vendorFilter } } : {}),
    ...(levelFilter ? { level: levelFilter } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { code: { contains: q, mode: 'insensitive' as const } }
          ]
        }
      : {})
  };

  const [vendors, totalCount] = await Promise.all([
    db.vendor.findMany({ orderBy: { name: 'asc' } }),
    db.exam.count({ where })
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const exams = await loadExams(where, (page - 1) * PAGE_SIZE, PAGE_SIZE);

  const baseParams = { vendor: vendorFilter, level: levelFilter, q };
  const buildHref = (p: number) =>
    `/admin-dashboard/exams${buildQS({ ...baseParams, page: p === 1 ? undefined : p })}`;

  const activeFilters = [
    vendorFilter && {
      key: 'vendor',
      label: vendors.find((v) => v.slug === vendorFilter)?.name ?? vendorFilter,
      clearHref: `/admin-dashboard/exams${buildQS({ level: levelFilter, q })}`
    },
    levelFilter && {
      key: 'level',
      label: levelFilter,
      clearHref: `/admin-dashboard/exams${buildQS({ vendor: vendorFilter, q })}`
    },
    q && {
      key: 'search',
      label: q,
      clearHref: `/admin-dashboard/exams${buildQS({ vendor: vendorFilter, level: levelFilter })}`
    }
  ].filter(Boolean) as { key: string; label: string; clearHref: string }[];

  const BULK_FORM_ID = 'admin-exams-bulk-form';

  const columns: Column<ExamRow>[] = [
    {
      key: 'select',
      header: '',
      headerClassName: 'w-10',
      cell: (e) => (
        <input
          type="checkbox"
          name="ids"
          value={e.id}
          form={BULK_FORM_ID}
          aria-label={`Select ${e.code}`}
          className="h-4 w-4 cursor-pointer accent-blue-600"
        />
      )
    },
    {
      key: 'vendor',
      header: 'Vendor',
      cell: (e) => <span className="text-slate-700 dark:text-slate-200">{e.vendor.name}</span>
    },
    {
      key: 'title',
      header: 'Exam Name',
      cell: (e) => (
        <Link
          href={`/admin-dashboard/exams/${e.id}`}
          className="font-medium text-slate-900 hover:underline dark:text-slate-100"
        >
          {e.title.split(' — ')[0]}
        </Link>
      )
    },
    { key: 'code', header: 'Code', cell: (e) => <span className="font-mono text-[12px]">{e.code}</span> },
    { key: 'level', header: 'Level', cell: (e) => e.level },
    {
      key: 'status',
      header: 'Status',
      cell: (e) => <StatusBadge status={e.published ? 'PUBLISHED' : 'DRAFT'} />
    },
    { key: 'examSets', header: '# Exams', cell: (e) => e.examSets, align: 'right' },
    { key: 'qPerExam', header: 'Q / Exam', cell: (e) => e.questionCount, align: 'right' },
    { key: 'duration', header: 'Duration', cell: (e) => `${e.durationMinutes} min`, align: 'right' },
    {
      key: 'infoUrl',
      header: 'Info',
      cell: (e) =>
        e.infoUrl ? (
          <a
            href={e.infoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Open
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      headerClassName: 'w-36',
      cell: (e) => {
        const canHardDelete = e._count.attempts === 0 && e._count.orders === 0;
        const isArchived = !!e.deletedAt;
        return (
          <div className="flex items-center justify-end gap-0.5">
            {!isArchived && (
              <Link href={`/admin-dashboard/exams/${e.id}/test`} title="Test exam as candidate" className="icon-btn">
                <BookOpenCheck className="h-3.5 w-3.5" />
              </Link>
            )}
            <Link href={`/admin-dashboard/exams/${e.id}`} title="Edit exam" className="icon-btn">
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <form action={duplicateExam} className="inline-flex">
              <input type="hidden" name="id" value={e.id} />
              <button title="Duplicate exam (questions copy as DRAFT)" className="icon-btn">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </form>
            {isArchived ? (
              <form action={restoreExam} className="inline-flex">
                <input type="hidden" name="id" value={e.id} />
                <button title="Restore from archive" className="icon-btn text-emerald-600 dark:text-emerald-400">
                  <ArchiveRestore className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <form action={archiveExam} className="inline-flex">
                <input type="hidden" name="id" value={e.id} />
                <ConfirmButton
                  message={`Archive exam "${e.code}"? It will be hidden from the public catalog but data is preserved.`}
                  className="h-6 w-6 p-0"
                  variant="neutral"
                >
                  <Archive className="h-3.5 w-3.5" />
                </ConfirmButton>
              </form>
            )}
            <form action={deleteExam} className="inline-flex">
              <input type="hidden" name="id" value={e.id} />
              <ConfirmButton
                message={`Hard-delete "${e.code}"? Permanent. Allowed only when there are no attempts or orders.`}
                disabled={!canHardDelete}
                title={canHardDelete ? 'Hard delete (no attempts/orders)' : 'Cannot hard delete — use Archive'}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </ConfirmButton>
            </form>
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="Exam Management"
        subtitle={`${totalCount} exam${totalCount === 1 ? '' : 's'}${totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}`}
        actions={
          <Link href="/admin-dashboard/exams/new" className="btn-sm bg-blue-600 text-white hover:bg-blue-700">
            + Create Exam
          </Link>
        }
      />

      <FilterBar
        resetHref={activeFilters.length > 0 ? '/admin-dashboard/exams' : undefined}
        activeFilters={activeFilters}
      >
        <FilterField label="Vendor">
          <select name="vendor" defaultValue={vendorFilter} className="input-sm">
            <option value="">All vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.slug}>
                {v.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Level">
          <select name="level" defaultValue={levelFilter} className="input-sm">
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Search" className="min-w-[14rem] flex-1">
          <input name="q" defaultValue={q} placeholder="Title or code…" className="input-sm" />
        </FilterField>
        <FilterField label="View">
          <select name="archived" defaultValue={archived ? '1' : ''} className="input-sm">
            <option value="">Active</option>
            <option value="1">Archived</option>
          </select>
        </FilterField>
      </FilterBar>

      {!archived && (
        <form
          id={BULK_FORM_ID}
          action={bulkExamAction}
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
          <button
            type="submit"
            name="op"
            value="archive"
            className="btn-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Archive
          </button>
        </form>
      )}

      <DataTable
        columns={columns}
        rows={exams}
        rowKey={(e) => e.id}
        empty={
          <>
            No exams match this filter.{' '}
            <Link href="/admin-dashboard/exams" className="text-blue-600 hover:underline dark:text-blue-400">
              Clear
            </Link>
          </>
        }
      />

      <Pager page={page} pages={totalPages} buildHref={buildHref} />
    </div>
  );
}
