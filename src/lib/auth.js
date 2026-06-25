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
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { username: credentials.username },
                    });

                    if (!user || !user.passwordHash) {
                        throw new Error("User not found");
                    }

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
                token.name = user.name;
            } else if (!token.role && token.sub) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: parseInt(token.sub) },
                    });
                    if (dbUser) {
                        token.role = dbUser.role;
                        token.id = dbUser.id.toString();
                        token.name = dbUser.fullName;
                    }
                } catch (error) {
                    console.error("Error fetching user in jwt callback", error);
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role || "STAFF"; // Fallback to avoid empty sidebar
                session.user.id = token.id;
                if (token.name) {
                    session.user.name = token.name;
                }
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
