"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { CalendarDays, Filter, TrendingUp, Wallet2 } from "lucide-react";

export default function FinanceiroPage() {
  const [barberId, setBarberId] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [filtro, setFiltro] = useState("mes"); // "mes" | "dia"
  const [dataFiltro, setDataFiltro] = useState("");

  // 🔹 Buscar o usuário logado
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setBarberId(user.id);
      }
    };
    getUser();
  }, []);

  // 🔹 Atualizar dados sempre que filtro ou data mudar
  useEffect(() => {
    if (barberId) {
      fetchFinanceiro();
    }
  }, [barberId, filtro, dataFiltro]);

  // 🔹 Buscar registros no banco
  async function fetchFinanceiro() {
    let query = supabase
      .from("financeiro")
      .select(
        `
        id,
        data,
        valor,
        descricao,
        services(name)
      `
      )
      .eq("barbeiro_id", barberId)
      .order("data", { ascending: false });

    // Filtros de mês e dia
    if (filtro === "mes" && dataFiltro) {
      const inicio = new Date(dataFiltro + "-01T00:00:00");
      const fim = new Date(inicio);
      fim.setMonth(fim.getMonth() + 1);
      query = query
        .gte("data", inicio.toISOString())
        .lt("data", fim.toISOString());
    } else if (filtro === "dia" && dataFiltro) {
      const inicio = new Date(dataFiltro + "T00:00:00");
      const fim = new Date(dataFiltro + "T23:59:59");
      query = query
        .gte("data", inicio.toISOString())
        .lte("data", fim.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Erro ao buscar financeiro:", error);
      setRegistros([]);
      setTotal(0);
      return;
    }

    setRegistros(data || []);
    const soma = (data || []).reduce((acc, a) => acc + (a.valor || 0), 0);
    setTotal(soma);
  }

  const formatCurrency = (valor = 0) =>
    Number(valor || 0).toLocaleString("pt-PT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
  const ticketMedio = registros.length ? total / registros.length : 0;
  const ultimoRegistro = registros[0];
  const resumoCards = [
    {
      label: "Total filtrado",
      value: `€${formatCurrency(total)}`,
      helper: periodoLabel,
      icon: Wallet2,
    },
    {
      label: "Registros",
      value: registros.length,
      helper: "lançamentos encontrados",
      icon: CalendarDays,
    },
    {
      label: "Ticket médio",
      value: `€${formatCurrency(ticketMedio)}`,
      helper: "por atendimento concluído",
      icon: TrendingUp,
    },
    {
      label: "Último lançamento",
      value: ultimoRegistro
        ? `€${formatCurrency(ultimoRegistro.valor)}`
        : "—",
      helper: ultimoRegistro
        ? new Date(ultimoRegistro.data).toLocaleString("pt-PT", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Sem registros",
      icon: Filter,
    },
  ];
  const temFiltroAplicado = Boolean(dataFiltro);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-4 lg:p-8 space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
            Controle financeiro
          </p>
          <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent flex items-center gap-3">
            <Wallet2 size={28} />
            Financeiro
          </h1>
          <p className="text-gray-400 max-w-2xl mt-2">
            Veja o desempenho dos seus serviços, filtre por período e encontre
            todos os lançamentos num layout totalmente otimizado para mobile.
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
            onClick={fetchFinanceiro}
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
          <h2 className="text-lg font-semibold">Filtros de período</h2>
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
          <div className="flex gap-3">
            <button
              onClick={() => setDataFiltro("")}
              className="px-4 py-3 rounded-xl border border-gray-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!temFiltroAplicado}
            >
              Limpar
            </button>
            <button
              onClick={fetchFinanceiro}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold shadow-lg shadow-yellow-600/20 hover:scale-[1.01] transition"
            >
              Aplicar
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/40">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 text-yellow-400 text-left">
                <th className="p-4">Data</th>
                <th className="p-4">Serviço</th>
                <th className="p-4">Descrição</th>
                <th className="p-4 text-right">Valor (€)</th>
              </tr>
            </thead>
            <tbody>
              {registros.length > 0 ? (
                registros.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-gray-800 hover:bg-gray-900/60 transition"
                  >
                    <td className="p-4 text-gray-300">
                      {new Date(r.data).toLocaleString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 text-gray-200">
                      {r.services?.name || "Serviço"}
                    </td>
                    <td className="p-4 text-gray-400">
                      {r.descricao || "—"}
                    </td>
                    <td className="p-4 text-right text-green-400 font-semibold">
                      €{formatCurrency(r.valor)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="p-6 text-center text-gray-500 italic"
                  >
                    Nenhum registro encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {registros.length > 0 ? (
            registros.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    {new Date(r.data).toLocaleString("pt-PT", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-green-400 font-semibold">
                    €{formatCurrency(r.valor)}
                  </span>
                </div>
                <p className="text-white font-semibold">
                  {r.services?.name || "Serviço"}
                </p>
                <p className="text-sm text-gray-400">
                  {r.descricao || "Sem descrição"}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-700 p-6 text-center text-gray-400">
              Nenhum registro encontrado
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
