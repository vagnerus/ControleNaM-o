import { redirect } from 'next/navigation';

export default function RootPage() {
  // Unathenticated users will be redirected to the login page by the layout.
  // Authenticated users will be redirected to the dashboard.
  redirect('/dashboard');
}
