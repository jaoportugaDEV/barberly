"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, Users, DollarSign, Settings, LogOut } from "lucide-react";
import supabase from "@/lib/supabaseClient";

const nav = [
  { name: "Agenda", path: "/dashboard", icon: Calendar },
  { name: "Clientes", path: "/dashboard/clientes", icon: Users },
  { name: "Financeiro", path: "/dashboard/financeiro", icon: DollarSign },
  { name: "Configurações", path: "/dashboard/configuracoes", icon: Settings },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [nome, setNome] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setNome(user.user_metadata?.nome || "Usuário");
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-yellow-600 p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-yellow-500 mb-1">Barberly</h1>
        
        {/* Bem-vindo */}
        <p className="text-sm text-gray-400 mb-8">
          👋 Bem-vindo, <span className="text-yellow-400">{nome}</span>
        </p>

        {/* Navegação */}
        <nav className="flex-1 space-y-2">
          {nav.map(({ name, path, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                href={path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                  active
                    ? "bg-yellow-500 text-black font-semibold"
                    : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400"
                }`}
              >
                <Icon size={18} />
                {name}
              </Link>
            );
          })}
        </nav>

        {/* Botão sair */}
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
