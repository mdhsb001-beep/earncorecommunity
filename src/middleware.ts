@@ .. @@
 import axios from "axios";
 import { NextRequest, NextResponse } from "next/server";

 export default async function middleware(request: NextRequest) {
+  // Skip middleware for public routes
+  const publicRoutes = ['/login', '/signup', '/'];
+  if (publicRoutes.includes(request.nextUrl.pathname)) {
+    return NextResponse.next();
+  }
+
   try {
     const res = await axios.post(
       `${process.env.NEXT_PUBLIC_API_URL}api/user/checkUser`,
       {},
       {
         headers: {
           Cookie: request.headers.get("cookie") || "",
+          "Content-Type": "application/json",
         },
       }
     );

     const user = res?.data?.isValid;

     if (!user) {
       return NextResponse.redirect(new URL("/login", request.url));
     }
+
+    return NextResponse.next();
   } catch (error) {
     console.error("Auth check failed:", error);
     return NextResponse.redirect(new URL("/login", request.url));
   }
 }

 export const config = {
-  // matcher: ["/dashboard/:path*"],
+  matcher: ["/dashboard/:path*", "/my-profile", "/profile/:path*"],
 };