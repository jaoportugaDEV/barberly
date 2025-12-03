"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Link from "next/link";
import {
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingCart,
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push("/login");
      } else {
        setUser(data.user);
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const nav = [
    { name: "Agenda", path: "/dashboard/[id]", icon: Calendar },
    { name: "Financeiro", path: "/dashboard/[id]/financeiro", icon: DollarSign },
    { name: "Vender Produto", path: "/dashboard/[id]/vendas", icon: ShoppingCart },
    { name: "Configurações", path: "/dashboard/[id]/configuracoes", icon: Settings },
  ];

  const resolveHref = (path) => path.replace("[id]", user?.id || "");
  const isActive = (path) => {
    const href = resolveHref(path);
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-950 border-r border-yellow-600/40 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 pb-4 border-b border-gray-900 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Saloniq</p>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              Funcionário
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {user && (
          <div className="px-6 py-4 border-b border-gray-900">
            <p className="text-xs text-gray-400 mb-1">Bem-vindo</p>
            <p className="text-yellow-400 font-semibold truncate">
              {user.user_metadata?.nome || user.email}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">ID #{user.id.slice(0, 8)}</p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-6 space-y-2">
          {nav.map(({ name, path, icon: Icon }) => {
            const href = resolveHref(path);
            return (
              <Link
                key={path}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(path)
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-semibold shadow-lg shadow-yellow-600/30"
                    : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400 hover:translate-x-1"
                }`}
              >
                <Icon size={18} />
                <span>{name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-gray-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-semibold rounded-lg transition-all duration-200 shadow-md shadow-yellow-600/30"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-950/95 backdrop-blur-md border-b border-yellow-600/40 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-800 transition text-yellow-400"
        >
          <Menu size={22} />
        </button>
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-gray-500 uppercase">Saloniq</p>
          <p className="text-lg font-semibold text-yellow-400">Funcionário</p>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 p-4 md:p-10 pt-20 md:pt-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
