"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function AgendaPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [rawAppts, setRawAppts] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [barbearias, setBarbearias] = useState([]);

  const [novoAgendamento, setNovoAgendamento] = useState({
    cliente_id: "",
    service_id: "",
    barbearia_id: "",
    starts_at: "",
    status: "pendente",
  });

  const [msg, setMsg] = useState("");
  const [donoId, setDonoId] = useState(null);

  // pega dono
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) setDonoId(auth.user.id);
    })();
  }, []);

  // carrega bases
  useEffect(() => {
    if (!donoId) return;
    fetchClientes();
    fetchServicos();
    fetchBarbearias();
  }, [donoId]);

  // busca agendamentos crus
  useEffect(() => {
    if (clientes.length === 0) {
      setRawAppts([]);
      return;
    }
    fetchAgendamentos(clientes.map((c) => c.id));
  }, [clientes]);

  // enriquece
  useEffect(() => {
    const cMap = new Map(clientes.map((c) => [c.id, c]));
    const sMap = new Map(servicos.map((s) => [s.id, s]));
    const bMap = new Map(barbearias.map((b) => [b.id, b]));

    setAgendamentos(
      rawAppts.map((a) => ({
        ...a,
        cliente_nome: cMap.get(a.user_id)?.nome ?? "—",
        service_nome: sMap.get(a.service_id)?.name ?? "—",
        service_price: sMap.get(a.service_id)?.price ?? 0,
        barbearia_nome: bMap.get(a.barbearia_id)?.nome ?? "—",
      }))
    );
  }, [rawAppts, clientes, servicos, barbearias]);

  // ---- FETCH ----
  async function fetchAgendamentos(ids) {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, starts_at, status, user_id, service_id, barbearia_id")
      .in("user_id", ids)
      .not("status", "eq", "concluido")
      .order("starts_at", { ascending: true });
    if (!error) setRawAppts(data || []);
  }

  async function fetchClientes() {
    const { data } = await supabase
      .from("clientes")
      .select("id, nome, email, user_id")
      .eq("user_id", donoId);
    setClientes(data || []);
  }

  async function fetchServicos() {
    const { data } = await supabase.from("services").select("id, name, price");
    setServicos(data || []);
  }

  async function fetchBarbearias() {
    const { data } = await supabase.from("barbearias").select("id, nome");
    setBarbearias(data || []);
  }

  // ---- AÇÕES ----
  async function handleSave() {
    if (
      !novoAgendamento.cliente_id ||
      !novoAgendamento.service_id ||
      !novoAgendamento.barbearia_id ||
      !novoAgendamento.starts_at
    ) {
      setMsg("❌ Preencha todos os campos!");
      return;
    }

    const { error } = await supabase.from("appointments").insert([
      {
        user_id: novoAgendamento.cliente_id,
        service_id: novoAgendamento.service_id,
        barbearia_id: novoAgendamento.barbearia_id,
        starts_at: novoAgendamento.starts_at,
        status: novoAgendamento.status,
      },
    ]);

    if (error) setMsg("❌ Erro ao salvar agendamento.");
    else {
      setMsg("✅ Agendamento criado com sucesso!");
      setNovoAgendamento({
        cliente_id: "",
        service_id: "",
        barbearia_id: "",
        starts_at: "",
        status: "pendente",
      });
      fetchAgendamentos(clientes.map((c) => c.id));
    }
  }

  async function marcarComoConcluido(id) {
    await supabase.from("appointments").update({ status: "concluido" }).eq("id", id);
    fetchAgendamentos(clientes.map((c) => c.id));
  }

  // ---- UI ----
  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <h1 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
        Agenda do Dono
      </h1>

      {msg && (
        <div
          className={`mb-6 px-4 py-2 rounded-lg text-sm font-medium shadow-md ${
            msg.startsWith("✅")
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {msg}
        </div>
      )}

      {/* Form */}
      <div className="backdrop-blur-md bg-gray-800/40 p-6 rounded-2xl shadow-lg mb-10 border border-gray-700/50">
        <h2 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
          <span className="text-yellow-400">➕</span> Novo Agendamento
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <select
            value={novoAgendamento.cliente_id}
            onChange={(e) =>
              setNovoAgendamento({ ...novoAgendamento, cliente_id: e.target.value })
            }
            className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-yellow-500 outline-none"
          >
            <option value="">Selecione Cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.email || "sem email"})
              </option>
            ))}
          </select>

          <select
            value={novoAgendamento.service_id}
            onChange={(e) =>
              setNovoAgendamento({ ...novoAgendamento, service_id: e.target.value })
            }
            className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-yellow-500 outline-none"
          >
            <option value="">Selecione Serviço</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — €{s.price}
              </option>
            ))}
          </select>

          <select
            value={novoAgendamento.barbearia_id}
            onChange={(e) =>
              setNovoAgendamento({ ...novoAgendamento, barbearia_id: e.target.value })
            }
            className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-yellow-500 outline-none"
          >
            <option value="">Selecione Barbearia</option>
            {barbearias.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={novoAgendamento.starts_at}
            onChange={(e) =>
              setNovoAgendamento({ ...novoAgendamento, starts_at: e.target.value })
            }
            className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-yellow-500 outline-none"
          />

          <select
            value={novoAgendamento.status}
            onChange={(e) => setNovoAgendamento({ ...novoAgendamento, status: e.target.value })}
            className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-yellow-500 outline-none"
          >
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className="mt-6 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition"
        >
          💾 Salvar Agendamento
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl shadow-lg border border-gray-700/50">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-700 to-gray-800 text-yellow-400">
            <tr>
              <th className="p-3 text-left">Data</th>
              <th className="p-3">Status</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Serviço</th>
              <th className="p-3">Barbearia</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {agendamentos.length > 0 ? (
              agendamentos.map((a) => (
                <tr key={a.id} className="hover:bg-gray-700/40 transition duration-200">
                  <td className="p-3">{new Date(a.starts_at).toLocaleString("pt-PT")}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        a.status === "confirmado"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : a.status === "cancelado"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3">{a.cliente_nome}</td>
                  <td className="p-3">
                    {a.service_nome} {a.service_price ? `(€${a.service_price})` : ""}
                  </td>
                  <td className="p-3">{a.barbearia_nome}</td>
                  <td className="p-3">
                    {a.status !== "concluido" && (
                      <button
                        onClick={() => marcarComoConcluido(a.id)}
                        className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-white shadow-md transition"
                      >
                        ✅ Concluir
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-400">
                  Nenhum agendamento encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
