"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

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

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <h1 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
        Financeiro 💶
      </h1>

      {/* 🔸 Filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <select
          value={filtro}
          onChange={(e) => {
            setFiltro(e.target.value);
            setDataFiltro("");
          }}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        >
          <option value="mes">Por Mês</option>
          <option value="dia">Por Dia</option>
        </select>

        {filtro === "mes" && (
          <input
            type="month"
            value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
        )}

        {filtro === "dia" && (
          <input
            type="date"
            value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
        )}
      </div>

      {/* 🔹 Resumo geral */}
      <div className="bg-gray-800/70 p-5 rounded-2xl shadow-lg border border-yellow-600/30 mb-8 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-yellow-400 mb-2">
          Resumo Financeiro
        </h2>
        <p className="text-3xl font-bold text-green-400">
          Total: €{total.toFixed(2)}
        </p>
        <p className="text-gray-400 mt-1">
          Registros encontrados: {registros.length}
        </p>
      </div>

      {/* 🔸 Tabela de ganhos */}
      <div className="overflow-x-auto">
        <table className="w-full bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden">
          <thead>
            <tr className="bg-gray-800 text-yellow-400 text-left">
              <th className="p-3">Data</th>
              <th className="p-3">Serviço</th>
              <th className="p-3">Descrição</th>
              <th className="p-3 text-right">Valor (€)</th>
            </tr>
          </thead>
          <tbody>
            {registros.length > 0 ? (
              registros.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-700 hover:bg-gray-800/50 transition"
                >
                  <td className="p-3 text-gray-300">
                    {new Date(r.data).toLocaleString("pt-PT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-3 text-gray-200">
                    {r.services?.name || "Serviço"}
                  </td>
                  <td className="p-3 text-gray-400">
                    {r.descricao || "-"}
                  </td>
                  <td className="p-3 text-right text-green-400 font-semibold">
                    €{r.valor?.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="p-6 text-center text-gray-500 italic"
                >
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
