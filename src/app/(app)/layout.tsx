import Sidebar from '@/components/Sidebar';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="grid grid-cols-[240px_1fr] min-h-screen">
      <Sidebar
        userEmail={session.email}
        userRole={session.role.toLowerCase()}
      />
      <main className="p-7 lg:p-[28px_32px] max-w-[1180px] w-full">{children}</main>
    </div>
  );
}
