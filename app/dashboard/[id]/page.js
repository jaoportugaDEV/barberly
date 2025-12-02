"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import {
  CalendarDays,
  Clock3,
  PlusCircle,
  Users2,
  Wallet2,
} from "lucide-react";

dayjs.locale("pt-br");

export default function AgendaBarbeiroPage() {
  const [barbeiro, setBarbeiro] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState(null); // 🔹 Novo: detalhes do cliente
  const [novoAgendamento, setNovoAgendamento] = useState({
    client_name: "",
    service_id: "",
    data: "",
    horario: "",
  });
  const hoje = dayjs();
  const diasDaSemana = Array.from({ length: 5 }, (_, i) => {
    const dia = hoje.add(i, "day");
    return {
      label: dia.format("dddd, DD/MM"),
      valor: dia.format("YYYY-MM-DD"),
      isToday: dia.isSame(hoje, "day"),
    };
  });
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
  const stats = [
    {
      label: "Hoje",
      value: agendamentosHoje.length,
      helper: "agendamentos",
      icon: CalendarDays,
    },
    {
      label: "Semana",
      value: totalSemana,
      helper: "clientes previstos",
      icon: Users2,
    },
    {
      label: "Tempo total",
      value: tempoHoje ? `${tempoHoje} min` : "0 min",
      helper: "ocupado hoje",
      icon: Clock3,
    },
    {
      label: "Receita",
      value: `€${valorHoje.toFixed(2)}`,
      helper: "prevista hoje",
      icon: Wallet2,
    },
  ];

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

    const ocupadosComConflito = new Set([...ocupados]);
    if (duracaoServico > 0) {
      horarios.forEach((h) => {
        const inicio = dayjs(`${dataSelecionada}T${h}`);
        let conflito = false;
        for (let i = 0; i < slotsServico; i++) {
          const slot = inicio.add(i * 15, "minute").format("HH:mm");
          if (ocupados.has(slot)) {
            conflito = true;
            break;
          }
        }
        if (conflito) ocupadosComConflito.add(h);
      });
    }

    return { horarios, ocupados: Array.from(ocupadosComConflito) };
  }

  const { horarios, ocupados } = gerarHorariosDisponiveis();

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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-4 lg:p-8 space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
            Agenda
          </p>
          <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Minha Agenda
          </h1>
          <p className="text-gray-400 max-w-xl mt-2">
            Controle os horários dos próximos dias e tenha visibilidade total
            dos clientes confirmados.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={carregarServicosEAgendamentos}
            className="px-5 py-3 rounded-xl border border-gray-700 text-gray-200 hover:text-yellow-400 hover:border-yellow-500 transition"
          >
            Sincronizar agenda
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 via-yellow-500 to-yellow-600 px-5 py-3 rounded-xl text-black font-semibold shadow-lg shadow-yellow-600/30 hover:scale-[1.02] transition"
          >
            <PlusCircle size={18} />
            Novo agendamento
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, helper, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-800/70 bg-gray-900/40 backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">{label}</p>
              <span className="p-2 rounded-full bg-gray-800">
                <Icon size={18} className="text-yellow-400" />
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{value}</p>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {helper}
            </p>
          </div>
        ))}
      </section>

      {proximoAgendamento && (
        <section className="rounded-2xl border border-yellow-600/40 bg-gradient-to-r from-gray-900/80 to-gray-900/40 p-5 space-y-3 shadow-lg shadow-yellow-600/10">
          <p className="text-xs uppercase tracking-[0.4em] text-yellow-400">
            Próximo cliente
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-2xl font-semibold text-yellow-200">
                {proximoAgendamento.client_name}
              </p>
              <p className="text-gray-400">
                {proximoAgendamento.services?.name || "Serviço"} •{" "}
                {dayjs(proximoAgendamento.starts_at).format(
                  "DD/MM [às] HH:mm"
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setModalInfo(proximoAgendamento)}
                className="px-4 py-2 rounded-xl border border-gray-700 text-gray-200 hover:border-yellow-500 hover:text-yellow-400 transition"
              >
                Ver detalhes
              </button>
              <button
                onClick={() => handleConcluirAgendamento(proximoAgendamento)}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition"
              >
                Concluir e receber
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Próximos 5 dias
            </h2>
            <p className="text-sm text-gray-400">
              No celular, arraste lateralmente para navegar pelos dias.
            </p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-2 px-2 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-5 lg:snap-none lg:overflow-visible">
          {diasDaSemana.map((dia) => {
            const ags = agendamentos.filter(
              (a) => a.starts_at.split("T")[0] === dia.valor
            );
            return (
              <div
                key={dia.valor}
                className={`min-w-[250px] lg:min-w-0 rounded-2xl p-4 border backdrop-blur bg-gray-900/40 ${
                  dia.isToday
                    ? "border-yellow-500/60 shadow-lg shadow-yellow-500/20"
                    : "border-gray-800/70"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold capitalize">
                    {dia.label}
                  </h3>
                  {dia.isToday && (
                    <span className="text-xs font-semibold text-yellow-300 bg-yellow-300/10 px-2 py-1 rounded-full">
                      Hoje
                    </span>
                  )}
                </div>

                {ags.length > 0 ? (
                  <div className="space-y-3">
                    {ags.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => setModalInfo(a)}
                        className="rounded-2xl border border-gray-800/80 bg-gray-950/60 p-3 cursor-pointer transition hover:border-yellow-500/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-yellow-200">
                              {a.client_name}
                            </p>
                            <p className="text-sm text-gray-400">
                              {a.services?.name || "Serviço"} ·{" "}
                              {dayjs(a.starts_at).format("HH:mm")} (
                              {a.services?.duration_minutes || 0} min)
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                            €
                            {(a.services?.price || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConcluirAgendamento(a);
                            }}
                            className="flex-1 px-2 py-1 rounded-lg bg-green-600/90 hover:bg-green-600 text-xs font-semibold"
                          >
                            Concluir
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExcluirAgendamento(a.id);
                            }}
                            className="px-2 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-xs font-semibold"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 bg-gray-900/50 border border-dashed border-gray-700 rounded-xl p-4">
                    Sem agendamentos
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {modalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-yellow-400 text-center">
              Detalhes do agendamento
            </h2>
            <div className="text-sm text-gray-300 space-y-2">
              <p>
                <span className="text-yellow-400 font-semibold">Cliente:</span>{" "}
                {modalInfo.client_name}
              </p>
              <p>
                <span className="text-yellow-400 font-semibold">Telefone:</span>{" "}
                {modalInfo.client_phone || "Não informado"}
              </p>
              <p>
                <span className="text-yellow-400 font-semibold">Serviço:</span>{" "}
                {modalInfo.services?.name || "—"}
              </p>
              <p>
                <span className="text-yellow-400 font-semibold">Data:</span>{" "}
                {dayjs(modalInfo.starts_at).format("DD/MM/YYYY")}
              </p>
              <p>
                <span className="text-yellow-400 font-semibold">Hora:</span>{" "}
                {dayjs(modalInfo.starts_at).format("HH:mm")}
              </p>
              <p>
                <span className="text-yellow-400 font-semibold">Valor:</span>{" "}
                €{modalInfo.services?.price?.toFixed(2) || "0.00"}
              </p>
            </div>

            {modalInfo.client_phone && (
              <a
                href={`https://wa.me/${modalInfo.client_phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="block mt-4 w-full text-center bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-lg transition"
              >
                💬 Enviar WhatsApp
              </a>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setModalInfo(null)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-semibold rounded-lg transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-yellow-400">
              Novo agendamento
            </h2>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Nome do cliente"
                value={novoAgendamento.client_name}
                onChange={(e) =>
                  setNovoAgendamento({
                    ...novoAgendamento,
                    client_name: e.target.value,
                  })
                }
                className="p-3 rounded-xl bg-gray-900 border border-gray-800 focus:ring-2 focus:ring-yellow-500 outline-none"
              />

              <select
                value={novoAgendamento.service_id}
                onChange={(e) =>
                  setNovoAgendamento({
                    ...novoAgendamento,
                    service_id: e.target.value,
                  })
                }
                className="p-3 rounded-xl bg-gray-900 border border-gray-800 focus:ring-2 focus:ring-yellow-500 outline-none"
              >
                <option value="">-- Selecione o serviço --</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — €{s.price} ({s.duration_minutes} min)
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={novoAgendamento.data}
                  onChange={(e) =>
                    setNovoAgendamento({
                      ...novoAgendamento,
                      data: e.target.value,
                    })
                  }
                  className="p-3 rounded-xl bg-gray-900 border border-gray-800 focus:ring-2 focus:ring-yellow-500 outline-none"
                />

                <select
                  value={novoAgendamento.horario}
                  onChange={(e) =>
                    setNovoAgendamento({
                      ...novoAgendamento,
                      horario: e.target.value,
                    })
                  }
                  className="p-3 rounded-xl bg-gray-900 border border-gray-800 focus:ring-2 focus:ring-yellow-500 outline-none"
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
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-700 text-gray-200 hover:border-yellow-500 hover:text-yellow-400 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarAgendamento}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold hover:scale-[1.01] transition"
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
