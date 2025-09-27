"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import {
  Calendar,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Building2,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push("/login");
      } else {
        setUser(data.user);

        const { data: barbearias } = await supabase
          .from("barbearias")
          .select("id")
          .eq("dono_id", data.user.id);

        if (barbearias && barbearias.length > 0) {
          setIsOwner(true);
        }
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const nav = [
    { name: "Agenda", path: "/dashboard", icon: Calendar },
    { name: "Clientes", path: "/dashboard/clientes", icon: Users },
    { name: "Financeiro", path: "/dashboard/financeiro", icon: DollarSign },
    { name: "Configurações", path: "/dashboard/configuracoes", icon: Settings },
  ];

  if (isOwner) {
    nav.push({
      name: "Dashboard do Dono",
      path: "/dashboard/dono",
      icon: Building2,
    });
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-gray-950 border-r border-yellow-600 p-6 flex-col">
        <h1 className="text-2xl font-bold text-yellow-500 mb-2">Barberly</h1>
        {user && (
          <p className="text-gray-400 mb-6">
            Bem-vindo,{" "}
            <span className="text-yellow-500 font-semibold">
              {user.user_metadata?.nome || user.email}
            </span>
          </p>
        )}

        <nav className="flex-1 space-y-2">
          {nav.map(({ name, path, icon: Icon }) => (
            <Link
              key={path}
              href={path}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                pathname === path
                  ? "bg-yellow-600 text-black font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400"
              }`}
            >
              <Icon size={18} />
              {name}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition"
        >
          <LogOut size={18} /> Sair
        </button>
      </aside>

      {/* Sidebar Mobile */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-gray-950 border-r border-yellow-600 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-yellow-500">Barberly</h1>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 space-y-2">
              {nav.map(({ name, path, icon: Icon }) => (
                <Link
                  key={path}
                  href={path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                    pathname === path
                      ? "bg-yellow-600 text-black font-semibold"
                      : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400"
                  }`}
                >
                  <Icon size={18} />
                  {name}
                </Link>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="mt-auto flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              <LogOut size={18} /> Sair
            </button>
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setOpen(false)}
          ></div>
        </div>
      )}

      {/* Conteúdo */}
      <main className="flex-1 p-6">
        {/* Topbar mobile */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <h1 className="text-xl font-bold text-yellow-500">Barberly</h1>
          <button
            onClick={() => setOpen(true)}
            className="text-gray-300 hover:text-white"
          >
            <Menu size={28} />
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}
