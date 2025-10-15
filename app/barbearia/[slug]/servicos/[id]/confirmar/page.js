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

      // Buscar barbearia
      const { data: barb } = await supabase
        .from("barbearias")
        .select("id, nome")
        .eq("slug", slug)
        .single();

      // Buscar serviço
      const { data: serv } = await supabase
        .from("services")
        .select("id, name, price, duration_minutes")
        .eq("id", serviceId)
        .single();

      // Buscar colaborador (se não for "any")
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
      }, 1500);
    } catch (err) {
      console.error(err);
      setMsg("❌ Erro ao confirmar o agendamento!");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <p className="p-6 text-gray-400">Carregando...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
      <div className="bg-neutral-900 border border-yellow-600 rounded-2xl p-8 w-[400px] shadow-lg">
        <h1 className="text-2xl font-bold text-yellow-500 mb-4 text-center">
          Confirmar Agendamento
        </h1>

        <div className="space-y-2 text-gray-300">
          <p><b>Cliente:</b> {nomeCliente}</p>
          <p><b>Telefone:</b> {telefoneCliente}</p>
          <p><b>Serviço:</b> {servico?.name}</p>
          <p><b>Valor:</b> € {servico?.price}</p>
          <p><b>Duração:</b> {servico?.duration_minutes} min</p>
          <p><b>Colaborador:</b> {colaborador ? colaborador.name : "Qualquer"}</p>
          <p><b>Data:</b> {new Date(dataISO).toLocaleDateString("pt-PT")}</p>
          <p><b>Hora:</b> {hora}</p>
        </div>

        {!!msg && (
          <p
            className={`mt-4 text-center font-semibold ${
              msg.startsWith("✅") ? "text-green-400" : "text-red-400"
            }`}
          >
            {msg}
          </p>
        )}

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Voltar
          </button>
          <button
            onClick={confirmarAgendamento}
            disabled={salvando}
            className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-700 text-black font-semibold transition disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
