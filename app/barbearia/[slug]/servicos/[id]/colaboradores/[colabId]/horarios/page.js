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

  const slug = params.slug; // barbearia slug
  const serviceId = params.id; // serviço id
  const colabId = params.colabId; // colaborador id ou "any"

  const [barbearia, setBarbearia] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [ocupados, setOcupados] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!slug || !serviceId) return;

    (async () => {
      try {
        setLoading(true);

        // Buscar barbearia
        const { data: barb, error: errBarb } = await supabase
          .from("barbearias")
          .select("id, nome, horario_abertura, horario_fechamento")
          .eq("slug", slug)
          .single();

        if (errBarb || !barb) throw new Error("Erro ao carregar barbearia");
        setBarbearia(barb);

        // Buscar duração do serviço
        const { data: servico } = await supabase
          .from("services")
          .select("duration_minutes")
          .eq("id", serviceId)
          .single();
        const duracao = servico?.duration_minutes || 30;

        // Buscar barbeiros dessa barbearia
        const { data: barbeiros } = await supabase
          .from("profiles")
          .select("id")
          .eq("barbearia_id", barb.id)
          .eq("role", "barber");

        const idsBarbeiros = barbeiros?.map((b) => b.id) || [];

        // Gerar slots de horário (a cada 15min)
        const slots = gerarHorarios(
          barb.horario_abertura || "09:00",
          barb.horario_fechamento || "18:00"
        );
        setHorarios(slots);

        // Buscar agendamentos do dia
        const inicioDia = new Date(selectedDate);
        inicioDia.setHours(0, 0, 0, 0);
        const fimDia = new Date(selectedDate);
        fimDia.setHours(23, 59, 59, 999);

        const { data: agends } = await supabase
          .from("appointments")
          .select("starts_at, service_id, barber_id")
          .gte("starts_at", inicioDia.toISOString())
          .lte("starts_at", fimDia.toISOString())
          .eq("barbearia_id", barb.id);

        // Criar mapa de horários ocupados por barbeiro
        const mapaBarbeiros = {};
        for (const b of idsBarbeiros) mapaBarbeiros[b] = new Set();

        for (const ag of agends) {
          const serv = await supabase
            .from("services")
            .select("duration_minutes")
            .eq("id", ag.service_id)
            .single();

          const dur = serv.data?.duration_minutes || duracao;
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

        let ocupadosCalc = [];

        if (colabId === "any") {
          // Caso seja "qualquer colaborador", bloqueia apenas se TODOS estiverem ocupados
          ocupadosCalc = slots.filter((hora) =>
            idsBarbeiros.every((b) => mapaBarbeiros[b]?.has(hora))
          );
        } else {
          // Caso seja barbeiro específico, bloqueia apenas os horários dele
          ocupadosCalc = Array.from(mapaBarbeiros[colabId] || []);
        }

        setOcupados(ocupadosCalc);
      } catch (err) {
        console.error(err);
        setErro("Não foi possível carregar informações da barbearia.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, serviceId, selectedDate, colabId]);

  // Função para gerar lista de horários a cada 15 min
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

  // Formato abreviado dos dias
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
