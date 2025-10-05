"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import supabase from "@/lib/supabaseClient";


export default function DashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [barbearias, setBarbearias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [clienteNome, setClienteNome] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [barbeariaId, setBarbeariaId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [horarios, setHorarios] = useState([]);
  const [ocupados, setOcupados] = useState([]);

  const [barberId, setBarberId] = useState(null);
  const [barbeariaUserId, setBarbeariaUserId] = useState(null);
  const [range, setRange] = useState("today");

  // 🔹 Buscar barbeiro logado
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

        if (prof?.barbearia_id) setBarbeariaUserId(prof.barbearia_id);
      }
    };
    getUser();
  }, []);

  // 🔹 Buscar barbearias
  useEffect(() => {
    const fetchBarbearias = async () => {
      const { data, error } = await supabase.from("barbearias").select("id, nome");
      if (error) console.error("Erro ao buscar barbearias:", error);
      setBarbearias(data || []);
    };
    fetchBarbearias();
  }, []);

  // 🔹 Buscar serviços da barbearia selecionada
  useEffect(() => {
    const fetchServicos = async () => {
      if (!barbeariaId) {
        setServices([]);
        return;
      }
      const { data, error } = await supabase
        .from("services")
        .select("id, name, duration_minutes, price")
        .eq("barbearia_id", barbeariaId);
      if (error) console.error("Erro ao buscar serviços:", error);
      setServices(data || []);
    };
    fetchServicos();
  }, [barbeariaId]);

  // 🔹 Buscar agendamentos (lista principal)
  useEffect(() => {
    const fetchData = async () => {
      if (!barberId) return;
      let query = supabase
        .from("appointments")
        .select("id, starts_at, client_name, service_id, barbearia_id")
        .eq("barber_id", barberId)
        .order("starts_at", { ascending: true });

      const now = new Date();
      let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let end = new Date(start);
      end.setDate(end.getDate() + (range === "today" ? 1 : 7));

      query = query.gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString());

      const { data: appts } = await query;
      const { data: servs } = await supabase.from("services").select("id, name");

      setAppointments(appts || []);
      setServices(servs || []);
    };
    fetchData();
  }, [barberId, range]);

  // 🔹 Gerar intervalos de 15 minutos
  function gerarHorarios(inicio = "08:00", fim = "22:00") {
    const [hIni, mIni] = inicio.split(":").map(Number);
    const [hFim, mFim] = fim.split(":").map(Number);
    const inicioMin = hIni * 60 + mIni;
    const fimMin = hFim * 60 + mFim;

    const result = [];
    for (let min = inicioMin; min <= fimMin; min += 15) {
      const h = String(Math.floor(min / 60)).padStart(2, "0");
      const m = String(min % 60).padStart(2, "0");
      result.push(`${h}:${m}`);
    }
    return result;
  }

  // 🔹 Buscar horários ocupados (com duração do serviço)
  useEffect(() => {
    const buscarOcupados = async () => {
      if (!selectedDate || !barbeariaId || !barberId) return;

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: appts } = await supabase
        .from("appointments")
        .select("starts_at, service_id")
        .eq("barber_id", barberId)
        .eq("barbearia_id", barbeariaId)
        .gte("starts_at", startOfDay.toISOString())
        .lte("starts_at", endOfDay.toISOString());

      if (!appts) return;

      const ocupadosTemp = [];
      for (const appt of appts) {
        const servico = services.find((s) => s.id === appt.service_id);
        const duracao = servico?.duration_minutes || 30;
        const inicio = new Date(appt.starts_at);
        const fim = new Date(inicio.getTime() + duracao * 60 * 1000);

        let atual = new Date(inicio);
        while (atual < fim) {
          const h = atual.getHours().toString().padStart(2, "0");
          const m = atual.getMinutes().toString().padStart(2, "0");
          ocupadosTemp.push(`${h}:${m}`);
          atual.setMinutes(atual.getMinutes() + 15);
        }
      }
      setOcupados(ocupadosTemp);
    };

    buscarOcupados();
  }, [selectedDate, barbeariaId, barberId, services.length]);

  // 🔹 Quando abre modal → gerar horários
  useEffect(() => {
    setHorarios(gerarHorarios("08:00", "22:00"));
  }, []);

  // 🔹 Novo agendamento
  const novoAgendamento = () => {
    setEditingId(null);
    setClienteNome("");
    setServiceId("");
    setBarbeariaId("");
    setSelectedDate("");
    setSelectedTime("");
    setShowModal(true);
  };

  // 🔹 Salvar agendamento
  const salvarAgendamento = async (e) => {
    e.preventDefault();
    if (!clienteNome || !serviceId || !barbeariaId || !selectedDate || !selectedTime) {
      alert("Preencha todos os campos!");
      return;
    }

    // 🔹 Corrige fuso horário (Portugal ≈ UTC+0 / evitar +1 ao salvar)
    const dataHora = new Date(`${selectedDate}T${selectedTime}:00`);
    dataHora.setHours(dataHora.getHours() - 1);

    const payload = {
      client_name: clienteNome,
      service_id: serviceId,
      barbearia_id: barbeariaId,
      barber_id: barberId,
      starts_at: dataHora.toISOString(),
    };

    if (editingId) {
      await supabase.from("appointments").update(payload).eq("id", editingId);
    } else {
      await supabase.from("appointments").insert(payload);
    }

    setShowModal(false);

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, starts_at, client_name, service_id, barbearia_id")
      .eq("barber_id", barberId)
      .order("starts_at", { ascending: true });

    setAppointments(appts || []);
  };

  // 🔹 Editar / Remover
  const editarAgendamento = (a) => {
    const localTime = new Date(a.starts_at);
    localTime.setHours(localTime.getHours() + 1);
    setEditingId(a.id);
    setClienteNome(a.client_name);
    setServiceId(a.service_id);
    setBarbeariaId(a.barbearia_id);
    setSelectedDate(localTime.toISOString().split("T")[0]);
    setSelectedTime(localTime.toISOString().split("T")[1].substring(0, 5));
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
          const servico = services.find((s) => s.id === a.service_id);
          const dataLocal = new Date(a.starts_at);
          dataLocal.setHours(dataLocal.getHours() + 1);

          return (
            <div key={a.id} className="p-4 rounded-lg text-white bg-gray-800 flex justify-between items-center">
              <div>
                <p className="font-bold">{a.client_name}</p>
                <p className="text-sm opacity-80">
                  {servico?.name || "Serviço"} — {dataLocal.toLocaleString("pt-PT", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editarAgendamento(a)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded">
                  <Pencil size={16} />
                </button>
                <button onClick={() => removerAgendamento(a.id)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded">
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
                <label className="block text-gray-300 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                  placeholder="Ex: João Silva"
                />
              </div>

              {/* Barbearia */}
              <div>
                <label className="block text-gray-300 mb-1">Barbearia *</label>
                <select
                  value={barbeariaId}
                  onChange={(e) => setBarbeariaId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                >
                  <option value="">-- Selecione a barbearia --</option>
                  {barbearias.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-gray-300 mb-1">Serviço *</label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                >
                  <option value="">Selecione uma barbearia primeiro</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data */}
              <div>
                <label className="block text-gray-300 mb-1">Data *</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                />
              </div>

              {/* Horário */}
              <div>
                <label className="block text-gray-300 mb-1">Horário *</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                >
                  <option value="">-- Selecione o horário --</option>
                  {horarios.map((hora) => (
                    <option
                      key={hora}
                      value={hora}
                      disabled={ocupados.includes(hora)}
                      className={ocupados.includes(hora) ? "text-red-400" : ""}
                    >
                      {hora} {ocupados.includes(hora) ? " (ocupado)" : ""}
                    </option>
                  ))}
                </select>
              </div>

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
