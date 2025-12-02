"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { Calendar, Plus, Clock, User, Phone, Euro, CheckCircle2, Trash2, X, MessageCircle } from "lucide-react";

export default function AgendaDonoPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [barbearias, setBarbearias] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);
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

  // 🔄 Carregar agendamentos de todas as barbearias do dono
  async function carregarAgendamentos(donoId) {
    try {
      const { data: barbeariasData, error: barbErr } = await supabase
        .from("barbearias")
        .select("id")
        .eq("dono_id", donoId);

      if (barbErr) throw barbErr;
      if (!barbeariasData || barbeariasData.length === 0) {
        setAgendamentos([]);
        return;
      }

      const ids = barbeariasData.map((b) => b.id);

      const { data: agData, error: agError } = await supabase
        .from("appointments")
        .select(`
          id,
          client_name,
          client_phone,
          starts_at,
          status,
          service_id,
          barber_id,
          services(name, duration_minutes, price)
        `)
        .in("barbearia_id", ids)
        .order("starts_at", { ascending: true });

      if (agError) throw agError;

      setAgendamentos(agData || []);
    } catch (err) {
      console.error("Erro geral ao carregar agendamentos:", err);
      setAgendamentos([]);
    }
  }

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
    if (!barbearia_id || !data || !service_id) return;

    const { data: barbearia } = await supabase
      .from("barbearias")
      .select("horario_abertura, horario_fechamento, intervalo_minutos")
      .eq("id", barbearia_id)
      .single();
    if (!barbearia) return;

    const { horario_abertura, horario_fechamento, intervalo_minutos } =
      barbearia;
    const inicio = dayjs(`2000-01-01T${horario_abertura || "09:00"}`);
    const fim = dayjs(`2000-01-01T${horario_fechamento || "19:00"}`);
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-2">
              Agenda do Dono
            </h1>
            <p className="text-gray-400 text-sm lg:text-base">
              Gerencie todos os agendamentos das suas barbearias
            </p>
          </div>
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
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 px-5 py-3 rounded-xl font-semibold text-black shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {diasDaSemana.map((dia) => {
          const ags = agendamentos.filter(
            (a) => a.starts_at.split("T")[0] === dia.valor
          );
          const isToday = dia.valor === dayjs().format("YYYY-MM-DD");
          return (
            <div
              key={dia.valor}
              className={`bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-4 lg:p-5 rounded-xl border shadow-xl hover:shadow-2xl transition-all duration-300 ${
                isToday
                  ? "border-yellow-600/50 ring-2 ring-yellow-600/20"
                  : "border-gray-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-yellow-500" />
                <h2
                  className={`font-bold capitalize ${
                    isToday
                      ? "text-yellow-400 text-lg"
                      : "text-yellow-400/90"
                  }`}
                >
                  {dia.label.split(",")[0]}
                </h2>
              </div>
              <p className="text-gray-400 text-xs mb-4 capitalize">
                {dia.label.split(",")[1]?.trim()}
              </p>

              <div className="space-y-2 max-h-[500px] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                {ags.length > 0 ? (
                  ags.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setModalInfo(a)}
                      className={`bg-gray-800/60 p-3 rounded-lg border cursor-pointer hover:border-yellow-500/50 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                        a.status === "concluido"
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-gray-700/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                            <p className="font-semibold text-white text-sm truncate">
                              {a.client_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <p className="text-xs text-gray-400">
                              {dayjs(a.starts_at).format("HH:mm")}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {a.services?.name || "Serviço"}
                          </p>
                        </div>

                        {a.status === "concluido" ? (
                          <span className="flex items-center gap-1 text-green-400 text-xs font-semibold whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Concluído</span>
                          </span>
                        ) : (
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConcluirAgendamento(a);
                              }}
                              className="bg-green-600/80 hover:bg-green-600 text-white p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                              title="Concluir"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExcluirAgendamento(a.id);
                              }}
                              className="bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                              title="Excluir"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-800/30 rounded-lg p-6 text-center border border-gray-800/50">
                    <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">Sem agendamentos</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔹 Modal de detalhes com botão WhatsApp */}
      {modalInfo && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4"
          onClick={() => setModalInfo(null)}
        >
          <div
            className="bg-gradient-to-br from-gray-900 to-gray-950 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-800 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                Detalhes do Agendamento
              </h2>
              <button
                onClick={() => setModalInfo(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-400 font-semibold text-sm">Cliente</span>
                </div>
                <p className="text-white font-medium ml-6">{modalInfo.client_name}</p>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-400 font-semibold text-sm">Telefone</span>
                </div>
                <p className="text-gray-300 ml-6">
                  {modalInfo.client_phone || "Não informado"}
                </p>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-400 font-semibold text-sm">Serviço</span>
                </div>
                <p className="text-gray-300 ml-6">{modalInfo.services?.name || "—"}</p>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-400 font-semibold text-sm">Horário</span>
                </div>
                <p className="text-gray-300 ml-6">
                  {dayjs(modalInfo.starts_at).format("DD/MM/YYYY [às] HH:mm")}
                </p>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Euro className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-400 font-semibold text-sm">Valor</span>
                </div>
                <p className="text-yellow-400 font-semibold ml-6">
                  €{modalInfo.services?.price?.toFixed(2) || "—"}
                </p>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <span className="text-yellow-400 font-semibold text-sm">Status</span>
                <div className="mt-1">
                  {modalInfo.status === "concluido" ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Concluído
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-semibold">
                      <Clock className="w-3 h-3" />
                      Agendado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ Botão WhatsApp */}
            {modalInfo.client_phone && (
              <a
                href={`https://wa.me/${modalInfo.client_phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 mb-4"
              >
                <MessageCircle className="w-5 h-5" />
                Enviar mensagem no WhatsApp
              </a>
            )}

            <button
              onClick={() => setModalInfo(null)}
              className="w-full px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de novo agendamento */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-gradient-to-br from-gray-900 to-gray-950 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-800 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                Novo Agendamento
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  placeholder="Digite o nome do cliente"
                  value={novoAgendamento.client_name}
                  onChange={(e) =>
                    setNovoAgendamento({
                      ...novoAgendamento,
                      client_name: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Barbearia
                </label>
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
                  className="w-full p-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white transition-all"
                >
                  <option value="" className="bg-gray-800">Selecione a barbearia</option>
                  {barbearias.map((b) => (
                    <option key={b.id} value={b.id} className="bg-gray-800">
                      {b.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Serviço
                </label>
                <select
                  value={novoAgendamento.service_id}
                  onChange={(e) =>
                    setNovoAgendamento({
                      ...novoAgendamento,
                      service_id: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!novoAgendamento.barbearia_id}
                >
                  <option value="" className="bg-gray-800">Selecione o serviço</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id} className="bg-gray-800">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={novoAgendamento.data}
                  onChange={(e) =>
                    setNovoAgendamento({
                      ...novoAgendamento,
                      data: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Horário
                </label>
                <select
                  value={novoAgendamento.horario}
                  onChange={(e) =>
                    setNovoAgendamento({
                      ...novoAgendamento,
                      horario: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    !novoAgendamento.barbearia_id ||
                    !novoAgendamento.service_id ||
                    !novoAgendamento.data ||
                    horarios.length === 0
                  }
                >
                  <option value="" className="bg-gray-800">Selecione o horário</option>
                  {horarios.map((h, i) => (
                    <option
                      key={`${h.hora}-${i}`}
                      value={h.hora}
                      disabled={h.ocupado}
                      className={h.ocupado ? "bg-gray-800 text-red-400" : "bg-gray-800"}
                    >
                      {h.hora} {h.ocupado ? "— Ocupado" : "— Disponível"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarAgendamento}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
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
