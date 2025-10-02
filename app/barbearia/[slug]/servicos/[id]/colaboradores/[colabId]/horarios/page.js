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

  const slug = params.slug;       // barbearia slug
  const serviceId = params.id;    // serviço id
  const colabId = params.colabId; // colaborador id ou "qualquer"

  const [barbearia, setBarbearia] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!slug) return;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("barbearias")
        .select("id, nome, horario_abertura, horario_fechamento")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        setErro("Não foi possível carregar informações da barbearia.");
        setLoading(false);
        return;
      }

      setBarbearia(data);

      const slots = gerarHorarios(
        data.horario_abertura || "09:00",
        data.horario_fechamento || "18:00"
      );
      setHorarios(slots);

      setLoading(false);
    })();
  }, [slug]);

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

  const handleEscolherHorario = (hora) => {
    router.push(
      `/barbearia/${slug}/servicos/${serviceId}/confirmar?colab=${colabId}&hora=${hora}&data=${selectedDate.toISOString()}`
    );
  };

  // 🔹 Abreviações personalizadas
  const formatShortWeekday = (locale, date) => {
    const dias = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
    return dias[date.getDay()];
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

        {loading && <p className="text-gray-400">Carregando horários…</p>}
        {!!erro && <p className="text-red-400">{erro}</p>}

        {!loading && !erro && (
          <div className="grid grid-cols-4 gap-3">
            {horarios.map((hora) => (
              <button
                key={hora}
                onClick={() => handleEscolherHorario(hora)}
                className="px-4 py-3 rounded-xl bg-neutral-800 
                           hover:bg-yellow-500 hover:text-black 
                           font-semibold shadow-md transition"
              >
                {hora}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
