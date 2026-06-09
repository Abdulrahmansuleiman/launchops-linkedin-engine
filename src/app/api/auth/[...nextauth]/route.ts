import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.email === "admin@linkedinops.com" && credentials?.password === "admin123") {
          return { id: "1", name: "Admin", email: "admin@linkedinops.com" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
