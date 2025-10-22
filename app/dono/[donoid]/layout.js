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
  LogOut,
  Package,
  PlusSquare,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  LineChart,
  Settings, // ⚙️ novo ícone para configurações
} from "lucide-react";

export default function DonoLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [user, setUser] = useState(null);
  const [openMenus, setOpenMenus] = useState({
    estoque: true,
    vendas: false,
    financeiro: false,
  });

  // ✅ Verifica autenticação
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

  // 🔹 Abre/fecha grupos de menu
  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  // 🔹 Navegação principal
  const nav = [
    { name: "Dashboard", path: "", icon: LayoutDashboard },
    { name: "Agenda", path: "agenda", icon: Calendar },
    { name: "Barbearias", path: "barbearias", icon: Building2 },
    { name: "Barbeiros", path: "barbeiros", icon: Users },
    { name: "Configurações", path: "configuracoes", icon: Settings }, // ⚙️ novo item
  ];

  // 🔸 Submenu Estoque
  const estoqueSubnav = [
    { name: "Produtos", path: "estoque", icon: Package },
    { name: "Novo Produto", path: "novo", icon: PlusSquare },
  ];

  // 🔸 Submenu Vendas
  const vendasSubnav = [
    { name: "Vender Produto", path: "vendas", icon: ShoppingCart },
    { name: "Histórico de Vendas", path: "historico-vendas", icon: LineChart },
  ];

  // 🔸 Submenu Financeiro
  const financeiroSubnav = [
    { name: "Financeiro Geral", path: "financeiro", icon: DollarSign },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-yellow-600 p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-yellow-500 mb-2">Barberly Dono</h1>

        {user && (
          <p className="text-gray-400 mb-6 text-sm">
            Bem-vindo,{" "}
            <span className="text-yellow-500 font-semibold">
              {user.user_metadata?.nome || user.email}
            </span>
          </p>
        )}

        <nav className="flex-1 space-y-2">
          {/* Links principais */}
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

          {/* Grupo Estoque */}
          <div className="mt-4">
            <button
              onClick={() => toggleMenu("estoque")}
              className="flex items-center justify-between w-full px-4 py-2 rounded-lg text-left text-gray-300 hover:bg-gray-800 hover:text-yellow-400 transition"
            >
              <span className="flex items-center gap-3 font-semibold">
                <Package size={18} /> Estoque
              </span>
              {openMenus.estoque ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {openMenus.estoque && (
              <div className="mt-1 ml-4 border-l border-gray-800 pl-3 space-y-1">
                {estoqueSubnav.map(({ name, path, icon: Icon }) => {
                  const href = `/dono/${params.donoid}/${path}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={path}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                        active
                          ? "bg-yellow-600 text-black font-semibold"
                          : "text-gray-400 hover:bg-gray-800 hover:text-yellow-400"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-sm">{name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grupo Vendas */}
          <div className="mt-4">
            <button
              onClick={() => toggleMenu("vendas")}
              className="flex items-center justify-between w-full px-4 py-2 rounded-lg text-left text-gray-300 hover:bg-gray-800 hover:text-yellow-400 transition"
            >
              <span className="flex items-center gap-3 font-semibold">
                <ShoppingCart size={18} /> Vendas
              </span>
              {openMenus.vendas ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {openMenus.vendas && (
              <div className="mt-1 ml-4 border-l border-gray-800 pl-3 space-y-1">
                {vendasSubnav.map(({ name, path, icon: Icon }) => {
                  const href = `/dono/${params.donoid}/${path}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={path}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                        active
                          ? "bg-yellow-600 text-black font-semibold"
                          : "text-gray-400 hover:bg-gray-800 hover:text-yellow-400"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-sm">{name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grupo Financeiro */}
          <div className="mt-4">
            <button
              onClick={() => toggleMenu("financeiro")}
              className="flex items-center justify-between w-full px-4 py-2 rounded-lg text-left text-gray-300 hover:bg-gray-800 hover:text-yellow-400 transition"
            >
              <span className="flex items-center gap-3 font-semibold">
                <DollarSign size={18} /> Financeiro
              </span>
              {openMenus.financeiro ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            {openMenus.financeiro && (
              <div className="mt-1 ml-4 border-l border-gray-800 pl-3 space-y-1">
                {financeiroSubnav.map(({ name, path, icon: Icon }) => {
                  const href = `/dono/${params.donoid}/${path}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={path}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                        active
                          ? "bg-yellow-600 text-black font-semibold"
                          : "text-gray-400 hover:bg-gray-800 hover:text-yellow-400"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-sm">{name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Botão de sair */}
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition"
        >
          <LogOut size={18} /> Sair
        </button>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-10 overflow-y-auto">{children}</main>
    </div>
  );
}
