import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');

      // Allow any API routes for authentication to pass through
      if (isApiAuthRoute) {
        return true;
      }

      // Allow tRPC API routes for public shared documents
      const isTrpcApi = nextUrl.pathname.startsWith('/api/trpc');
      if (isTrpcApi) {
        return true;
      }

      const isOnChat = nextUrl.pathname.startsWith('/');
      const isOnLoginPage = nextUrl.pathname.startsWith('/login');
      const isOnRegisterPage = nextUrl.pathname.startsWith('/register');

      if (isLoggedIn && (isOnLoginPage || isOnRegisterPage)) {
        return Response.redirect(new URL('/', nextUrl as unknown as URL));
      }

      if (isOnRegisterPage || isOnLoginPage) {
        return true;
      }

      if (isOnChat) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl as unknown as URL));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
