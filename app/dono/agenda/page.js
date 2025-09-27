"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function AgendaPage() {
  const [agendamentos, setAgendamentos] = useState([]);
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

  // Buscar dados iniciais
  useEffect(() => {
    fetchAgendamentos();
    fetchClientes();
    fetchServicos();
    fetchBarbearias();
  }, []);

  async function fetchAgendamentos() {
    const { data, error } = await supabase
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
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("❌ Erro ao buscar agendamentos:", error);
      setAgendamentos([]);
    } else {
      setAgendamentos(data || []);
    }
  }

  async function fetchClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nome, email");
    if (error) console.error("❌ Erro ao buscar clientes:", error);
    else setClientes(data || []);
  }

  async function fetchServicos() {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, price");
    if (error) console.error("❌ Erro ao buscar serviços:", error);
    else setServicos(data || []);
  }

  async function fetchBarbearias() {
    const { data, error } = await supabase
      .from("barbearias")
      .select("id, nome");
    if (error) console.error("❌ Erro ao buscar barbearias:", error);
    else setBarbearias(data || []);
  }

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

    if (error) {
      console.error("❌ Erro ao salvar agendamento:", error);
      setMsg("❌ Erro ao salvar agendamento.");
    } else {
      setMsg("✅ Agendamento criado com sucesso!");
      setNovoAgendamento({
        cliente_id: "",
        service_id: "",
        barbearia_id: "",
        starts_at: "",
        status: "pendente",
      });
      fetchAgendamentos();
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-yellow-500">
        Agenda do Dono
      </h1>

      {msg && (
        <p
          className={`mb-4 ${
            msg.startsWith("✅") ? "text-green-500" : "text-red-500"
          }`}
        >
          {msg}
        </p>
      )}

      {/* Formulário */}
      <div className="bg-gray-800 p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">+ Novo Agendamento</h2>

        {/* Cliente */}
        <select
          value={novoAgendamento.cliente_id}
          onChange={(e) =>
            setNovoAgendamento({ ...novoAgendamento, cliente_id: e.target.value })
          }
          className="block w-full mb-2 p-2 bg-gray-700"
        >
          <option value="">Selecione Cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} ({c.email || "sem email"})
            </option>
          ))}
        </select>

        {/* Serviço */}
        <select
          value={novoAgendamento.service_id}
          onChange={(e) =>
            setNovoAgendamento({ ...novoAgendamento, service_id: e.target.value })
          }
          className="block w-full mb-2 p-2 bg-gray-700"
        >
          <option value="">Selecione Serviço</option>
          {servicos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — €{s.price}
            </option>
          ))}
        </select>

        {/* Barbearia */}
        <select
          value={novoAgendamento.barbearia_id}
          onChange={(e) =>
            setNovoAgendamento({ ...novoAgendamento, barbearia_id: e.target.value })
          }
          className="block w-full mb-2 p-2 bg-gray-700"
        >
          <option value="">Selecione Barbearia</option>
          {barbearias.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
        </select>

        {/* Data e Hora */}
        <input
          type="datetime-local"
          value={novoAgendamento.starts_at}
          onChange={(e) =>
            setNovoAgendamento({ ...novoAgendamento, starts_at: e.target.value })
          }
          className="block w-full mb-2 p-2 bg-gray-700"
        />

        {/* Status */}
        <select
          value={novoAgendamento.status}
          onChange={(e) =>
            setNovoAgendamento({ ...novoAgendamento, status: e.target.value })
          }
          className="block w-full mb-2 p-2 bg-gray-700"
        >
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <button
          onClick={handleSave}
          className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-white"
        >
          Salvar Agendamento
        </button>
      </div>

      {/* Tabela */}
      <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-700 text-left">
            <th className="p-2">Data</th>
            <th className="p-2">Status</th>
            <th className="p-2">Cliente</th>
            <th className="p-2">Serviço</th>
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
                <td className="p-2">{a.status}</td>
                <td className="p-2">{a.clientes?.nome || "—"}</td>
                <td className="p-2">
                  {a.services?.name} (€{a.services?.price})
                </td>
                <td className="p-2">{a.barbearias?.nome || "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-400">
                Nenhum agendamento encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
