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

      // 🔹 Buscar durações de todos serviços usados
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

      // 🔹 Buscar IDs de barbeiros da barbearia
      const { data: barbeiros } = await supabase
        .from("profiles")
        .select("id")
        .eq("barbearia_id", barb.id)
        .eq("role", "barber");

      const idsBarbeiros = barbeiros?.map((b) => b.id) || [];

      // 🔹 Criar mapa de horários ocupados por barbeiro (com duração)
      const mapaBarbeiros = {};
      for (const b of idsBarbeiros) mapaBarbeiros[b] = new Set();

      for (const ag of agends) {
        const dur = duracoes[ag.service_id] || 30;
        const inicio = new Date(ag.starts_at);
        const fim = new Date(inicio.getTime() + dur * 60000);

        let atual = new Date(inicio);
        while (atual < fim) {
          const horaStr = `${String(atual.getHours()).padStart(2, "0")}:${String(
            atual.getMinutes()
          ).padStart(2, "0")}`;
          mapaBarbeiros[ag.barber_id]?.add(horaStr);
          atual = new Date(atual.getTime() + 15 * 60000);
        }
      }

      // 🔹 Determinar horários ocupados
      let ocupadosCalc = [];

      if (colabId === "any") {
        ocupadosCalc = slots.filter((hora) =>
          idsBarbeiros.every((b) => mapaBarbeiros[b]?.has(hora))
        );
      } else {
        ocupadosCalc = Array.from(mapaBarbeiros[colabId] || []);
      }

      // 🔹 Ajuste extra: remover horários que colidem pelo tempo do serviço escolhido
      const ocupadosComDuracao = new Set([...ocupadosCalc]);

      for (const hora of slots) {
        const [h, m] = hora.split(":").map(Number);
        const inicio = new Date(selectedDate);
        inicio.setHours(h, m, 0, 0);

        const fim = new Date(inicio.getTime() + duracaoServico * 60000);

        // verificar se algum bloco dentro da duração toca um ocupado
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

  // Gera horários a cada 15min
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

  const handleEscolherHorario = (hora) => {
    if (ocupados.includes(hora)) return;
    router.push(
      `/barbearia/${slug}/servicos/${serviceId}/confirmar?colab=${colabId}&hora=${hora}&data=${selectedDate.toISOString()}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* topo */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/barbearia/${slug}/servicos/${serviceId}/colaboradores`}
            className="text-gray-300 hover:text-white"
          >
            ← Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-yellow-500">
            {barbearia?.nome
              ? `Escolher horário — ${barbearia.nome}`
              : "Escolher horário"}
          </h1>
        </div>

        {/* calendário */}
        <div className="flex justify-center mb-8">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            locale="pt-PT"
            minDate={new Date()}
            prev2Label={null}
            next2Label={null}
            className="rounded-xl shadow-lg bg-neutral-900 p-4"
            formatShortWeekday={formatShortWeekday}
          />
        </div>

        {/* horários */}
        <h2 className="text-center text-lg font-semibold text-yellow-400 mb-4">
          Horários disponíveis em{" "}
          {selectedDate.toLocaleDateString("pt-PT", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </h2>

        {loading && <p className="text-gray-400 text-center">Carregando horários…</p>}
        {!!erro && <p className="text-red-400 text-center">{erro}</p>}

        {!loading && !erro && (
          <div className="grid grid-cols-4 gap-3">
            {horarios.map((hora) => {
              const ocupado = ocupados.includes(hora);
              return (
                <button
                  key={hora}
                  onClick={() => handleEscolherHorario(hora)}
                  disabled={ocupado}
                  className={`px-4 py-3 rounded-xl font-semibold shadow-md transition ${
                    ocupado
                      ? "bg-neutral-800 text-gray-500 cursor-not-allowed"
                      : "bg-neutral-800 hover:bg-yellow-500 hover:text-black"
                  }`}
                >
                  {hora}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
