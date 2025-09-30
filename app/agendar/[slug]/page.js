"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function AgendarPage() {
  const { slug } = useParams();

  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);

  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState(null);
  const [dataHora, setDataHora] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  const [statusMsg, setStatusMsg] = useState("");

  // Buscar dados da barbearia
  useEffect(() => {
    async function fetchData() {
      const { data: barb } = await supabase
        .from("barbearias")
        .select("id, nome, endereco, telefone, cidade")
        .eq("slug", slug)
        .single();

      if (barb) {
        setBarbearia(barb);

        const { data: servicosData } = await supabase
          .from("services")
          .select("id, nome, preco, duracao")
          .eq("barbearia_id", barb.id);

        setServicos(servicosData || []);

        const { data: barbeirosData } = await supabase
          .from("barbearia_barbers")
          .select("id, nome, foto_url")
          .eq("barbearia_id", barb.id);

        setBarbeiros(barbeirosData || []);
      }
    }

    if (slug) fetchData();
  }, [slug]);

  // Criar agendamento
  async function handleConfirmar(e) {
    e.preventDefault();
    setStatusMsg("");

    try {
      // Upsert cliente
      const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .upsert(
          {
            nome,
            telefone,
            email,
            barbearia_id: barbearia.id,
          },
          { onConflict: "telefone" }
        )
        .select()
        .single();

      if (clienteError) throw clienteError;

      // Criar agendamento
      const { error: agendamentoError } = await supabase
        .from("appointments")
        .insert([
          {
            cliente_id: cliente.uid,
            barber_id: barbeiroSelecionado?.id || null,
            service_id: servicoSelecionado.id,
            barbearia_id: barbearia.id,
            starts_at: dataHora,
            status: "confirmado",
          },
        ]);

      if (agendamentoError) throw agendamentoError;

      setStatusMsg("✅ Agendamento criado com sucesso!");
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ Erro ao criar agendamento.");
    }
  }

  if (!barbearia) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Carregando barbearia...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold">{barbearia.nome}</h1>
        <p className="text-gray-600">
          {barbearia.endereco}, {barbearia.cidade}
        </p>
        <p className="text-gray-500">{barbearia.telefone}</p>
      </header>

      {/* Passo 1 - Serviço */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Escolha um serviço</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => setServicoSelecionado(s)}
              className={`p-4 rounded-lg border transition ${
                servicoSelecionado?.id === s.id
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-white"
              }`}
            >
              <h3 className="font-bold">{s.nome}</h3>
              <p className="text-sm text-gray-600">
                {s.duracao} min — €{s.preco}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Passo 2 - Barbeiro */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Escolha um barbeiro</h2>
        <div className="flex gap-4 overflow-x-auto">
          <button
            onClick={() => setBarbeiroSelecionado(null)}
            className={`flex flex-col items-center p-3 rounded-lg border ${
              !barbeiroSelecionado
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-white"
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center text-white">
              ?
            </div>
            <p className="mt-2 text-sm">Qualquer</p>
          </button>

          {barbeiros.map((b) => (
            <button
              key={b.id}
              onClick={() => setBarbeiroSelecionado(b)}
              className={`flex flex-col items-center p-3 rounded-lg border ${
                barbeiroSelecionado?.id === b.id
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-white"
              }`}
            >
              {b.foto_url ? (
                <img
                  src={b.foto_url}
                  alt={b.nome}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-400" />
              )}
              <p className="mt-2 text-sm">{b.nome}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Passo 3 - Data e Hora */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Escolha um horário</h2>
        <input
          type="datetime-local"
          value={dataHora}
          onChange={(e) => setDataHora(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </section>

      {/* Passo 4 - Dados Cliente */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Seus dados</h2>
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="border p-2 rounded w-full mb-2"
          required
        />
        <input
          type="text"
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="border p-2 rounded w-full mb-2"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
      </section>

      {/* Botão Confirmar */}
      <button
        onClick={handleConfirmar}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
      >
        Confirmar Agendamento
      </button>

      {statusMsg && (
        <p className="mt-4 text-center font-medium">{statusMsg}</p>
      )}
    </div>
  );
}
