import { UserChrome } from '@/components/user-chrome';
import { ImpersonationBanner } from '@/components/impersonation-banner';

export default function MyContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ImpersonationBanner />
      <UserChrome>{children}</UserChrome>
    </>
  );
}
