"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

export default function AgendaDonoPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [barbearias, setBarbearias] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [donoId, setDonoId] = useState(null);

  const [novoAgendamento, setNovoAgendamento] = useState({
    client_name: "",
    barbearia_id: "",
    service_id: "",
    data: "",
    horario: "",
  });

  // 🔹 Carregar dono e barbearias
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const donoId = auth?.user?.id;
      if (!donoId) return;
      setDonoId(donoId);

      const { data: barbeariasData, error } = await supabase
        .from("barbearias")
        .select("*")
        .eq("dono_id", donoId);

      if (error) console.error(error);
      else setBarbearias(barbeariasData || []);

      await carregarAgendamentos(donoId);
    };

    carregarDadosIniciais();
  }, []);

  // 🔄 Carregar agendamentos do dono
  async function carregarAgendamentos(donoId) {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        client_name,
        starts_at,
        status,
        service_id,
        barbearia_id,
        services(name, duration_minutes, price)
      `)
      .eq("user_id", donoId)
      .order("starts_at", { ascending: true });

    if (error) console.error("Erro ao carregar agendamentos:", error);
    else setAgendamentos(data || []);
  }

  // 🟢 Escutar alterações em tempo real
  useEffect(() => {
    if (!donoId) return;

    const canal = supabase
      .channel("realtime-appointments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `user_id=eq.${donoId}`,
        },
        async () => {
          await carregarAgendamentos(donoId);
          if (
            novoAgendamento.barbearia_id &&
            novoAgendamento.data &&
            novoAgendamento.service_id
          ) {
            await gerarHorarios();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [donoId, novoAgendamento]);

  // ⚡ Carregar serviços da barbearia
  useEffect(() => {
    const fetchServicos = async () => {
      if (!novoAgendamento.barbearia_id) return;
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("barbearia_id", novoAgendamento.barbearia_id);
      if (!error) setServicos(data || []);
    };
    fetchServicos();
  }, [novoAgendamento.barbearia_id]);

  // ⚡ Gerar horários disponíveis
  async function gerarHorarios() {
    const { barbearia_id, data, service_id } = novoAgendamento;
    if (!barbearia_id || !data || !service_id || !donoId) return;

    const { data: barbearia } = await supabase
      .from("barbearias")
      .select("horario_abertura, horario_fechamento, intervalo_minutos")
      .eq("id", barbearia_id)
      .single();
    if (!barbearia) return;

    const { horario_abertura, horario_fechamento, intervalo_minutos } =
      barbearia;
    const inicio = dayjs(`2000-01-01T${horario_abertura}`);
    const fim = dayjs(`2000-01-01T${horario_fechamento}`);
    const intervalo = intervalo_minutos || 15;

    const horariosGerados = [];
    let atual = inicio;
    while (atual.isBefore(fim)) {
      horariosGerados.push(atual.format("HH:mm"));
      atual = atual.add(intervalo, "minute");
    }

    const { data: agsOcupados } = await supabase
      .from("appointments")
      .select("starts_at, status, services(duration_minutes)")
      .eq("barbearia_id", barbearia_id)
      .eq("user_id", donoId)
      .neq("status", "cancelado")
      .gte("starts_at", `${data}T00:00:00`)
      .lte("starts_at", `${data}T23:59:59`);

    const ocupados = new Set();

    (agsOcupados || []).forEach((ag) => {
      const inicioAg = dayjs(ag.starts_at);
      const duracao = ag.services?.duration_minutes || 30;
      const blocos = Math.ceil(duracao / intervalo) + 1;
      for (let i = 0; i < blocos; i++) {
        ocupados.add(inicioAg.add(i * intervalo, "minute").format("HH:mm"));
      }
    });

    const lista = horariosGerados.map((hora) => ({
      hora,
      ocupado: ocupados.has(hora),
    }));

    setHorarios(lista);
  }

  useEffect(() => {
    gerarHorarios();
  }, [
    novoAgendamento.barbearia_id,
    novoAgendamento.data,
    novoAgendamento.service_id,
    donoId,
  ]);

  // 💾 Criar agendamento
  async function handleSalvarAgendamento() {
    try {
      const { client_name, barbearia_id, service_id, data, horario } =
        novoAgendamento;

      if (!client_name || !barbearia_id || !service_id || !data || !horario) {
        alert("⚠️ Preencha todos os campos!");
        return;
      }

      const starts_at = new Date(`${data}T${horario}:00`).toISOString();
      const agendamento = {
        client_name,
        barbearia_id,
        user_id: donoId,
        service_id,
        starts_at,
        status: "scheduled",
      };

      const { error } = await supabase
        .from("appointments")
        .insert([agendamento]);
      if (error) throw error;

      alert("✅ Agendamento criado com sucesso!");
      setModalOpen(false);
      setNovoAgendamento({
        client_name: "",
        barbearia_id: "",
        service_id: "",
        data: "",
        horario: "",
      });
      await carregarAgendamentos(donoId);
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao criar agendamento: " + err.message);
    }
  }

  // 🗑️ Excluir agendamento
  async function handleExcluirAgendamento(id) {
    if (confirm("Deseja realmente excluir este agendamento?")) {
      await supabase.from("appointments").delete().eq("id", id);
      await carregarAgendamentos(donoId);
    }
  }

  // ✅ Concluir agendamento
  async function handleConcluirAgendamento(agendamento) {
    try {
      const { id, barbearia_id, service_id } = agendamento;

      await supabase
        .from("appointments")
        .update({ status: "concluido" })
        .eq("id", id);

      const { data: servico } = await supabase
        .from("services")
        .select("price")
        .eq("id", service_id)
        .single();

      const valor = servico?.price || 0;

      await supabase.from("financeiro").insert([
        {
          barbearia_id,
          agendamento_id: id,
          valor,
          criado_em: new Date().toISOString(),
        },
      ]);

      await carregarAgendamentos(donoId);
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao concluir: " + err.message);
    }
  }

  // 📅 Dias da semana
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

      {/* 🔹 MODIFICAÇÃO ÚNICA AQUI */}
      <button
        onClick={() => {
          setNovoAgendamento({
            client_name: "",
            barbearia_id: "",
            service_id: "",
            data: "",
            horario: "",
          });
          setServicos([]);
          setHorarios([]);
          setModalOpen(true);
        }}
        className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-5 py-2 rounded-xl font-semibold text-black shadow-lg hover:scale-105 transition"
      >
        + Novo Agendamento
      </button>
      {/* 🔹 FIM DA ÚNICA MUDANÇA */}

      {/* Grade de dias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
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
                      <p className="font-semibold text-yellow-300">
                        {a.client_name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {a.services?.name || "Serviço"} —{" "}
                        {dayjs(a.starts_at).format("HH:mm")}
                      </p>
                    </div>

                    {a.status === "concluido" ? (
                      <span className="text-green-400 text-xs font-semibold">
                        Concluído ✓
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConcluirAgendamento(a)}
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
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Sem agendamentos</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
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
                value={novoAgendamento.barbearia_id}
                onChange={(e) =>
                  setNovoAgendamento({
                    ...novoAgendamento,
                    barbearia_id: e.target.value,
                    service_id: "",
                    horario: "",
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
                value={novoAgendamento.service_id}
                onChange={(e) =>
                  setNovoAgendamento({
                    ...novoAgendamento,
                    service_id: e.target.value,
                  })
                }
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
                disabled={!novoAgendamento.barbearia_id}
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
                disabled={
                  !novoAgendamento.barbearia_id ||
                  !novoAgendamento.service_id ||
                  !novoAgendamento.data ||
                  horarios.length === 0
                }
              >
                <option value="">-- Selecione o horário --</option>
                {horarios.map((h, i) => (
                  <option
                    key={`${h.hora}-${i}`}
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
