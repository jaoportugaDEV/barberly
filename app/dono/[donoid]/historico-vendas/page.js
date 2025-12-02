"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import {
  CalendarDays,
  Filter,
  History,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet2,
} from "lucide-react";

export default function HistoricoVendasPage() {
  const { donoid } = useParams();
  const [vendas, setVendas] = useState([]);
  const [empresaId, setEmpresaId] = useState(null);
  const [filtro, setFiltro] = useState("mes"); // "mes" | "dia"
  const [dataFiltro, setDataFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    buscarEmpresa();
  }, []);

  useEffect(() => {
    if (empresaId) {
      carregarVendas();
    }
  }, [empresaId, filtro, dataFiltro, categoriaFiltro]);

  async function buscarEmpresa() {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) return;

      const { data: barbearia, error } = await supabase
        .from("barbearias")
        .select("id")
        .eq("dono_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar barbearia:", error);
        return;
      }

      if (barbearia) {
        setEmpresaId(barbearia.id);
      } else {
        console.warn("Nenhuma barbearia encontrada para este dono.");
      }
    } catch (err) {
      console.error("Erro ao buscar empresa:", err);
    }
  }

  async function carregarVendas() {
    try {
      let query = supabase
        .from("vendas")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("id", { ascending: false });

      // Filtro de categoria
      if (categoriaFiltro) {
        query = query.eq("categoria", categoriaFiltro);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao carregar vendas:", error);
        setVendas([]);
        return;
      }

      let vendasFiltradas = data || [];

      // Filtro de data no lado do cliente
      if (filtro === "mes" && dataFiltro) {
        const inicio = new Date(dataFiltro + "-01T00:00:00");
        const fim = new Date(inicio);
        fim.setMonth(fim.getMonth() + 1);
        vendasFiltradas = vendasFiltradas.filter((v) => {
          const dataVenda = v.data_venda ? new Date(v.data_venda) : null;
          return dataVenda && dataVenda >= inicio && dataVenda < fim;
        });
      } else if (filtro === "dia" && dataFiltro) {
        const inicio = new Date(dataFiltro + "T00:00:00");
        const fim = new Date(dataFiltro + "T23:59:59");
        vendasFiltradas = vendasFiltradas.filter((v) => {
          const dataVenda = v.data_venda ? new Date(v.data_venda) : null;
          return dataVenda && dataVenda >= inicio && dataVenda <= fim;
        });
      }

      setVendas(vendasFiltradas);

      // Extrair categorias únicas
      const cats = [...new Set((data || []).map((v) => v.categoria))].filter(Boolean);
      setCategorias(cats.sort((a, b) => a.localeCompare(b)));
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
      setVendas([]);
    }
  }

  const formatCurrency = (valor = 0) =>
    Number(valor || 0).toLocaleString("pt-PT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const totalVendido = vendas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
  const totalItens = vendas.reduce((acc, v) => acc + (Number(v.quantidade) || 0), 0);
  const ticketMedio = vendas.length ? totalVendido / vendas.length : 0;
  const ultimaVenda = vendas[0];

  const periodoLabel = (() => {
    if (!dataFiltro) return filtro === "mes" ? "mês atual" : "dia atual";
    try {
      if (filtro === "mes") {
        const dt = new Date(`${dataFiltro}-01T00:00:00`);
        return dt.toLocaleDateString("pt-PT", {
          month: "long",
          year: "numeric",
        });
      }
      const dt = new Date(`${dataFiltro}T00:00:00`);
      return dt.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
      });
    } catch {
      return "período selecionado";
    }
  })();

  const resumoCards = [
    {
      label: "Total vendido",
      value: `€${formatCurrency(totalVendido)}`,
      helper: periodoLabel,
      icon: Wallet2,
    },
    {
      label: "Vendas realizadas",
      value: vendas.length,
      helper: "transações concluídas",
      icon: ShoppingCart,
    },
    {
      label: "Itens vendidos",
      value: totalItens,
      helper: "unidades movimentadas",
      icon: Package,
    },
    {
      label: "Ticket médio",
      value: `€${formatCurrency(ticketMedio)}`,
      helper: "por venda",
      icon: TrendingUp,
    },
  ];

  const temFiltroAplicado = Boolean(dataFiltro || categoriaFiltro);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-4 lg:p-8 space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
            Relatório
          </p>
          <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent flex items-center gap-3">
            <History size={28} />
            Histórico de vendas
          </h1>
          <p className="text-gray-400 max-w-2xl mt-2">
            Acompanhe todas as vendas realizadas, filtre por período e categoria,
            e visualize o desempenho do seu estoque num layout otimizado para mobile.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Período
            </p>
            <p className="text-lg font-semibold text-white capitalize">
              {periodoLabel}
            </p>
          </div>
          <button
            onClick={carregarVendas}
            className="px-5 py-3 rounded-xl border border-gray-700 text-gray-200 hover:border-yellow-500 hover:text-yellow-400 transition"
          >
            Atualizar dados
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {resumoCards.map(({ label, value, helper, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-800/70 bg-gray-900/40 backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">{label}</p>
              <span className="p-2 rounded-full bg-gray-800">
                <Icon size={18} className="text-yellow-400" />
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{value}</p>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {helper}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-4 bg-gray-900/30 border border-gray-800 rounded-2xl p-4 lg:p-6">
        <div className="flex items-center gap-2 text-yellow-400">
          <Filter size={18} />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Tipo de filtro</label>
            <select
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value);
                setDataFiltro("");
              }}
              className="px-4 py-3 rounded-xl bg-gray-950/60 border border-gray-800 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
            >
              <option value="mes">Por mês</option>
              <option value="dia">Por dia</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm text-gray-400">Selecione o período</label>
            {filtro === "mes" ? (
              <input
                type="month"
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray-950/60 border border-gray-800 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            ) : (
              <input
                type="date"
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray-950/60 border border-gray-800 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            )}
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm text-gray-400">Categoria</label>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="px-4 py-3 rounded-xl bg-gray-950/60 border border-gray-800 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setDataFiltro("");
                setCategoriaFiltro("");
              }}
              className="px-4 py-3 rounded-xl border border-gray-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!temFiltroAplicado}
            >
              Limpar
            </button>
            <button
              onClick={carregarVendas}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold shadow-lg shadow-yellow-600/20 hover:scale-[1.01] transition"
            >
              Aplicar
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Transações</h2>
          <p className="text-sm text-gray-400">
            {vendas.length} venda{vendas.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/40">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 text-yellow-400 text-left">
                <th className="p-4">Data</th>
                <th className="p-4">Produto</th>
                <th className="p-4">Categoria</th>
                <th className="p-4 text-center">Quantidade</th>
                <th className="p-4 text-right">Preço Un.</th>
                <th className="p-4 text-right">Total (€)</th>
              </tr>
            </thead>
            <tbody>
              {vendas.length > 0 ? (
                vendas.map((venda) => (
                  <tr
                    key={venda.id}
                    className="border-t border-gray-800 hover:bg-gray-900/60 transition"
                  >
                    <td className="p-4 text-gray-300">
                      {venda.data_venda ? new Date(venda.data_venda).toLocaleString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : "—"}
                    </td>
                    <td className="p-4 text-gray-200">{venda.produto}</td>
                    <td className="p-4 text-gray-400">{venda.categoria}</td>
                    <td className="p-4 text-center text-white font-semibold">
                      {venda.quantidade}
                    </td>
                    <td className="p-4 text-right text-gray-300">
                      €{formatCurrency(venda.preco)}
                    </td>
                    <td className="p-4 text-right text-green-400 font-semibold">
                      €{formatCurrency(venda.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-gray-500 italic"
                  >
                    Nenhuma venda encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="space-y-3 md:hidden">
          {vendas.length > 0 ? (
            vendas.map((venda) => (
              <div
                key={venda.id}
                className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    {venda.data_venda ? new Date(venda.data_venda).toLocaleString("pt-PT", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : "—"}
                  </span>
                  <span className="text-green-400 font-semibold text-lg">
                    €{formatCurrency(venda.total)}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    {venda.produto}
                  </p>
                  <p className="text-sm text-gray-400">{venda.categoria}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <div>
                    <p className="text-xs text-gray-500">Quantidade</p>
                    <p className="text-white font-semibold">
                      {venda.quantidade} un
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Preço unitário</p>
                    <p className="text-gray-300">€{formatCurrency(venda.preco)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-700 p-6 text-center text-gray-400">
              Nenhuma venda encontrada
            </div>
          )}
        </div>
      </section>

      {vendas.length > 0 && (
        <section className="rounded-2xl border border-gray-800 bg-gray-900/30 p-5 space-y-3">
          <h3 className="text-lg font-semibold text-yellow-400">
            Resumo por categoria
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {categorias.map((cat) => {
              const vendasCat = vendas.filter((v) => v.categoria === cat);
              const totalCat = vendasCat.reduce(
                (acc, v) => acc + (Number(v.total) || 0),
                0
              );
              const qtdCat = vendasCat.reduce(
                (acc, v) => acc + (Number(v.quantidade) || 0),
                0
              );
              return (
                <div
                  key={cat}
                  className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 space-y-2"
                >
                  <p className="text-white font-semibold">{cat}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {vendasCat.length} venda{vendasCat.length === 1 ? "" : "s"}
                    </span>
                    <span className="text-gray-400">{qtdCat} un</span>
                  </div>
                  <p className="text-green-400 font-semibold text-lg">
                    €{formatCurrency(totalCat)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

