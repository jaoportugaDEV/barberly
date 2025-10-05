"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

export default function AgendaDonoPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [barbearias, setBarbearias] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [novoAgendamento, setNovoAgendamento] = useState({
    client_name: "",
    barbearia_id: "",
    barbeiro_id: "",
    service_id: "",
    data: "",
    horario: "",
  });

  // 🔹 Carrega as barbearias e colaboradores do dono logado
  useEffect(() => {
    const carregarTudo = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const donoId = auth?.user?.id;
      if (!donoId) return;

      // Busca barbearias do dono
      const { data: barbData } = await supabase
        .from("barbearias")
        .select("*")
        .eq("dono_id", donoId);

      setBarbearias(barbData || []);

      // Busca barbeiros das barbearias do dono
      const barbeariaIds = barbData?.map((b) => b.id) || [];
      if (barbeariaIds.length > 0) {
        const { data: barbs } = await supabase
          .from("profiles")
          .select("id, name, role, barbearia_id")
          .in("barbearia_id", barbeariaIds);
        setBarbeiros(barbs || []);
      }

      // Busca serviços
      const { data: servicosData } = await supabase.from("services").select("*");
      setServicos(servicosData || []);

      // Carrega agendamentos filtrados
      await carregarAgendamentosFiltrados(donoId);
    };

    carregarTudo();
  }, []);

  // 🔄 Carregar agendamentos SOMENTE das barbearias do dono
  async function carregarAgendamentosFiltrados(donoId) {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          client_name,
          starts_at,
          status,
          barbearia_id,
          service_id,
          services(name),
          barbearias!inner(id, nome, dono_id)
        `
        )
        .eq("barbearias.dono_id", donoId)
        .order("starts_at", { ascending: true });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err);
    }
  }

  // 💾 Criar agendamento manual
  async function handleSalvarAgendamento() {
    try {
      if (
        !novoAgendamento.client_name ||
        !novoAgendamento.barbearia_id ||
        !novoAgendamento.barbeiro_id ||
        !novoAgendamento.service_id ||
        !novoAgendamento.data ||
        !novoAgendamento.horario
      ) {
        alert("⚠️ Preencha todos os campos antes de salvar!");
        return;
      }

      const starts_at = new Date(
        `${novoAgendamento.data}T${novoAgendamento.horario}:00`
      ).toISOString();

      const agendamento = {
        client_name: novoAgendamento.client_name,
        barbearia_id: novoAgendamento.barbearia_id,
        user_id: novoAgendamento.barbeiro_id,
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
        barbearia_id: "",
        barbeiro_id: "",
        service_id: "",
        data: "",
        horario: "",
      });
      const { data: auth } = await supabase.auth.getUser();
      await carregarAgendamentosFiltrados(auth?.user?.id);
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao criar agendamento: " + err.message);
    }
  }

  // 🗑️ Deletar agendamento
  async function handleExcluirAgendamento(id) {
    if (confirm("Deseja realmente excluir este agendamento?")) {
      await supabase.from("appointments").delete().eq("id", id);
      const { data: auth } = await supabase.auth.getUser();
      await carregarAgendamentosFiltrados(auth?.user?.id);
    }
  }

  // ✅ Concluir agendamento
  async function handleConcluirAgendamento(id) {
    await supabase.from("appointments").update({ status: "concluido" }).eq("id", id);
    const { data: auth } = await supabase.auth.getUser();
    await carregarAgendamentosFiltrados(auth?.user?.id);
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
        Agenda do Dono
      </h1>

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-5 py-2 rounded-xl font-semibold text-black shadow-lg hover:scale-105 transition"
        >
          + Novo Agendamento
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

      {/* 🔸 Modal Novo Agendamento */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-xl w-[420px] border border-gray-700">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">
              Novo Agendamento (manual)
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
                value={novoAgendamento.barbearia_id}
                onChange={(e) =>
                  setNovoAgendamento({
                    ...novoAgendamento,
                    barbearia_id: e.target.value,
                  })
                }
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
              >
                <option value="">-- Selecione a barbearia --</option>
                {barbearias.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>

              <select
                value={novoAgendamento.barbeiro_id}
                onChange={(e) =>
                  setNovoAgendamento({
                    ...novoAgendamento,
                    barbeiro_id: e.target.value,
                  })
                }
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
              >
                <option value="">-- Selecione o colaborador --</option>
                {barbeiros.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.role})
                  </option>
                ))}
              </select>

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

              <input
                type="time"
                value={novoAgendamento.horario}
                onChange={(e) =>
                  setNovoAgendamento({
                    ...novoAgendamento,
                    horario: e.target.value,
                  })
                }
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
              />
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
