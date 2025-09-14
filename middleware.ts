import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Allow all requests to pass through
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Always allow access to login, public-test, and API auth routes
        if (
          req.nextUrl.pathname.startsWith('/login') ||
          req.nextUrl.pathname.startsWith('/public-test') ||
          req.nextUrl.pathname.startsWith('/api/auth') ||
          req.nextUrl.pathname === '/'
        ) {
          return true
        }
        
        // For all other routes, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}