"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function DonoDashboard() {
  const [barbearias, setBarbearias] = useState([]);
  const [serviceMap, setServiceMap] = useState({});
  const [profileMap, setProfileMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // --- ESTADO PARA CRIAÇÃO DE BARBEIRO ---
  const [barbsSelect, setBarbsSelect] = useState([]);
  const [selBarbId, setSelBarbId] = useState("");
  const [bName, setBName] = useState("");
  const [bPhone, setBPhone] = useState("");
  const [bEmail, setBEmail] = useState("");
  const [bPass, setBPass] = useState("");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");

  // carregar barbearias para select
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: barbs } = await supabase
        .from("barbearias")
        .select("id, nome")
        .eq("dono_id", user.id);
      setBarbsSelect(barbs || []);
      if ((barbs || []).length && !selBarbId) {
        setSelBarbId(barbs[0].id);
      }
    })();
  }, []);

  // handler de criação de barbeiro
  const handleCreateBarber = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!selBarbId || !bName || !bEmail || !bPass) {
      setMsg("Preencha barbearia, nome, e-mail e senha.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/create-barber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barbeariaId: selBarbId,
          name: bName,
          phone: bPhone,
          email: bEmail,
          password: bPass,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao criar barbeiro");

      setMsg("✅ Barbeiro criado com sucesso!");
      setBName("");
      setBPhone("");
      setBEmail("");
      setBPass("");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  // fetch de dados já existente
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErr("");

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        setErr("Não autenticado.");
        setLoading(false);
        return;
      }
      const user = authData.user;

      const { data: barbs, error: barbsErr } = await supabase
        .from("barbearias")
        .select("id, nome")
        .eq("dono_id", user.id);

      if (barbsErr) {
        setErr("Erro ao carregar barbearias.");
        setLoading(false);
        return;
      }

      if (!barbs || barbs.length === 0) {
        setBarbearias([]);
        setLoading(false);
        return;
      }

      const results = [];
      const allServiceIds = new Set();
      const allBarberIds = new Set();

      for (const barb of barbs) {
        const { data: clientes, error: cliErr } = await supabase
          .from("clientes")
          .select("id, nome, telefone, email, created_at")
          .eq("barbearia_id", barb.id);

        if (cliErr) {
          setErr("Erro ao carregar clientes.");
          setLoading(false);
          return;
        }

        const { data: agendamentos, error: agErr } = await supabase
          .from("appointments")
          .select("id, starts_at, status, service_id, barber_id")
          .eq("barbearia_id", barb.id)
          .order("starts_at", { ascending: true });

        if (agErr) {
          setErr("Erro ao carregar agendamentos.");
          setLoading(false);
          return;
        }

        (agendamentos || []).forEach((a) => {
          if (a.service_id) allServiceIds.add(a.service_id);
          if (a.barber_id) allBarberIds.add(a.barber_id);
        });

        let entradas = 0;
        let saidas = 0;
        (agendamentos || []).forEach((a) => {
          if (a.status === "confirmado") entradas += 1;
          if (a.status === "cancelado") saidas += 1;
        });

        results.push({
          ...barb,
          clientes: clientes || [],
          agendamentos: agendamentos || [],
          financeiro: { entradas, saidas, saldo: entradas - saidas },
        });
      }

      if (allServiceIds.size > 0) {
        const { data: services } = await supabase
          .from("services")
          .select("id, name")
          .in("id", Array.from(allServiceIds));
        const map = {};
        (services || []).forEach((s) => (map[s.id] = s.name));
        setServiceMap(map);
      } else setServiceMap({});

      if (allBarberIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", Array.from(allBarberIds));
        const map = {};
        (profiles || []).forEach((p) => (map[p.id] = p.name));
        setProfileMap(map);
      } else setProfileMap({});

      setBarbearias(results);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <p className="text-gray-400">Carregando dados...</p>;
  if (err) return <p className="text-red-400">{err}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">
        Dashboard do Dono
      </h1>

      {/* FORMULÁRIO PARA CRIAR BARBEIRO */}
      <div className="mb-8 p-4 bg-gray-900 border border-gray-700 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">
          Criar novo barbeiro
        </h2>

        <form onSubmit={handleCreateBarber} className="grid gap-3 md:grid-cols-5">
          <select
            value={selBarbId}
            onChange={(e) => setSelBarbId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            {barbsSelect.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Nome do barbeiro"
            value={bName}
            onChange={(e) => setBName(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />

          <input
            type="text"
            placeholder="Telefone"
            value={bPhone}
            onChange={(e) => setBPhone(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />

          <input
            type="email"
            placeholder="E-mail"
            value={bEmail}
            onChange={(e) => setBEmail(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />

          <input
            type="password"
            placeholder="Senha"
            value={bPass}
            onChange={(e) => setBPass(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />

          <button
            type="submit"
            disabled={creating}
            className="md:col-span-5 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg mt-2 disabled:opacity-60"
          >
            {creating ? "Criando..." : "Criar barbeiro"}
          </button>
        </form>

        {!!msg && <p className="mt-3 text-sm text-gray-300">{msg}</p>}
      </div>

      {barbearias.length === 0 && (
        <p className="text-gray-400">
          Você ainda não tem barbearias cadastradas.
        </p>
      )}

      <div className="space-y-8">
        {barbearias.map((b) => (
          <div
            key={b.id}
            className="bg-gray-900 p-6 rounded-lg border border-gray-700"
          >
            <h2 className="text-2xl font-bold text-white mb-4">{b.nome}</h2>

            {/* Resumo financeiro */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-green-600 text-white p-4 rounded-lg shadow">
                <h3 className="font-bold">Entradas</h3>
                <p className="text-2xl">{b.financeiro.entradas}</p>
              </div>
              <div className="bg-red-600 text-white p-4 rounded-lg shadow">
                <h3 className="font-bold">Saídas</h3>
                <p className="text-2xl">{b.financeiro.saidas}</p>
              </div>
              <div className="bg-yellow-600 text-white p-4 rounded-lg shadow">
                <h3 className="font-bold">Saldo</h3>
                <p className="text-2xl">{b.financeiro.saldo}</p>
              </div>
            </div>

            {/* Clientes */}
            <h3 className="text-lg font-bold text-white mb-2">Clientes</h3>
            {b.clientes.length === 0 ? (
              <p className="text-gray-400 mb-6">Nenhum cliente ainda.</p>
            ) : (
              <table className="w-full text-left border-collapse mb-6">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2">Nome</th>
                    <th className="p-2">Telefone</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Data Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {b.clientes.map((c) => (
                    <tr key={c.id} className="border-b border-gray-700">
                      <td className="p-2">{c.nome}</td>
                      <td className="p-2">{c.telefone}</td>
                      <td className="p-2">{c.email}</td>
                      <td className="p-2">
                        {new Date(c.created_at).toLocaleDateString("pt-PT")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Agendamentos */}
            <h3 className="text-lg font-bold text-white mb-2">Agendamentos</h3>
            {b.agendamentos.length === 0 ? (
              <p className="text-gray-400">Nenhum agendamento.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2">Data</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Barbeiro</th>
                    <th className="p-2">Serviço</th>
                  </tr>
                </thead>
                <tbody>
                  {b.agendamentos.map((a) => (
                    <tr key={a.id} className="border-b border-gray-700">
                      <td className="p-2">
                        {new Date(a.starts_at).toLocaleString("pt-PT")}
                      </td>
                      <td className="p-2">{a.status}</td>
                      <td className="p-2">
                        {profileMap[a.barber_id] || a.barber_id || "—"}
                      </td>
                      <td className="p-2">
                        {serviceMap[a.service_id] || a.service_id || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
