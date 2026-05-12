import { redirect } from 'next/navigation';

export default function AdminSettingsLandingPage() {
  // Settings is now navigated via the left sidebar children.
  // Land on Company Info by default.
  redirect('/admin-dashboard/settings/company');
}
