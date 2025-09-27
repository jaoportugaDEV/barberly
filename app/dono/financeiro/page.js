"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function FinanceiroPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [total, setTotal] = useState(0);

  // filtros
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [dataEspecifica, setDataEspecifica] = useState("");

  // toggle de visão
  const [visaoGeral, setVisaoGeral] = useState(false);

  // 🔹 dono logado (depois podemos puxar do auth.user() do supabase)
  const donoId = "790a4a09-84af-4492-bf36-a549d53ad123"; // exemplo, trocar pelo real

  useEffect(() => {
    fetchFinanceiro();
  }, [mes, ano, dataEspecifica, visaoGeral]);

  async function fetchFinanceiro() {
    let query = supabase
      .from("appointments")
      .select(
        `
        id,
        starts_at,
        status,
        clientes (nome),
        services (name, price),
        barbearias (id, nome, dono_id)
      `
      )
      .eq("status", "concluido");

    // 🔹 Se NÃO for visão geral → filtra apenas barbearias do dono
    if (!visaoGeral) {
      query = query.eq("barbearias.dono_id", donoId);
    }

    // 🔹 Filtro por data específica
    if (dataEspecifica) {
      const inicio = new Date(dataEspecifica);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(dataEspecifica);
      fim.setHours(23, 59, 59, 999);

      query = query
        .gte("starts_at", inicio.toISOString())
        .lte("starts_at", fim.toISOString());
    }
    // 🔹 Filtro por mês/ano
    else if (mes && ano) {
      const inicio = new Date(ano, mes - 1, 1, 0, 0, 0);
      const fim = new Date(ano, mes, 0, 23, 59, 59);
      query = query
        .gte("starts_at", inicio.toISOString())
        .lte("starts_at", fim.toISOString());
    }

    query = query.order("starts_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("❌ Erro ao buscar financeiro:", error);
      setAgendamentos([]);
      setTotal(0);
    } else {
      setAgendamentos(data || []);
      const soma = (data || []).reduce(
        (acc, a) => acc + (a.services?.price || 0),
        0
      );
      setTotal(soma);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-yellow-500">Financeiro</h1>

      {/* Switch de visão */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-gray-300">
          {visaoGeral ? "Todas as Barbearias" : "Meu Financeiro"}
        </span>
        <button
          onClick={() => setVisaoGeral(!visaoGeral)}
          className={`w-14 h-7 flex items-center rounded-full p-1 transition ${
            visaoGeral ? "bg-green-500" : "bg-gray-500"
          }`}
        >
          <div
            className={`bg-white w-5 h-5 rounded-full shadow-md transform transition ${
              visaoGeral ? "translate-x-7" : ""
            }`}
          ></div>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4">
        {/* Mês */}
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="p-2 rounded bg-gray-700 text-white"
        >
          <option value="">Todos os meses</option>
          <option value="1">Janeiro</option>
          <option value="2">Fevereiro</option>
          <option value="3">Março</option>
          <option value="4">Abril</option>
          <option value="5">Maio</option>
          <option value="6">Junho</option>
          <option value="7">Julho</option>
          <option value="8">Agosto</option>
          <option value="9">Setembro</option>
          <option value="10">Outubro</option>
          <option value="11">Novembro</option>
          <option value="12">Dezembro</option>
        </select>

        {/* Ano */}
        <input
          type="number"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          placeholder="Ano (ex: 2025)"
          className="p-2 rounded bg-gray-700 text-white"
        />

        {/* Data específica */}
        <input
          type="date"
          value={dataEspecifica}
          onChange={(e) => setDataEspecifica(e.target.value)}
          className="p-2 rounded bg-gray-700 text-white"
        />

        {/* Limpar filtros */}
        <button
          onClick={() => {
            setMes("");
            setAno("");
            setDataEspecifica("");
          }}
          className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white"
        >
          Limpar
        </button>
      </div>

      {/* Total */}
      <div className="bg-gray-800 p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold text-white">
          Total Recebido:{" "}
          <span className="text-green-400">€{total.toFixed(2)}</span>
        </h2>
      </div>

      {/* Tabela */}
      <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-700 text-left">
            <th className="p-2">Data</th>
            <th className="p-2">Cliente</th>
            <th className="p-2">Serviço</th>
            <th className="p-2">Valor</th>
            <th className="p-2">Barbearia</th>
          </tr>
        </thead>
        <tbody>
          {agendamentos.length > 0 ? (
            agendamentos.map((a) => (
              <tr key={a.id} className="border-b border-gray-600">
                <td className="p-2">
                  {new Date(a.starts_at).toLocaleString("pt-PT")}
                </td>
                <td className="p-2">{a.clientes?.nome || "—"}</td>
                <td className="p-2">{a.services?.name || "—"}</td>
                <td className="p-2 text-green-400 font-semibold">
                  €{a.services?.price?.toFixed(2) || "0.00"}
                </td>
                <td className="p-2">{a.barbearias?.nome || "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-400">
                Nenhum serviço concluído encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
