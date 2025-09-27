"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { Plus, Save, X } from "lucide-react";

export default function AgendaBarbeiro() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [barberId, setBarberId] = useState(null);
  const [barbeariaId, setBarbeariaId] = useState(null);
  const [range, setRange] = useState("today"); // "today" | "week"
  const [msg, setMsg] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [novoAgendamento, setNovoAgendamento] = useState({
    cliente_id: "",
    service_id: "",
    starts_at: "",
    status: "pendente",
  });

  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);

  // pegar barbeiro logado
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setBarberId(user.id);

        // descobrir a barbearia que ele pertence
        const { data: prof } = await supabase
          .from("profiles")
          .select("barbearia_id")
          .eq("id", user.id)
          .single();

        if (prof?.barbearia_id) {
          setBarbeariaId(prof.barbearia_id);
        }
      }
    };
    getUser();
  }, []);

  // buscar clientes e serviços da barbearia
  useEffect(() => {
    if (!barbeariaId) return;

    supabase
      .from("clientes")
      .select("id, nome")
      .then(({ data }) => setClientes(data || []));

    supabase
      .from("services")
      .select("id, name, price")
      .then(({ data }) => setServicos(data || []));
  }, [barbeariaId]);

  // buscar agendamentos do barbeiro
  useEffect(() => {
    if (!barberId) return;

    fetchAgendamentos();
  }, [barberId, range]);

  async function fetchAgendamentos() {
    let query = supabase
      .from("appointments")
      .select(
        `
        id,
        starts_at,
        status,
        clientes (nome),
        services (name, price),
        barbearias (nome)
      `
      )
      .eq("barber_id", barberId)
      .order("starts_at", { ascending: true });

    // filtro hoje ou semana
    const now = new Date();
    let start, end;
    if (range === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    }

    query = query.gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString());

    const { data, error } = await query;
    if (error) {
      console.error("❌ Erro ao buscar agendamentos:", error);
      setAgendamentos([]);
    } else {
      setAgendamentos(data || []);
    }
  }

  // salvar novo agendamento
  async function salvarAgendamento(e) {
    e.preventDefault();

    if (!novoAgendamento.cliente_id || !novoAgendamento.service_id || !novoAgendamento.starts_at) {
      setMsg("❌ Preencha todos os campos.");
      return;
    }

    const { error } = await supabase.from("appointments").insert([
      {
        user_id: novoAgendamento.cliente_id,
        service_id: novoAgendamento.service_id,
        barber_id: barberId,
        barbearia_id: barbeariaId,
        starts_at: novoAgendamento.starts_at,
        status: novoAgendamento.status,
      },
    ]);

    if (error) {
      console.error("❌ Erro ao salvar:", error);
      setMsg("❌ Erro ao salvar agendamento.");
    } else {
      setMsg("✅ Agendamento criado!");
      setShowModal(false);
      setNovoAgendamento({ cliente_id: "", service_id: "", starts_at: "", status: "pendente" });
      fetchAgendamentos();
    }
  }

  // marcar como concluído
  async function concluirAgendamento(id) {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "concluido" })
      .eq("id", id);

    if (!error) fetchAgendamentos();
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">Minha Agenda</h1>

      {msg && (
        <p className={`mb-4 ${msg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{msg}</p>
      )}

      {/* Filtro Hoje / Semana */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        >
          <option value="today">Hoje</option>
          <option value="week">Semana</option>
        </select>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg"
        >
          <Plus size={18} /> Novo Agendamento
        </button>
      </div>

      {/* Lista de agendamentos */}
      <div className="space-y-3">
        {agendamentos.length === 0 ? (
          <p className="text-gray-400">Nenhum agendamento encontrado</p>
        ) : (
          agendamentos.map((a) => (
            <div
              key={a.id}
              className="bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center border border-gray-700"
            >
              <div>
                <p className="font-bold">{a.clientes?.nome || "Cliente"}</p>
                <p className="text-sm opacity-80">
                  {a.services?.name} (€{a.services?.price}) —{" "}
                  {new Date(a.starts_at).toLocaleString("pt-PT")}
                </p>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    a.status === "confirmado"
                      ? "bg-green-600 text-white"
                      : a.status === "pendente"
                      ? "bg-yellow-500 text-black"
                      : a.status === "cancelado"
                      ? "bg-red-600 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {a.status}
                </span>
              </div>

              {a.status !== "concluido" && (
                <button
                  onClick={() => concluirAgendamento(a.id)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
                >
                  Concluir
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal novo agendamento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Novo Agendamento</h2>
            <form onSubmit={salvarAgendamento} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Cliente</label>
                <select
                  value={novoAgendamento.cliente_id}
                  onChange={(e) => setNovoAgendamento({ ...novoAgendamento, cliente_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                >
                  <option value="">-- Selecione --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Serviço</label>
                <select
                  value={novoAgendamento.service_id}
                  onChange={(e) => setNovoAgendamento({ ...novoAgendamento, service_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                >
                  <option value="">-- Selecione --</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — €{s.price}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Data e Hora</label>
                <input
                  type="datetime-local"
                  value={novoAgendamento.starts_at}
                  onChange={(e) => setNovoAgendamento({ ...novoAgendamento, starts_at: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                />
              </div>

              <select
                value={novoAgendamento.status}
                onChange={(e) => setNovoAgendamento({ ...novoAgendamento, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              >
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="cancelado">Cancelado</option>
              </select>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  <X size={16} /> Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg"
                >
                  <Save size={16} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
