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
                    const user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { username: credentials.username },
                                { email: credentials.username }
                            ]
                        },
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
                        permissions: user.permissions,
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
                token.permissions = user.permissions;
            } else if (token.sub) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: parseInt(token.sub) },
                    });
                    if (dbUser) {
                        token.role = dbUser.role;
                        token.id = dbUser.id.toString();
                        token.name = dbUser.fullName;
                        token.permissions = dbUser.permissions;
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
                session.user.permissions = token.permissions || null;
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
