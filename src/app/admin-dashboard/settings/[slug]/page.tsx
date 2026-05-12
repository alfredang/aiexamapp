import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAllSettings, SECRET_KEYS, mask } from '@/lib/settings';
import SectionForm from '../section-form';
import { getGroup } from '../groups';

export const dynamic = 'force-dynamic';

// 'payment' has a dedicated route at /settings/payment with collapsible
// provider sub-sections, so it's intentionally excluded here.
const VALID_SLUGS = ['company', 'branding', 'credentials'];

export default async function SettingsSectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');
  const { slug } = await params;
  if (!VALID_SLUGS.includes(slug)) return notFound();
  const group = getGroup(slug);
  if (!group) return notFound();

  const values = await getAllSettings();
  const initial: Record<string, { configured: boolean; preview: string; current: string }> = {};
  for (const f of group.fields) {
    const v = values[f.key as keyof typeof values] || '';
    const isSecret = SECRET_KEYS.has(f.key as any);
    initial[f.key] = {
      configured: !!v,
      preview: isSecret ? mask(v) : v,
      current: v
    };
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{group.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{group.description}</p>
      <SectionForm group={group} initial={initial} />
    </div>
  );
}
