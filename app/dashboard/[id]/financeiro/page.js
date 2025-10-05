"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function FinanceiroPage() {
  const [barberId, setBarberId] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [total, setTotal] = useState(0);

  const [filtro, setFiltro] = useState("mes"); // "mes" | "dia"
  const [dataFiltro, setDataFiltro] = useState("");

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

  useEffect(() => {
    if (barberId) {
      fetchFinanceiro();
    }
  }, [barberId, filtro, dataFiltro]);

  async function fetchFinanceiro() {
    let query = supabase
      .from("appointments")
      .select(
        `
        id,
        starts_at,
        services (name, price)
      `
      )
      .eq("barber_id", barberId)
      .eq("status", "concluido");

    // aplicar filtros
    if (filtro === "mes" && dataFiltro) {
      const inicio = new Date(dataFiltro + "-01T00:00:00");
      const fim = new Date(inicio);
      fim.setMonth(fim.getMonth() + 1);
      query = query.gte("starts_at", inicio.toISOString()).lt("starts_at", fim.toISOString());
    } else if (filtro === "dia" && dataFiltro) {
      const inicio = new Date(dataFiltro + "T00:00:00");
      const fim = new Date(dataFiltro + "T23:59:59");
      query = query.gte("starts_at", inicio.toISOString()).lte("starts_at", fim.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Erro ao buscar financeiro:", error);
      setAgendamentos([]);
      setTotal(0);
    } else {
      setAgendamentos(data || []);
      const soma = (data || []).reduce((acc, a) => acc + (a.services?.price || 0), 0);
      setTotal(soma);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">Financeiro</h1>

      {/* Filtros */}
      <div className="flex items-center gap-4 mb-6">
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

      {/* Resumo */}
      <div className="bg-gray-800 p-4 rounded-lg shadow mb-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-2">Resumo</h2>
        <p className="text-lg text-green-400 font-bold">Total: €{total}</p>
        <p className="text-sm text-gray-400">Agendamentos concluídos: {agendamentos.length}</p>
      </div>

      {/* Lista */}
      <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-700 text-left">
            <th className="p-2">Data</th>
            <th className="p-2">Serviço</th>
            <th className="p-2">Preço</th>
          </tr>
        </thead>
        <tbody>
          {agendamentos.length > 0 ? (
            agendamentos.map((a) => (
              <tr key={a.id} className="border-b border-gray-600">
                <td className="p-2">{new Date(a.starts_at).toLocaleString("pt-PT")}</td>
                <td className="p-2">{a.services?.name}</td>
                <td className="p-2">€{a.services?.price}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="p-4 text-center text-gray-400">
                Nenhum registro encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
