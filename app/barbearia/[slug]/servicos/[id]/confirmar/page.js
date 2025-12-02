"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function ConfirmarAgendamentoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = params.slug;
  const serviceId = params.id;
  const colabId = searchParams.get("colab");
  const hora = searchParams.get("hora");
  const dataISO = searchParams.get("data");

  const [barbearia, setBarbearia] = useState(null);
  const [servico, setServico] = useState(null);
  const [colaborador, setColaborador] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  const nomeCliente = localStorage.getItem("client_name") || "";
  const telefoneCliente = localStorage.getItem("client_phone") || "";

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);

      // 🔹 Buscar barbearia
      const { data: barb } = await supabase
        .from("barbearias")
        .select("id, nome")
        .eq("slug", slug)
        .single();

      // 🔹 Buscar serviço
      const { data: serv } = await supabase
        .from("services")
        .select("id, name, price, duration_minutes")
        .eq("id", serviceId)
        .single();

      let colab = null;

      // 🔹 Caso "qualquer colaborador" → escolher automaticamente
      if (colabId === "any") {
        colab = await escolherColaboradorLivre(barb.id, serv.duration_minutes);
      } else {
        const { data } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("id", colabId)
          .single();
        colab = data;
      }

      setBarbearia(barb);
      setServico(serv);
      setColaborador(colab);
    } finally {
      setCarregando(false);
    }
  }

  // 🔹 Escolher colaborador disponível (considera barbeiros + dono)
  async function escolherColaboradorLivre(barbeariaId, duracaoServico) {
    const inicioAg = new Date(dataISO);
    const [h, m] = hora.split(":").map(Number);
    inicioAg.setHours(h, m, 0, 0);
    const fimAg = new Date(inicioAg.getTime() + duracaoServico * 60000);

    // Buscar todos os colaboradores (barbeiros + dono)
    const { data: colaboradores } = await supabase
      .from("profiles")
      .select("id, name, role")
      .eq("barbearia_id", barbeariaId)
      .in("role", ["barber", "owner"]);

    if (!colaboradores?.length) return null;

    // Buscar agendamentos do dia
    const inicioDia = new Date(dataISO);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataISO);
    fimDia.setHours(23, 59, 59, 999);

    const { data: agends } = await supabase
      .from("appointments")
      .select("starts_at, barber_id, service_id, status")
      .eq("barbearia_id", barbeariaId)
      .neq("status", "cancelado")
      .gte("starts_at", inicioDia.toISOString())
      .lte("starts_at", fimDia.toISOString());

    // Buscar durações dos serviços desses agendamentos
    const servIds = [...new Set(agends.map((a) => a.service_id))];
    let duracoes = {};
    if (servIds.length > 0) {
      const { data: servDur } = await supabase
        .from("services")
        .select("id, duration_minutes")
        .in("id", servIds);
      servDur?.forEach((s) => {
        duracoes[s.id] = s.duration_minutes || 30;
      });
    }

    // Determinar quem está livre
    const livres = [];

    for (const colab of colaboradores) {
      const agsColab = agends.filter((a) => a.barber_id === colab.id);
      let ocupado = false;

      for (const ag of agsColab) {
        const dur = duracoes[ag.service_id] || 30;
        const inicio = new Date(ag.starts_at);
        const fim = new Date(inicio.getTime() + dur * 60000);

        // Se sobrepor com o horário escolhido
        if (inicio < fimAg && fim > inicioAg) {
          ocupado = true;
          break;
        }
      }

      if (!ocupado) livres.push(colab);
    }

    // 🔹 Decisão final
    if (livres.length === 0) return null;
    if (livres.length === 1) return livres[0];

    // Se mais de um estiver livre → escolhe aleatoriamente
    const randomIndex = Math.floor(Math.random() * livres.length);
    return livres[randomIndex];
  }

  async function confirmarAgendamento() {
    if (!nomeCliente || !telefoneCliente) {
      alert("❌ Nome ou telefone não encontrados. Volte e preencha novamente.");
      router.push(`/barbearia/${slug}`);
      return;
    }

    setSalvando(true);
    setMsg("");

    try {
      const dataInicio = new Date(dataISO);
      const [h, m] = hora.split(":").map(Number);
      dataInicio.setHours(h, m, 0, 0);

      const { error } = await supabase.from("appointments").insert([
        {
          barbearia_id: barbearia.id,
          barber_id: colaborador ? colaborador.id : null,
          service_id: serviceId,
          starts_at: dataInicio.toISOString(),
          status: "scheduled",
          client_name: nomeCliente,
          client_phone: telefoneCliente,
        },
      ]);

      if (error) throw error;

      setMsg("✅ Agendamento confirmado com sucesso!");
      setTimeout(() => {
        router.push(`/barbearia/${slug}`);
      }, 1800);
    } catch (err) {
      console.error(err);
      setMsg("❌ Erro ao confirmar o agendamento!");
    } finally {
      setSalvando(false);
    }
  }

  const formatPrice = (v) => {
    if (v === null || v === undefined) return "—";
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(Number(v));
  };

  if (carregando)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 via-neutral-900 to-black">
        <div className="text-center">
          <div className="inline-block h-12 w-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-lg">Carregando informações...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-black text-white font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/10 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/50 mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent leading-tight">
                Confirmar Agendamento
              </h1>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">Revise os detalhes antes de confirmar</p>
            </div>

            <div className="bg-gradient-to-br from-white/5 via-white/3 to-white/0 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 mb-6">
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-start gap-4 pb-4 border-b border-white/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Cliente</p>
                    <p className="text-base sm:text-lg font-semibold text-white">{nomeCliente}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-white/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Telefone</p>
                    <p className="text-base sm:text-lg font-semibold text-white">{telefoneCliente}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-white/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Serviço</p>
                    <p className="text-base sm:text-lg font-semibold text-white">{servico?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-white/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Valor</p>
                    <p className="text-base sm:text-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                      {formatPrice(servico?.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-white/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Duração</p>
                    <p className="text-base sm:text-lg font-semibold text-white">{servico?.duration_minutes} minutos</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-white/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Colaborador</p>
                    <p className={`text-base sm:text-lg font-semibold ${colaborador ? "text-white" : "text-red-400"}`}>
                      {colaborador ? colaborador.name : "Nenhum disponível"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-white/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Data</p>
                    <p className="text-base sm:text-lg font-semibold text-white">
                      {new Date(dataISO).toLocaleDateString("pt-PT", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Hora</p>
                    <p className="text-base sm:text-lg font-semibold text-white">{hora}</p>
                  </div>
                </div>
              </div>
            </div>

            {!!msg && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
                msg.startsWith("✅")
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}>
                <div className="flex items-center gap-2">
                  {msg.startsWith("✅") ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{msg}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 rounded-xl font-semibold bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700 text-white transition-all transform hover:scale-[1.02]"
              >
                Voltar
              </button>
              <button
                onClick={confirmarAgendamento}
                disabled={salvando || !colaborador}
                className="flex-1 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-lg shadow-yellow-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvando ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Salvando...
                  </span>
                ) : (
                  "Confirmar Agendamento"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
