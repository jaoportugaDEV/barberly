"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function FinanceiroPage() {
  const [userId, setUserId] = useState(null);
  const [barbeariaIds, setBarbeariaIds] = useState([]);

  const [agendamentos, setAgendamentos] = useState([]);
  const [total, setTotal] = useState(0);

  // filtros
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [dia, setDia] = useState("");

  // toggle
  const [meuFinanceiro, setMeuFinanceiro] = useState(false);

  // mapa id->nome do barbeiro
  const [barberMap, setBarberMap] = useState({});

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
      setUserId(auth.user.id);

      const { data: barbs } = await supabase
        .from("barbearias")
        .select("id")
        .eq("dono_id", auth.user.id);

      setBarbeariaIds((barbs || []).map((b) => b.id));
    })();
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchFinanceiro();
  }, [userId, barbeariaIds, mes, ano, dia, meuFinanceiro]);

  async function fetchFinanceiro() {
    try {
      let query = supabase
        .from("appointments")
        .select(`
          id,
          starts_at,
          status,
          barber_id,
          barbearia_id,
          clientes ( nome ),
          services ( name, price )
        `)
        .eq("status", "concluido")
        .order("starts_at", { ascending: false });

      if (meuFinanceiro) {
        query = query.eq("barber_id", userId);
      } else if (barbeariaIds.length > 0) {
        query = query.in("barbearia_id", barbeariaIds);
      }

      if (dia) {
        query = query
          .gte("starts_at", `${dia}T00:00:00`)
          .lte("starts_at", `${dia}T23:59:59`);
      } else {
        if (ano) {
          query = query
            .gte("starts_at", `${ano}-01-01`)
            .lte("starts_at", `${ano}-12-31`);
        }
        if (mes) {
          query = query
            .gte("starts_at", `${ano}-${mes}-01`)
            .lt("starts_at", `${ano}-${mes}-32`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      setAgendamentos(data || []);
      setTotal(
        (data || []).reduce((acc, a) => acc + (a?.services?.price || 0), 0)
      );

      const ids = Array.from(
        new Set((data || []).map((a) => a.barber_id).filter(Boolean))
      );
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", ids);

        const map = {};
        (profs || []).forEach((p) => (map[p.id] = p.name));
        setBarberMap(map);
      } else {
        setBarberMap({});
      }
    } catch (err) {
      console.error("Erro ao buscar financeiro:", err?.message || err);
      setAgendamentos([]);
      setTotal(0);
      setBarberMap({});
    }
  }

  function limparFiltros() {
    setMes("");
    setAno(String(new Date().getFullYear()));
    setDia("");
  }

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      <h1 className="text-3xl font-extrabold text-yellow-500 mb-8 tracking-wide">
        💰 Financeiro
      </h1>

      {/* Switch + filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-white/90 font-medium">Meu Financeiro</span>
          <button
            onClick={() => setMeuFinanceiro((v) => !v)}
            className={`w-14 h-7 rounded-full p-1 flex items-center transition-all ${
              meuFinanceiro ? "bg-green-500" : "bg-gray-600"
            }`}
            type="button"
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                meuFinanceiro ? "translate-x-7" : ""
              }`}
            />
          </button>
        </label>

        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
        >
          <option value="">Todos os meses</option>
          {Array.from({ length: 12 }).map((_, i) => {
            const v = String(i + 1).padStart(2, "0");
            const label = [
              "Janeiro",
              "Fevereiro",
              "Março",
              "Abril",
              "Maio",
              "Junho",
              "Julho",
              "Agosto",
              "Setembro",
              "Outubro",
              "Novembro",
              "Dezembro",
            ][i];
            return (
              <option key={v} value={v}>
                {label}
              </option>
            );
          })}
        </select>

        <input
          type="number"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          placeholder="Ano"
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 w-28 focus:ring-2 focus:ring-yellow-500 outline-none"
        />

        <input
          type="date"
          value={dia}
          onChange={(e) => setDia(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
        />

        <button
          onClick={limparFiltros}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium shadow-lg transition"
        >
          Limpar
        </button>
      </div>

      {/* Total */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="text-xl font-semibold">
          Total Recebido:{" "}
          <span className="text-green-400 font-bold text-2xl">
            €{total.toFixed(2)}
          </span>
        </h2>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl shadow-lg border border-white/10">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-800/60 text-yellow-500 uppercase text-sm">
              <th className="p-3">Data</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Serviço</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Barbeiro</th>
            </tr>
          </thead>
          <tbody>
            {agendamentos.length ? (
              agendamentos.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-white/5 transition border-b border-gray-700/50"
                >
                  <td className="p-3">
                    {new Date(a.starts_at).toLocaleString("pt-PT")}
                  </td>
                  <td className="p-3">{a.clientes?.nome || "—"}</td>
                  <td className="p-3">{a.services?.name || "—"}</td>
                  <td className="p-3 font-semibold text-green-400">
                    €{(a.services?.price ?? 0).toFixed(2)}
                  </td>
                  <td className="p-3">{barberMap[a.barber_id] || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="p-6 text-center text-gray-400 italic"
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
