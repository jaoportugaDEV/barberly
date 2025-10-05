"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  Building2,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

// 🔹 Itens atualizados (sem Clientes e Serviços)
const nav = [
  { name: "Dashboard", path: "", icon: LayoutDashboard },
  { name: "Agenda", path: "agenda", icon: Calendar },
  { name: "Financeiro", path: "financeiro", icon: DollarSign },
  { name: "Barbearias", path: "barbearias", icon: Building2 },
  { name: "Barbeiros", path: "barbeiros", icon: Users },
  { name: "Configurações", path: "configuracoes", icon: Settings },
];

export default function DonoLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams(); // 👈 captura o donoid dinâmico
  const [user, setUser] = useState(null);

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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-yellow-600 p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-yellow-500 mb-2">Barberly Dono</h1>
        {user && (
          <p className="text-gray-400 mb-6">
            Bem-vindo,{" "}
            <span className="text-yellow-500 font-semibold">
              {user.user_metadata?.nome || user.email}
            </span>
          </p>
        )}

        <nav className="flex-1 space-y-2">
          {nav.map(({ name, path, icon: Icon }) => {
            const href = `/dono/${params.donoid}/${path}`;
            const active =
              pathname === href ||
              (path === "" && pathname === `/dono/${params.donoid}`);

            return (
              <Link
                key={path}
                href={href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                  active
                    ? "bg-yellow-600 text-black font-semibold"
                    : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400"
                }`}
              >
                <Icon size={18} />
                {name}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition"
        >
          <LogOut size={18} /> Sair
        </button>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
