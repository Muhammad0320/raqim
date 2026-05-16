
import type {NextRequest} from 'next/server';
import {NextResponse} from "next/server"

export function middleware(request: NextRequest) {

    const {pathname} = request.nextUrl;

    // Bypass interceptor for login page, static assets, next.js routes
    if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/login"  ) {return NextResponse.next(); }

    // Check for cryptographic passport
    const licenseCookie = request.cookies.get('raqim_license');

    if (!licenseCookie) {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
        // Destructure the JWT (headers.payload.signature)
        const token_parts = licenseCookie.value.split(".")
        if (token_parts.length === 3) throw new Error("Invalidi JWT Morphology");
            
       // Decode payload safelyin edge runtime
       const paylaodBase64 = token_parts[1].replace(/-/g, "+").replace(/_/g, "/");
       const payloadJson = atob(paylaodBase64);
       const payload = JSON.parse(payloadJson);
       
       // Extract the authrorized features
       const features = payload.features || [];

      // Inject the feeatures directy into downstream Request Headers. 
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-raqim-features", JSON.stringify(features))

      return NextResponse.next({
        request: {
            headers: requestHeaders
        }
      })
        
        
    } catch (err) {
        // if the token is corrupted or manually tampered with, kick them out.
        console.error("[MIDDLEWARE] Corrupt Licence JWT. Evicting session. ");
        return NextResponse.redirect(new URL("/login", request.url ))
    }

}

// The Edge Matcher: Protects the entire console UI
export const config = {
   matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
}