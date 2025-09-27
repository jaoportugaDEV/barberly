"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import supabase from "../../lib/supabaseClient";

const statusColors = {
  confirmado: "bg-green-600",
  pendente: "bg-yellow-600",
  cancelado: "bg-red-600",
  concluido: "bg-blue-600",
};

export default function DashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [clienteId, setClienteId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [status, setStatus] = useState("pendente");

  const [barberId, setBarberId] = useState(null);
  const [barbeariaId, setBarbeariaId] = useState(null);

  const [range, setRange] = useState("today"); // "today" | "week"

  // pegar barbeiro logado
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setBarberId(user.id);

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

  // buscar agendamentos, clientes e serviços
  useEffect(() => {
    const fetchData = async () => {
      if (!barberId) return;

      // agendamentos do barbeiro logado
      let query = supabase
        .from("appointments")
        .select("id, starts_at, status, user_id, service_id")
        .eq("barber_id", barberId)
        .order("starts_at", { ascending: true });

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
      query = query
        .gte("starts_at", start.toISOString())
        .lt("starts_at", end.toISOString());

      const { data: appts } = await query;

      // clientes criados por ESTE barbeiro
      const { data: cli } = await supabase
        .from("clientes")
        .select("id, nome, telefone, email")
        .eq("barber_id", barberId);

      const { data: servs } = await supabase.from("services").select("id, name");

      setAppointments(appts || []);
      setClientes(cli || []);
      setServices(servs || []);
    };

    fetchData();
  }, [barberId, range]);

  const novoAgendamento = () => {
    setEditingId(null);
    setClienteId("");
    setServiceId("");
    setStartsAt("");
    setStatus("pendente");
    setShowModal(true);
  };

  const salvarAgendamento = async (e) => {
    e.preventDefault();
    if (!clienteId || !serviceId || !startsAt || !barberId || !barbeariaId) return;

    const payload = {
      user_id: clienteId,
      service_id: serviceId,
      starts_at: startsAt,
      status,
      barber_id: barberId,
      barbearia_id: barbeariaId,
    };

    if (editingId) {
      await supabase.from("appointments").update(payload).eq("id", editingId);
    } else {
      await supabase.from("appointments").insert(payload);
    }

    setShowModal(false);

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, starts_at, status, user_id, service_id")
      .eq("barber_id", barberId)
      .order("starts_at", { ascending: true });

    setAppointments(appts || []);
  };

  const editarAgendamento = (a) => {
    setEditingId(a.id);
    setClienteId(a.user_id);
    setServiceId(a.service_id);
    setStartsAt(a.starts_at ? a.starts_at.substring(0, 16) : "");
    setStatus(a.status);
    setShowModal(true);
  };

  const removerAgendamento = async (id) => {
    if (!confirm("Deseja remover este agendamento?")) return;
    await supabase.from("appointments").delete().eq("id", id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">Minha Agenda</h1>

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
          onClick={novoAgendamento}
          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg"
        >
          <Plus size={18} /> Novo Agendamento
        </button>
      </div>

      <div className="space-y-3">
        {appointments.map((a) => {
          const cliente = clientes.find((c) => c.id === a.user_id);
          const servico = services.find((s) => s.id === a.service_id);

          return (
            <div
              key={a.id}
              className={`p-4 rounded-lg text-white ${statusColors[a.status]} flex justify-between items-center`}
            >
              <div>
                <p className="font-bold">{cliente?.nome || "Cliente"}</p>
                <p className="text-sm opacity-80">
                  {servico?.name || "Serviço"} —{" "}
                  {new Date(a.starts_at).toLocaleString("pt-PT")}
                </p>
                <p className="text-xs italic">{a.status}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editarAgendamento(a)}
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => removerAgendamento(a.id)}
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingId ? "Editar Agendamento" : "Novo Agendamento"}
            </h2>
            <form onSubmit={salvarAgendamento} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Cliente</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                >
                  <option value="">-- Selecione --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.telefone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Serviço</label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                >
                  <option value="">-- Selecione --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Data e Hora</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                />
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              >
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="cancelado">Cancelado</option>
                <option value="concluido">Concluído</option>
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
