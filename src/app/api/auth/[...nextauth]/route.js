import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log("Authorize called with:", credentials?.username);
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                try {
                    console.log("Searching for user in database...");
                    const user = await prisma.user.findUnique({
                        where: { username: credentials.username },
                    });

                    if (!user || !user.passwordHash) {
                        console.log("User not found or no password hash");
                        throw new Error("User not found");
                    }
                    console.log("User found:", user.username);

                    const isPasswordCorrect = await bcrypt.compare(
                        credentials.password,
                        user.passwordHash
                    );

                    if (!isPasswordCorrect) {
                        throw new Error("Invalid password");
                    }

                    return {
                        id: user.id.toString(),
                        name: user.fullName,
                        email: user.email,
                        role: user.role,
                    };
                } catch (error) {
                    console.error("Authorization error:", error);
                    throw error;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
