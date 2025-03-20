import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/' || 
    path === '/auth/login' || 
    path === '/auth/register' || 
    path === '/auth/forgot-password' ||
    path === '/auth/admin/login' ||
    path === '/auth/security/login';

  // Check if path is an admin path
  const isAdminPath = path.startsWith('/admin');
  
  // Check if path is a security staff path
  const isSecurityPath = path.startsWith('/security');

  // Check for Firebase Auth session cookies
  const allCookies = request.cookies.getAll();
  
  // Look for authentication cookies
  const hasFbSession = allCookies.some(cookie => 
    // Either direct Firebase cookie
    cookie.name.startsWith('firebase:authUser:') || 
    // Or custom session cookie
    cookie.name === 'session'
  );

  // Check for admin authentication
  const hasAdminSession = allCookies.some(cookie => 
    cookie.name === 'admin'
  );
  
  // Check for security staff authentication
  const hasSecuritySession = allCookies.some(cookie => 
    cookie.name === 'security'
  );
  
  // Debug information - make this visible in server logs
  console.log(`Path: ${path}, Public: ${isPublicPath}, Auth: ${hasFbSession ? 'Yes' : 'No'}, Admin: ${hasAdminSession ? 'Yes' : 'No'}, Security: ${hasSecuritySession ? 'Yes' : 'No'}`);
  
  // If admin is trying to access regular dashboard, redirect to admin dashboard
  if (hasAdminSession && path === '/dashboard') {
    console.log('Admin trying to access regular dashboard, redirecting to admin dashboard');
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  // If security is trying to access regular dashboard, redirect to security dashboard
  if (hasSecuritySession && path === '/dashboard') {
    console.log('Security trying to access regular dashboard, redirecting to security dashboard');
    return NextResponse.redirect(new URL('/security/dashboard', request.url));
  }
  
  // Admin route protection
  if (isAdminPath && !hasAdminSession) {
    console.log('Redirecting to admin login page');
    return NextResponse.redirect(new URL('/auth/admin/login', request.url));
  }
  
  // Security staff route protection
  if (isSecurityPath && !hasSecuritySession) {
    console.log('Redirecting to security login page');
    return NextResponse.redirect(new URL('/auth/security/login', request.url));
  }
  
  // Regular auth handling
  if (!hasFbSession && !isPublicPath) {
    console.log('Redirecting to login page');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (hasFbSession && isPublicPath && path !== '/' && 
      path !== '/auth/admin/login' && path !== '/auth/security/login') {
    // Determine where to redirect based on user role
    if (hasSecuritySession) {
      console.log('Security staff redirecting to security dashboard');
      return NextResponse.redirect(new URL('/security/dashboard', request.url));
    } else if (hasAdminSession) {
      console.log('Admin redirecting to admin dashboard');
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else {
      console.log('Regular user redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // If admin is logged in and tries to access regular login, redirect to admin dashboard
  if (hasAdminSession && path === '/auth/admin/login') {
    console.log('Admin already logged in, redirecting to admin dashboard');
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  // If security staff is logged in and tries to access security login, redirect to security dashboard
  if (hasSecuritySession && path === '/auth/security/login') {
    console.log('Security staff already logged in, redirecting to security dashboard');
    return NextResponse.redirect(new URL('/security/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}