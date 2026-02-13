"use client";

import { Bell, Search, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Header() {
    const { data: session } = useSession();

    const router = useRouter();

    const handleSearch = (e) => {
        if (e.key === "Enter") {
            const query = e.target.value;
            if (query.trim()) {
                router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
            }
        }
    };

    return (
        <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4 flex-1">
                <div className="max-w-md w-full relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search everything..."
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 placeholder-zinc-400"
                        onKeyDown={handleSearch}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 text-zinc-500 hover:bg-zinc-100 rounded-full transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
                </button>

                <div className="h-8 w-px bg-zinc-200" />

                <div className="flex items-center gap-3 pl-2 cursor-pointer group">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-zinc-900 leading-none">
                            {session?.user?.name}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1 tracking-wider">
                            {session?.user?.role}
                        </p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center border-2 border-white shadow-lg group-hover:scale-105 transition-all overflow-hidden">
                        {session?.user?.image ? (
                            <img src={session.user.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-5 w-5 text-white" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
