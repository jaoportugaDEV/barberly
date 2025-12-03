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
  Settings,
  Menu,
  X,
  CreditCard,
} from "lucide-react";

export default function DonoLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [user, setUser] = useState(null);
  const [openMenus, setOpenMenus] = useState({
    estoque: false,
    vendas: false,
    financeiro: false,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // 🔹 Alterna menus
  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  // 🔹 Navegação principal
  const nav = [
    { name: "Dashboard", path: "", icon: LayoutDashboard },
    { name: "Agenda", path: "agenda", icon: Calendar },
    { name: "Empresas", path: "barbearias", icon: Building2 },
    { name: "Colaboradores", path: "barbeiros", icon: Users },
    { name: "Assinatura", path: "assinatura", icon: CreditCard },
    { name: "Configurações", path: "configuracoes", icon: Settings },
  ];

  // 🔸 Submenus
  const estoqueSubnav = [
    { name: "Produtos", path: "estoque", icon: Package },
    { name: "Novo Produto", path: "novo", icon: PlusSquare },
  ];

  const vendasSubnav = [
    { name: "Vender Produto", path: "vendas", icon: ShoppingCart },
    { name: "Histórico de Vendas", path: "historico-vendas", icon: LineChart },
  ];

  const financeiroSubnav = [
    { name: "Financeiro Geral", path: "financeiro", icon: DollarSign },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-950 border-r border-yellow-600/50 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header fixo */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              Saloniq Dono
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {user && (
            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-gray-400 text-xs mb-1">Bem-vindo</p>
              <p className="text-yellow-500 font-semibold text-sm truncate">
                {user.user_metadata?.nome || user.email}
              </p>
            </div>
          )}
        </div>

        {/* Navegação com scroll */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-4 space-y-2 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-semibold shadow-lg shadow-yellow-600/20"
                    : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400 hover:translate-x-1"
                }`}
              >
                <Icon size={18} />
                <span>{name}</span>
              </Link>
            );
          })}

          {/* Grupo Estoque */}
          <div className="mt-4">
            <button
              onClick={() => toggleMenu("estoque")}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-left text-gray-300 hover:bg-gray-800 hover:text-yellow-400 transition-all duration-200"
            >
              <span className="flex items-center gap-3 font-semibold">
                <Package size={18} /> Estoque
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  openMenus.estoque ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>

            {openMenus.estoque && (
              <div className="mt-1 ml-4 border-l-2 border-yellow-600/30 pl-3 space-y-1 transition-all duration-200">
                {estoqueSubnav.map(({ name, path, icon: Icon }) => {
                  const href = `/dono/${params.donoid}/${path}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={path}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        active
                          ? "bg-yellow-600 text-black font-semibold shadow-md"
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
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-left text-gray-300 hover:bg-gray-800 hover:text-yellow-400 transition-all duration-200"
            >
              <span className="flex items-center gap-3 font-semibold">
                <ShoppingCart size={18} /> Vendas
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  openMenus.vendas ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>

            {openMenus.vendas && (
              <div className="mt-1 ml-4 border-l-2 border-yellow-600/30 pl-3 space-y-1 transition-all duration-200">
                {vendasSubnav.map(({ name, path, icon: Icon }) => {
                  const href = `/dono/${params.donoid}/${path}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={path}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        active
                          ? "bg-yellow-600 text-black font-semibold shadow-md"
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
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-left text-gray-300 hover:bg-gray-800 hover:text-yellow-400 transition-all duration-200"
            >
              <span className="flex items-center gap-3 font-semibold">
                <DollarSign size={18} /> Financeiro
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  openMenus.financeiro ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>

            {openMenus.financeiro && (
              <div className="mt-1 ml-4 border-l-2 border-yellow-600/30 pl-3 space-y-1 transition-all duration-200">
                {financeiroSubnav.map(({ name, path, icon: Icon }) => {
                  const href = `/dono/${params.donoid}/${path}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={path}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        active
                          ? "bg-yellow-600 text-black font-semibold shadow-md"
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

        {/* Botão de sair fixo */}
        <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-yellow-600/20 hover:shadow-xl hover:shadow-yellow-600/30"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* Header Mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-950/95 backdrop-blur-sm border-b border-yellow-600/50 p-4 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-800 rounded-lg transition"
        >
          <Menu size={24} className="text-yellow-500" />
        </button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
          Saloniq Dono
        </h1>
        <div className="w-10" /> {/* Spacer para centralizar */}
      </div>

      {/* Conteúdo */}
      <main className="flex-1 p-4 lg:p-10 pt-20 lg:pt-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
