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
                    const identifier = credentials.username.trim();
                    const user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { username: identifier },
                                { email: identifier }
                            ]
                        },
                        include: { branch: true },
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
                        branchId: user.branchId,
                        branch: user.branch ? {
                            id: user.branch.id,
                            name: user.branch.name,
                            code: user.branch.code,
                            phone: user.branch.phone,
                            address: user.branch.address,
                            slogan: user.branch.slogan,
                            logo: user.branch.logo,
                            notes: user.branch.notes,
                        } : null,
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
                token.branchId = user.branchId;
                token.branch = user.branch;
            } else if (token.sub) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: parseInt(token.sub) },
                        include: { branch: true },
                    });
                    if (dbUser) {
                        token.role = dbUser.role;
                        token.id = dbUser.id.toString();
                        token.name = dbUser.fullName;
                        token.permissions = dbUser.permissions;
                        token.branchId = dbUser.branchId;
                        token.branch = dbUser.branch ? {
                            id: dbUser.branch.id,
                            name: dbUser.branch.name,
                            code: dbUser.branch.code,
                            phone: dbUser.branch.phone,
                            address: dbUser.branch.address,
                            slogan: dbUser.branch.slogan,
                            logo: dbUser.branch.logo,
                            notes: dbUser.branch.notes,
                        } : null;
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
                session.user.branchId = token.branchId || null;
                session.user.branch = token.branch || null;
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
