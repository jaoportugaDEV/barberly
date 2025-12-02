"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import Calendar from "react-calendar";
import "@/app/barbearia/styles/calendar.css";

export default function EscolherHorarioPage() {
  const params = useParams();
  const router = useRouter();

  const slug = params.slug;
  const serviceId = params.id;
  const colabId = params.colabId;

  const [barbearia, setBarbearia] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [ocupados, setOcupados] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!slug || !serviceId) return;
    carregarDados();
  }, [slug, serviceId, selectedDate, colabId]);

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      // 🔹 Buscar barbearia
      const { data: barb, error: errBarb } = await supabase
        .from("barbearias")
        .select("id, nome, horario_abertura, horario_fechamento")
        .eq("slug", slug)
        .single();

      if (errBarb || !barb) throw new Error("Erro ao carregar barbearia");
      setBarbearia(barb);

      // 🔹 Buscar duração do serviço atual
      const { data: servico } = await supabase
        .from("services")
        .select("duration_minutes")
        .eq("id", serviceId)
        .single();
      const duracaoServico = servico?.duration_minutes || 30;

      // 🔹 Gerar slots de horário (15 em 15min)
      const slots = gerarHorarios(
        barb.horario_abertura || "09:00",
        barb.horario_fechamento || "18:00"
      );
      setHorarios(slots);

      // 🔹 Buscar agendamentos do dia
      const inicioDia = new Date(selectedDate);
      inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date(selectedDate);
      fimDia.setHours(23, 59, 59, 999);

      const { data: agends, error: errAg } = await supabase
        .from("appointments")
        .select("starts_at, service_id, barber_id, status")
        .eq("barbearia_id", barb.id)
        .neq("status", "cancelado")
        .gte("starts_at", inicioDia.toISOString())
        .lte("starts_at", fimDia.toISOString());

      if (errAg) throw new Error("Erro ao carregar agendamentos");

      // 🔹 Buscar durações dos serviços agendados
      const servicoIds = [...new Set(agends.map((a) => a.service_id))];
      let duracoes = {};
      if (servicoIds.length > 0) {
        const { data: duracoesData } = await supabase
          .from("services")
          .select("id, duration_minutes")
          .in("id", servicoIds);

        duracoesData?.forEach((s) => {
          duracoes[s.id] = s.duration_minutes || 30;
        });
      }

      // 🔹 Buscar IDs de todos os colaboradores (barbeiros + dono)
      const { data: colaboradores } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("barbearia_id", barb.id)
        .in("role", ["barber", "owner"]);

      const idsColaboradores = colaboradores?.map((c) => c.id) || [];

      // 🔹 Criar mapa de horários ocupados por colaborador
      const mapaColaboradores = {};
      for (const c of idsColaboradores) mapaColaboradores[c] = new Set();

      // 🔹 Mapa geral da barbearia (para "qualquer colaborador")
      const mapaGeral = new Set();

      // 🔹 Preencher mapas
      for (const ag of agends) {
        const dur = duracoes[ag.service_id] || 30;
        const inicio = new Date(ag.starts_at);
        const fim = new Date(inicio.getTime() + dur * 60000);

        let atual = new Date(inicio);
        while (atual < fim) {
          const horaStr = `${String(atual.getHours()).padStart(2, "0")}:${String(
            atual.getMinutes()
          ).padStart(2, "0")}`;

          // Marca no mapa do colaborador (barbeiro ou dono)
          if (ag.barber_id) {
            mapaColaboradores[ag.barber_id]?.add(horaStr);
          }

          // Marca no mapa geral (para o modo “qualquer colaborador”)
          mapaGeral.add(horaStr);

          atual = new Date(atual.getTime() + 15 * 60000);
        }
      }

      // 🔹 Determinar horários ocupados
      let ocupadosCalc = [];
      if (colabId === "any") {
        // Caso “qualquer colaborador” → ocupado se TODOS estiverem ocupados
        ocupadosCalc = slots.filter((hora) =>
          idsColaboradores.every((c) => mapaColaboradores[c]?.has(hora))
        );
      } else {
        // Caso barbeiro ou dono específico → usa apenas a agenda dele
        ocupadosCalc = Array.from(mapaColaboradores[colabId] || []);
      }

      // 🔹 Ajustar ocupados conforme duração do serviço atual
      const ocupadosComDuracao = new Set([...ocupadosCalc]);
      for (const hora of slots) {
        const [h, m] = hora.split(":").map(Number);
        const inicio = new Date(selectedDate);
        inicio.setHours(h, m, 0, 0);
        const fim = new Date(inicio.getTime() + duracaoServico * 60000);

        let sobrepoe = false;
        let atual = new Date(inicio);
        while (atual < fim) {
          const bloco = `${String(atual.getHours()).padStart(2, "0")}:${String(
            atual.getMinutes()
          ).padStart(2, "0")}`;
          if (ocupadosComDuracao.has(bloco)) {
            sobrepoe = true;
            break;
          }
          atual = new Date(atual.getTime() + 15 * 60000);
        }

        if (sobrepoe) ocupadosComDuracao.add(hora);
      }

      setOcupados([...ocupadosComDuracao]);
    } catch (err) {
      console.error(err);
      setErro("Não foi possível carregar os horários disponíveis.");
    } finally {
      setLoading(false);
    }
  }

  // 🕓 Gera horários a cada 15 minutos
  function gerarHorarios(inicio, fim) {
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

  const formatShortWeekday = (locale, date) => {
    const dias = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
    return dias[date.getDay()];
  };

  // 🟢 Quando o usuário escolhe um horário
  const handleEscolherHorario = (hora) => {
    if (ocupados.includes(hora)) return;
    const dataISO = selectedDate.toISOString().split(".")[0] + "Z";
    router.push(
      `/barbearia/${slug}/servicos/${serviceId}/confirmar?colab=${colabId}&hora=${hora}&data=${dataISO}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-black text-white font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 sm:gap-4 mb-6">
            <Link
              href={`/barbearia/${slug}/servicos/${serviceId}/colaboradores`}
              className="text-gray-400 hover:text-yellow-500 transition-colors flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm sm:text-base">Voltar</span>
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent leading-tight">
            {barbearia?.nome
              ? `Escolher horário — ${barbearia.nome}`
              : "Escolher horário"}
          </h1>
        </div>

        <div className="mb-8 sm:mb-12">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-white/10 shadow-2xl">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                locale="pt-PT"
                minDate={new Date()}
                prev2Label={null}
                next2Label={null}
                className="rounded-xl"
                formatShortWeekday={formatShortWeekday}
              />
            </div>
          </div>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-400 mb-2">
              Horários disponíveis
            </h2>
            <p className="text-gray-300 text-sm sm:text-base">
              {selectedDate.toLocaleDateString("pt-PT", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-12 w-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">Carregando horários…</p>
            </div>
          </div>
        )}
        {!!erro && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
            <p className="text-red-400 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {erro}
            </p>
          </div>
        )}

        {!loading && !erro && (
          <div>
            {horarios.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/10 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-400 text-lg">Nenhum horário disponível neste dia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {horarios.map((hora) => {
                  const ocupado = ocupados.includes(hora);
                  return (
                    <button
                      key={hora}
                      onClick={() => handleEscolherHorario(hora)}
                      disabled={ocupado}
                      className={`relative group px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all duration-300 transform ${
                        ocupado
                          ? "bg-neutral-800/50 text-gray-500 cursor-not-allowed border border-neutral-700/50"
                          : "bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-xl border border-white/10 text-white hover:bg-gradient-to-br hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-500 hover:text-black hover:border-yellow-500/50 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/25"
                      }`}
                    >
                      {!ocupado && (
                        <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-yellow-500/0 group-hover:bg-yellow-500/10 transition-colors"></div>
                      )}
                      <span className="relative z-10">{hora}</span>
                      {ocupado && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
