"use client";

import { useEffect, useState, useRef } from "react";
import supabase from "@/lib/supabaseClient";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import {
  Calendar,
  Plus,
  Clock,
  User,
  Phone,
  Euro,
  CheckCircle2,
  Trash2,
  X,
  MessageCircle,
} from "lucide-react";

dayjs.locale("pt-br");

export default function AgendaBarbeiroPage() {
  const [barbeiro, setBarbeiro] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);
  const [diaAtivo, setDiaAtivo] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [novoAgendamento, setNovoAgendamento] = useState({
    client_name: "",
    service_id: "",
    data: "",
    horario: "",
  });
  const hoje = dayjs();
  
  // 📅 Dias da semana (7 dias)
  const diasDaSemana = [];
  for (let i = 0; i < 7; i++) {
    const dia = hoje.locale("pt-br").add(i, "day");
    diasDaSemana.push({
      label: dia.format("dddd, DD/MM"),
      labelCurto: dia.format("ddd DD/MM"),
      diaNome: dia.format("dddd"),
      diaNumero: dia.format("DD/MM"),
      valor: dia.format("YYYY-MM-DD"),
    });
  }
  
  const hojeISO = hoje.format("YYYY-MM-DD");
  const agendamentosHoje = agendamentos.filter(
    (a) => a.starts_at.split("T")[0] === hojeISO
  );
  const totalSemana = diasDaSemana.reduce((acc, dia) => {
    const count = agendamentos.filter(
      (a) => a.starts_at.split("T")[0] === dia.valor
    ).length;
    return acc + count;
  }, 0);
  const tempoHoje = agendamentosHoje.reduce(
    (acc, ag) => acc + (ag.services?.duration_minutes || 0),
    0
  );
  const valorHoje = agendamentosHoje.reduce(
    (acc, ag) => acc + (ag.services?.price || 0),
    0
  );
  const proximoAgendamento = [...agendamentos]
    .filter((ag) => dayjs(ag.starts_at).isAfter(dayjs()))
    .sort(
      (a, b) =>
        dayjs(a.starts_at).valueOf() - dayjs(b.starts_at).valueOf()
    )[0];
  // 📊 Contar agendamentos por dia
  const contagemPorDia = diasDaSemana.map((dia) => {
    return agendamentos.filter((a) => a.starts_at.split("T")[0] === dia.valor).length;
  });

  // 👆 Handlers de swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 75) {
      // Swipe left - próximo dia
      if (diaAtivo < diasDaSemana.length - 1) {
        setDiaAtivo(diaAtivo + 1);
      }
    }
    if (touchStartX.current - touchEndX.current < -75) {
      // Swipe right - dia anterior
      if (diaAtivo > 0) {
        setDiaAtivo(diaAtivo - 1);
      }
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setBarbeiro(data.user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!barbeiro) return;
    carregarServicosEAgendamentos();
  }, [barbeiro]);

  async function carregarServicosEAgendamentos() {
    try {
      const { data: perfil } = await supabase
        .from("profiles")
        .select("barbearia_id")
        .eq("id", barbeiro.id)
        .single();

      const barbeariaId = perfil?.barbearia_id;

      const { data: servicosData } = await supabase
        .from("services")
        .select("*")
        .eq("barbearia_id", barbeariaId);

      setServicos(servicosData || []);

      const { data: agData } = await supabase
        .from("appointments")
        .select(`
          id,
          client_name,
          client_phone,
          starts_at,
          status,
          service_id,
          services(name, duration_minutes, price)
        `)
        .eq("barber_id", barbeiro.id)
        .neq("status", "concluido")
        .order("starts_at", { ascending: true });

      setAgendamentos(agData || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  }

  // 🕐 Gerar horários disponíveis
  function gerarHorariosDisponiveis() {
    if (!novoAgendamento.data) return [];

    const dataSelecionada = novoAgendamento.data;
    const agsDoDia = agendamentos.filter(
      (a) => a.starts_at.split("T")[0] === dataSelecionada && a.status !== "concluido"
    );

    const horarios = [];
    let hora = dayjs(`${dataSelecionada}T09:00`);
    const fimDia = dayjs(`${dataSelecionada}T21:00`);

    while (hora.isBefore(fimDia)) {
      horarios.push(hora.format("HH:mm"));
      hora = hora.add(15, "minute");
    }

    const ocupados = new Set();
    agsDoDia.forEach((ag) => {
      const inicio = dayjs(ag.starts_at);
      const duracao = ag.services?.duration_minutes || 30;
      const slots = Math.ceil(duracao / 15);
      for (let i = 0; i < slots; i++) {
        ocupados.add(inicio.add(i * 15, "minute").format("HH:mm"));
      }
    });

    const servicoSelecionado = servicos.find(
      (s) => s.id === novoAgendamento.service_id
    );
    const duracaoServico = servicoSelecionado?.duration_minutes || 0;
    const slotsServico = Math.ceil(duracaoServico / 15);

    const listaHorarios = horarios.map((h) => {
      // Verificar se o horário ou os slots seguintes estão ocupados
      let ocupado = false;
      const inicio = dayjs(`${dataSelecionada}T${h}`);
      for (let i = 0; i < slotsServico; i++) {
        const slot = inicio.add(i * 15, "minute").format("HH:mm");
        if (ocupados.has(slot)) {
          ocupado = true;
          break;
        }
      }
      return { hora: h, ocupado };
    });

    return listaHorarios;
  }

  const horarios = gerarHorariosDisponiveis();

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
      const starts_at = new Date(
        `${novoAgendamento.data}T${novoAgendamento.horario}:00`
      ).toISOString();

      const agendamento = {
        client_name: novoAgendamento.client_name,
        barbearia_id: servicoSelecionado.barbearia_id,
        barber_id: barbeiro.id,
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

  async function handleConcluirAgendamento(agendamento) {
    try {
      await supabase
        .from("appointments")
        .update({ status: "concluido" })
        .eq("id", agendamento.id);

      const valor = agendamento.services?.price || 0;
      const descricao = agendamento.services?.name || "Serviço";
      const data = new Date().toISOString();

      const { error } = await supabase.from("financeiro").insert([
        {
          barbeiro_id: barbeiro.id,
          service_id: agendamento.service_id,
          valor,
          data,
          descricao,
        },
      ]);

      if (error) throw error;

      setAgendamentos((prev) =>
        prev.filter((item) => item.id !== agendamento.id)
      );

      alert("💰 Serviço concluído e adicionado ao financeiro!");
    } catch (err) {
      console.error("Erro ao concluir:", err);
      alert("❌ Erro ao concluir agendamento!");
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-1">
                Minha Agenda
              </h1>
              <p className="text-gray-400 text-xs lg:text-base">
                Gerencie todos os seus agendamentos
              </p>
            </div>
            {/* Botão Desktop */}
            <button
              onClick={() => {
                setNovoAgendamento({
                  client_name: "",
                  service_id: "",
                  data: "",
                  horario: "",
                });
                setModalOpen(true);
              }}
              className="hidden lg:flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 px-5 py-3 rounded-xl font-semibold text-black shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Plus size={20} />
              Novo Agendamento
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Horizontais */}
      <div className="mb-4 overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex gap-2 min-w-max lg:grid lg:grid-cols-7">
          {diasDaSemana.map((dia, index) => {
            const isToday = dia.valor === dayjs().format("YYYY-MM-DD");
            const isAtivo = diaAtivo === index;
            const qtd = contagemPorDia[index];
            return (
              <button
                key={dia.valor}
                onClick={() => setDiaAtivo(index)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 relative ${
                  isAtivo
                    ? "bg-gradient-to-r from-yellow-600 to-yellow-500 text-black shadow-lg scale-105"
                    : isToday
                    ? "bg-gray-800/80 text-yellow-400 border border-yellow-600/30"
                    : "bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-yellow-600/30 hover:text-yellow-400"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="capitalize text-xs lg:text-sm">
                    {dia.diaNome.substring(0, 3)}
                  </span>
                  <span className="font-bold">{dia.diaNumero.split("/")[0]}</span>
                  {qtd > 0 && (
                    <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                      isAtivo ? "bg-black text-yellow-500" : "bg-yellow-500 text-black"
                    }`}>
                      {qtd}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Área com Swipe */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="min-h-[400px]"
      >
        {/* Conteúdo do Dia Ativo */}
        {diasDaSemana.map((dia, index) => {
          if (index !== diaAtivo) return null;
          
          const ags = agendamentos.filter(
            (a) => a.starts_at.split("T")[0] === dia.valor
          );
          const isToday = dia.valor === dayjs().format("YYYY-MM-DD");
          
          return (
            <div key={dia.valor} className="animate-fadeIn">
              {/* Cabeçalho do Dia */}
              <div className={`bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-4 rounded-t-xl border-t border-x ${
                isToday ? "border-yellow-600/50" : "border-gray-800"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-yellow-500" />
                    <div>
                      <h2 className="font-bold capitalize text-yellow-400 text-lg">
                        {dia.diaNome}
                      </h2>
                      <p className="text-gray-400 text-xs">{dia.diaNumero}</p>
                    </div>
                  </div>
                  {isToday && (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full border border-yellow-500/30">
                      Hoje
                    </span>
                  )}
                </div>
              </div>

              {/* Lista de Agendamentos */}
              <div className={`bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-4 rounded-b-xl border-b border-x space-y-3 ${
                isToday ? "border-yellow-600/50" : "border-gray-800"
              }`}>
                {ags.length > 0 ? (
                  ags.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setModalInfo(a)}
                      className={`bg-gray-800/60 p-3 rounded-xl border cursor-pointer hover:border-yellow-500/50 transition-all duration-200 hover:shadow-lg active:scale-[0.98] ${
                        a.status === "concluido"
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-gray-700/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            <p className="font-bold text-white text-base truncate">
                              {a.client_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="font-medium">{dayjs(a.starts_at).format("HH:mm")}</span>
                            </div>
                            <span className="text-gray-600">•</span>
                            <span className="truncate">{a.services?.name || "Serviço"}</span>
                          </div>
                        </div>

                        {a.status === "concluido" ? (
                          <div className="flex items-center gap-1.5 text-green-400 text-sm font-semibold whitespace-nowrap bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Concluído</span>
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConcluirAgendamento(a);
                              }}
                              className="bg-green-600/80 hover:bg-green-600 text-white p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                              title="Concluir"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExcluirAgendamento(a.id);
                              }}
                              className="bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-800/30 rounded-xl p-12 text-center border border-gray-800/50">
                    <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-medium">Sem agendamentos neste dia</p>
                    <p className="text-gray-600 text-xs mt-1">Deslize para ver outros dias</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB - Floating Action Button (Mobile) */}
      <button
        onClick={() => {
          setNovoAgendamento({
            client_name: "",
            service_id: "",
            data: "",
            horario: "",
          });
          setModalOpen(true);
        }}
        className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black rounded-full shadow-2xl hover:shadow-3xl transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center z-40"
        aria-label="Novo Agendamento"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Modal de detalhes */}
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
                  className="w-full p-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white transition-all"
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

      {/* Estilos customizados */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
