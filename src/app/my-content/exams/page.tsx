import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getGroupedExams, toListItems } from '@/lib/my-exams';
import { MyExamsList } from '@/components/my-exams-list';

export default async function MyExamsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect('/login');

  const grouped = await getGroupedExams(userId);
  const items = toListItems(grouped);
  const total = grouped.bundles.length + grouped.standalone.length;

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Exams</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {total === 0
              ? "You don't own any exams yet."
              : `${total} ${total === 1 ? 'exam' : 'exams'} in your library.`}
          </p>
        </div>
      </div>
      <MyExamsList items={items} />
    </>
  );
}
