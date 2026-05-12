import { UserChrome } from '@/components/user-chrome';

export default function MyContentLayout({ children }: { children: React.ReactNode }) {
  return <UserChrome>{children}</UserChrome>;
}
