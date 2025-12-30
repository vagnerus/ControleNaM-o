'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getRedirectResult } from 'firebase/auth';

const AUTH_ROUTES = ['/login', '/signup'];
const PUBLIC_ROUTES = [...AUTH_ROUTES]; 

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading, userError } = useUser();

  useEffect(() => {
    // This handles the redirect result from Google Sign-In
    getRedirectResult(auth).catch((error) => {
      // Handle or log errors from the redirect result if necessary
      console.error("Error from redirect result:", error);
    });
  }, [auth]);

  useEffect(() => {
    if (isUserLoading) {
        return; // Wait until the user's status is determined
    }

    const isAuthRoute = AUTH_ROUTES.includes(pathname);

    if (user) {
      if (isAuthRoute) {
        // If the user is logged in and on an auth route, redirect to the dashboard
        router.replace('/dashboard');
      }
      // If the user is logged in and on a protected route, do nothing, let them stay.
    } else {
      if (!PUBLIC_ROUTES.includes(pathname)) {
        // If the user is not logged in and not on a public route, redirect to login
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, pathname, router]);

  // While loading or if a non-logged-in user is on a protected path, show a loader.
  // This prevents flashing the content of a protected page before redirection.
  if (isUserLoading || (!user && !PUBLIC_ROUTES.includes(pathname))) {
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

  // If the logic above has passed, render the children.
  return <>{children}</>;
}
