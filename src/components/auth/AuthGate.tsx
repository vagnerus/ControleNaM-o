'use client';

import { usePathname, redirect } from 'next/navigation';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const AUTH_ROUTES = ['/login', '/signup'];
const PUBLIC_ROUTES = [...AUTH_ROUTES]; 

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading, userError } = useUser();

  useEffect(() => {
    if (isUserLoading) return; // Wait for user status to be determined

    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    
    if (user && isAuthRoute) {
      // If user is logged in and tries to access login/signup, redirect to dashboard
      redirect('/dashboard');
    } else if (!user && !PUBLIC_ROUTES.includes(pathname)) {
      // If user is not logged in and not on a public route, redirect to login
      redirect('/login');
    }

  }, [user, isUserLoading, pathname]);

  if (isUserLoading || (!user && !PUBLIC_ROUTES.includes(pathname))) {
    // Show a loading spinner while checking auth status or before redirecting
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (userError) {
    // Optional: show a generic error message
    return (
        <div className="flex h-screen items-center justify-center">
            <p className="text-destructive">Ocorreu um erro de autenticação. Tente novamente mais tarde.</p>
        </div>
    )
  }

  return <>{children}</>;
}
