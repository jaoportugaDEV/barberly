"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

export default function AgendaBarbeiroPage() {
  const [barbeiro, setBarbeiro] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [novoAgendamento, setNovoAgendamento] = useState({
    client_name: "",
    service_id: "",
    data: "",
    horario: "",
  });

  // 🧩 Carrega barbeiro logado
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setBarbeiro(data.user);
    };
    getUser();
  }, []);

  // 🔹 Carrega serviços e agendamentos do barbeiro
  useEffect(() => {
    if (!barbeiro) return;
    carregarServicosEAgendamentos();
  }, [barbeiro]);

  async function carregarServicosEAgendamentos() {
    try {
      // Buscar barbearia do barbeiro
      const { data: perfil } = await supabase
        .from("profiles")
        .select("barbearia_id")
        .eq("id", barbeiro.id)
        .single();

      const barbeariaId = perfil?.barbearia_id;

      // Buscar serviços dessa barbearia
      const { data: servicosData } = await supabase
        .from("services")
        .select("*")
        .eq("barbearia_id", barbeariaId);

      setServicos(servicosData || []);

      // Buscar agendamentos desse barbeiro
      const { data: agData } = await supabase
        .from("appointments")
        .select(`
          id,
          client_name,
          starts_at,
          status,
          service_id,
          services(name, duration_minutes)
        `)
        .eq("user_id", barbeiro.id)
        .order("starts_at", { ascending: true });

      setAgendamentos(agData || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  }

  // 🔧 Gera horários e marca ocupados corretamente
  function gerarHorariosDisponiveis() {
    if (!novoAgendamento.data) return { horarios: [], ocupados: [] };

    const dataSelecionada = novoAgendamento.data;
    const agsDoDia = agendamentos.filter(
      (a) => a.starts_at.split("T")[0] === dataSelecionada
    );

    const horarios = [];
    let hora = dayjs(`${dataSelecionada}T09:00`);
    const fimDia = dayjs(`${dataSelecionada}T21:00`);

    while (hora.isBefore(fimDia)) {
      horarios.push(hora.format("HH:mm"));
      hora = hora.add(15, "minute");
    }

    // Bloquear horários conforme a duração
    const ocupados = new Set();

    agsDoDia.forEach((ag) => {
      const inicio = dayjs(ag.starts_at);
      const duracao = ag.services?.duration_minutes || 30;
      const slots = Math.ceil(duracao / 15);

      for (let i = 0; i <= slots; i++) {
        const slotHora = inicio.add(i * 15, "minute").format("HH:mm");
        ocupados.add(slotHora);
      }
    });

    return { horarios, ocupados: Array.from(ocupados) };
  }

  const { horarios, ocupados } = gerarHorariosDisponiveis();

  // 💾 Criar agendamento manual
  async function handleSalvarAgendamento() {
    try {
      if (
        !novoAgendamento.client_name ||
        !novoAgendamento.service_id ||
        !novoAgendamento.data ||
        !novoAgendamento.horario
      ) {
        alert("⚠️ Preencha todos os campos!");
        return;
      }

      const servicoSelecionado = servicos.find(
        (s) => s.id === novoAgendamento.service_id
      );
      const duracao = servicoSelecionado?.duration_minutes || 30;

      const starts_at = new Date(
        `${novoAgendamento.data}T${novoAgendamento.horario}:00`
      ).toISOString();

      const agendamento = {
        client_name: novoAgendamento.client_name,
        barbearia_id: servicoSelecionado.barbearia_id,
        user_id: barbeiro.id,
        service_id: servicoSelecionado.id,
        starts_at,
        status: "scheduled",
      };

      const { error } = await supabase.from("appointments").insert([agendamento]);
      if (error) throw error;

      alert("✅ Agendamento criado com sucesso!");
      setModalOpen(false);
      setNovoAgendamento({
        client_name: "",
        service_id: "",
        data: "",
        horario: "",
      });

      await carregarServicosEAgendamentos();
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao criar agendamento!");
    }
  }

  async function handleExcluirAgendamento(id) {
    if (confirm("Deseja excluir este agendamento?")) {
      await supabase.from("appointments").delete().eq("id", id);
      await carregarServicosEAgendamentos();
    }
  }

  async function handleConcluirAgendamento(id) {
    await supabase.from("appointments").update({ status: "concluido" }).eq("id", id);
    await carregarServicosEAgendamentos();
  }

  // 🔹 Próximos 5 dias
  const diasDaSemana = Array.from({ length: 5 }, (_, i) => {
    const dia = dayjs().locale("pt-br").add(i, "day");
    return {
      label: dia.format("dddd, DD/MM"),
      valor: dia.format("YYYY-MM-DD"),
    };
  });

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <h1 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
        Minha Agenda
      </h1>

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-5 py-2 rounded-xl font-semibold text-black shadow-lg hover:scale-105 transition"
        >
          + Novo Agendamento
        </button>
      </div>

      {/* LISTAGEM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {diasDaSemana.map((dia) => {
          const ags = agendamentos.filter(
            (a) => a.starts_at.split("T")[0] === dia.valor
          );
          return (
            <div
              key={dia.valor}
              className="bg-gray-800/40 backdrop-blur-md p-4 rounded-xl border border-gray-700/50 shadow-lg"
            >
              <h2 className="text-yellow-400 font-bold mb-3 capitalize">
                {dia.label}
              </h2>
              {ags.length > 0 ? (
                ags.map((a) => (
                  <div
                    key={a.id}
                    className="bg-gray-900/50 p-3 rounded-lg mb-3 border border-gray-700/50 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-yellow-300">
                        {a.client_name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {a.services?.name} — {dayjs(a.starts_at).format("HH:mm")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConcluirAgendamento(a.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-lg text-xs"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleExcluirAgendamento(a.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg text-xs"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Sem agendamentos</p>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-xl w-[420px] border border-gray-700">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">
              Novo Agendamento
            </h2>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nome do Cliente"
                value={novoAgendamento.client_name}
                onChange={(e) =>
                  setNovoAgendamento({
                    ...novoAgendamento,
                    client_name: e.target.value,
                  })
                }
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
              />

              <select
                value={novoAgendamento.service_id}
                onChange={(e) =>
                  setNovoAgendamento({
                    ...novoAgendamento,
                    service_id: e.target.value,
                  })
                }
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
              >
                <option value="">-- Selecione o serviço --</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes} min)
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={novoAgendamento.data}
                onChange={(e) =>
                  setNovoAgendamento({
                    ...novoAgendamento,
                    data: e.target.value,
                  })
                }
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
              />

              <select
                value={novoAgendamento.horario}
                onChange={(e) =>
                  setNovoAgendamento({
                    ...novoAgendamento,
                    horario: e.target.value,
                  })
                }
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
              >
                <option value="">-- Selecione o horário --</option>
                {horarios.map((h) => (
                  <option
                    key={h}
                    value={h}
                    disabled={ocupados.includes(h)}
                    style={{ color: ocupados.includes(h) ? "red" : "white" }}
                  >
                    {h} {ocupados.includes(h) ? "— Ocupado" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarAgendamento}
                className="px-4 py-2 bg-yellow-600 text-black font-semibold rounded-lg hover:bg-yellow-700 transition"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
