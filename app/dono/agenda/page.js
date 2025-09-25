"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function AgendaPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [barbearias, setBarbearias] = useState([]);

  // form states
  const [clienteId, setClienteId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [barbeariaId, setBarbeariaId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [status, setStatus] = useState("pendente");

  const [msg, setMsg] = useState("");

  // Buscar agendamentos com join
  const fetchAgendamentos = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        starts_at,
        status,
        clientes: user_id ( nome ),
        services: service_id ( name ),
        barbearias: barbearia_id ( nome ),
        profiles: barber_id ( name )
      `)
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("❌ Erro ao buscar agendamentos:", error);
      setAgendamentos([]);
    } else {
      setAgendamentos(data || []);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: cli } = await supabase.from("clientes").select("id, nome");
      setClientes(cli || []);

      const { data: serv } = await supabase.from("services").select("id, name");
      setServicos(serv || []);

      const { data: barbs } = await supabase
        .from("barbearias")
        .select("id, nome");
      setBarbearias(barbs || []);

      fetchAgendamentos();
    };
    fetchData();
  }, []);

  // Salvar agendamento
  const handleSave = async () => {
    setMsg("");
    if (!clienteId || !serviceId || !barbeariaId || !startsAt) {
      setMsg("❌ Preencha todos os campos.");
      return;
    }

    const { error } = await supabase.from("appointments").insert([
      {
        user_id: clienteId,
        service_id: serviceId,
        barbearia_id: barbeariaId,
        starts_at: startsAt,
        status,
        // 🔹 NÃO pede barbeiro, já vai nulo ou será setado quando for um barbeiro logado
        barber_id: null,
      },
    ]);

    if (error) {
      console.error("❌ Erro ao salvar agendamento:", error);
      setMsg("❌ Erro ao salvar agendamento.");
    } else {
      setMsg("✅ Agendamento criado com sucesso!");
      setClienteId("");
      setServiceId("");
      setBarbeariaId("");
      setStartsAt("");
      setStatus("pendente");
      fetchAgendamentos();
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">
        Agenda do Dono
      </h1>

      {msg && (
        <p
          className={`mb-4 text-sm ${
            msg.startsWith("✅") ? "text-green-400" : "text-red-400"
          }`}
        >
          {msg}
        </p>
      )}

      {/* Formulário */}
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">+ Novo Agendamento</h2>

        {/* Cliente */}
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-800 border border-gray-700 text-white"
        >
          <option value="">Selecione Cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        {/* Serviço */}
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-800 border border-gray-700 text-white"
        >
          <option value="">Selecione Serviço</option>
          {servicos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Barbearia */}
        <select
          value={barbeariaId}
          onChange={(e) => setBarbeariaId(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-800 border border-gray-700 text-white"
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
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-800 border border-gray-700 text-white"
        />

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-800 border border-gray-700 text-white"
        >
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-yellow-600 text-black rounded hover:bg-yellow-700"
        >
          Salvar Agendamento
        </button>
      </div>

      {/* Lista */}
      <table className="w-full text-left border-collapse mt-6">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="p-2">Data</th>
            <th className="p-2">Status</th>
            <th className="p-2">Cliente</th>
            <th className="p-2">Serviço</th>
            <th className="p-2">Barbearia</th>
            <th className="p-2">Barbeiro</th>
          </tr>
        </thead>
        <tbody>
          {agendamentos.length === 0 ? (
            <tr>
              <td colSpan="6" className="p-4 text-center text-gray-500">
                Nenhum agendamento encontrado
              </td>
            </tr>
          ) : (
            agendamentos.map((a) => (
              <tr key={a.id} className="border-b border-gray-700">
                <td className="p-2">
                  {new Date(a.starts_at).toLocaleString("pt-PT")}
                </td>
                <td className="p-2">{a.status}</td>
                <td className="p-2">{a.clientes?.nome || "-"}</td>
                <td className="p-2">{a.services?.name || "-"}</td>
                <td className="p-2">{a.barbearias?.nome || "-"}</td>
                <td className="p-2">{a.profiles?.name || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
