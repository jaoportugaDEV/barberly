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

      const { data: barb } = await supabase
        .from("barbearias")
        .select("id, nome")
        .eq("slug", slug)
        .single();

      const { data: serv } = await supabase
        .from("services")
        .select("id, name, price, duration_minutes")
        .eq("id", serviceId)
        .single();

      let colab = null;
      if (colabId !== "any") {
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
          barber_id: colabId === "any" ? null : colabId,
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

  if (carregando)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-yellow-500 font-medium">
        <div className="animate-pulse text-lg">Carregando...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-950 text-white flex items-center justify-center px-4 py-12">
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-yellow-600/40 rounded-3xl p-8 w-full max-w-md shadow-[0_0_40px_rgba(255,215,0,0.15)] backdrop-blur-md">
        {/* brilho sutil dourado */}
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-yellow-500/20 to-transparent blur-lg opacity-20"></div>

        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-300 bg-clip-text text-transparent">
            Confirmar Agendamento
          </h1>

          <div className="space-y-3 text-gray-200 text-sm border border-gray-700/50 rounded-xl p-4 bg-gray-900/50 backdrop-blur-sm">
            <p>
              <span className="font-semibold text-yellow-400">Cliente:</span>{" "}
              {nomeCliente}
            </p>
            <p>
              <span className="font-semibold text-yellow-400">Telefone:</span>{" "}
              {telefoneCliente}
            </p>
            <p>
              <span className="font-semibold text-yellow-400">Serviço:</span>{" "}
              {servico?.name}
            </p>
            <p>
              <span className="font-semibold text-yellow-400">Valor:</span> €
              {servico?.price}
            </p>
            <p>
              <span className="font-semibold text-yellow-400">Duração:</span>{" "}
              {servico?.duration_minutes} min
            </p>
            <p>
              <span className="font-semibold text-yellow-400">Colaborador:</span>{" "}
              {colaborador ? colaborador.name : "Qualquer"}
            </p>
            <p>
              <span className="font-semibold text-yellow-400">Data:</span>{" "}
              {new Date(dataISO).toLocaleDateString("pt-PT")}
            </p>
            <p>
              <span className="font-semibold text-yellow-400">Hora:</span> {hora}
            </p>
          </div>

          {!!msg && (
            <div
              className={`mt-5 text-center text-sm font-semibold transition-all duration-300 ${
                msg.startsWith("✅") ? "text-green-400" : "text-red-400"
              }`}
            >
              {msg}
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl font-semibold bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 shadow-md transition transform hover:scale-[1.02]"
            >
              Voltar
            </button>
            <button
              onClick={confirmarAgendamento}
              disabled={salvando}
              className="px-5 py-2.5 rounded-xl font-semibold text-black bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all transform hover:scale-[1.03] disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
