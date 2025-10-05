"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

export default function DashboardBarbeiro() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [novoAgendamento, setNovoAgendamento] = useState({
    client_name: "",
    service_id: "",
    data: "",
    horario: "",
  });

  // 🔹 Carrega dados do barbeiro (barbearia, serviços e agendamentos)
  useEffect(() => {
    const carregarDados = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;

      // Perfil do barbeiro
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, barbearia_id, role")
        .eq("id", userId)
        .single();

      if (!profile?.barbearia_id) {
        console.warn("⚠️ Este barbeiro não tem barbearia atribuída!");
        return;
      }

      setBarbearia(profile.barbearia_id);

      // Serviços disponíveis
      const { data: servicosData } = await supabase
        .from("services")
        .select("*")
        .eq("barbearia_id", profile.barbearia_id);

      setServicos(servicosData || []);

      await carregarAgendamentos(profile.id);
    };

    carregarDados();
  }, []);

  // 🔄 Carrega agendamentos do barbeiro logado
  async function carregarAgendamentos(barbeiroId) {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          client_name,
          starts_at,
          status,
          service_id,
          services(name, duration_minutes)
        `
        )
        .eq("user_id", barbeiroId)
        .order("starts_at", { ascending: true });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err);
    }
  }

  // 🔧 Gera horários disponíveis
  useEffect(() => {
    const gerarHorarios = async () => {
      if (!novoAgendamento.data) return;

      const { data: auth } = await supabase.auth.getUser();
      const barbeiroId = auth?.user?.id;
      if (!barbeiroId) return;

      const inicio = dayjs("2000-01-01T09:00");
      const fim = dayjs("2000-01-01T21:00");
      const interval = 15; // 15 min

      const horariosGerados = [];
      let atual = inicio;

      while (atual.isBefore(fim)) {
        horariosGerados.push(atual.format("HH:mm"));
        atual = atual.add(interval, "minute");
      }

      // Buscar agendamentos desse barbeiro nesse dia
      const { data: ags } = await supabase
        .from("appointments")
        .select(
          `
          starts_at,
          services(duration_minutes)
        `
        )
        .eq("user_id", barbeiroId)
        .gte("starts_at", `${novoAgendamento.data}T00:00:00`)
        .lte("starts_at", `${novoAgendamento.data}T23:59:59`);

      // Gera lista de horários ocupados (cada serviço ocupa blocos de 15min)
      const ocupados = new Set();

      (ags || []).forEach((a) => {
        const inicio = dayjs(a.starts_at);
        const duracao = a.services?.duration_minutes || 30;
        const blocos = Math.ceil(duracao / 15);

        for (let i = 0; i < blocos; i++) {
          ocupados.add(inicio.add(i * 15, "minute").format("HH:mm"));
        }
      });

      const disponiveis = horariosGerados.map((h) => ({
        hora: h,
        ocupado: ocupados.has(h),
      }));

      setHorarios(disponiveis);
    };

    gerarHorarios();
  }, [novoAgendamento.data]);

  // 💾 Criar agendamento manual
  async function handleSalvarAgendamento() {
    try {
      if (
        !novoAgendamento.client_name ||
        !novoAgendamento.service_id ||
        !novoAgendamento.data ||
        !novoAgendamento.horario
      ) {
        alert("⚠️ Preencha todos os campos antes de salvar!");
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      const barbeiroId = auth?.user?.id;
      if (!barbeiroId) return;

      const starts_at = new Date(
        `${novoAgendamento.data}T${novoAgendamento.horario}:00`
      ).toISOString();

      const agendamento = {
        client_name: novoAgendamento.client_name,
        barbearia_id: barbearia,
        user_id: barbeiroId,
        service_id: novoAgendamento.service_id,
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
      await carregarAgendamentos(barbeiroId);
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao criar agendamento: " + err.message);
    }
  }

  // 🗑️ Cancelar agendamento
  async function handleCancelarAgendamento(id) {
    if (confirm("Cancelar este agendamento?")) {
      await supabase.from("appointments").delete().eq("id", id);
      const { data: auth } = await supabase.auth.getUser();
      await carregarAgendamentos(auth?.user?.id);
    }
  }

  // ✅ Concluir agendamento
  async function handleConcluirAgendamento(id) {
    await supabase.from("appointments").update({ status: "concluido" }).eq("id", id);
    const { data: auth } = await supabase.auth.getUser();
    await carregarAgendamentos(auth?.user?.id);
  }

  // 🔧 Agrupar por dias da semana
  const diasDaSemana = [];
  for (let i = 0; i < 5; i++) {
    const dia = dayjs().locale("pt-br").add(i, "day");
    diasDaSemana.push({
      label: dia.format("dddd, DD/MM"),
      valor: dia.format("YYYY-MM-DD"),
    });
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <h1 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
        Dashboard do Barbeiro
      </h1>

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-5 py-2 rounded-xl font-semibold text-black shadow-lg hover:scale-105 transition"
        >
          + Novo Agendamento Manual
        </button>
      </div>

      {/* 🔹 Grade de dias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {diasDaSemana.map((dia) => {
          const ags = agendamentos.filter(
            (a) => a.starts_at.split("T")[0] === dia.valor
          );
          return (
            <div
              key={dia.valor}
              className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 shadow-lg"
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
                      <p className="font-semibold text-yellow-300">{a.client_name}</p>
                      <p className="text-sm text-gray-400">
                        {a.services?.name || "Serviço"} —{" "}
                        {dayjs(a.starts_at).format("HH:mm")}
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
                        onClick={() => handleCancelarAgendamento(a.id)}
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

      {/* 🔸 Modal Novo Agendamento */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-xl w-[420px] border border-gray-700">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">
              Novo Agendamento (Manual)
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
                    {s.name}
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
                    key={h.hora}
                    value={h.hora}
                    disabled={h.ocupado}
                    className={h.ocupado ? "text-red-400" : ""}
                  >
                    {h.hora} {h.ocupado ? "— Ocupado" : ""}
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
