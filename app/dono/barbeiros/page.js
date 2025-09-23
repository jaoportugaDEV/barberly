"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function DonoBarbeirosPage() {
  const [barbearias, setBarbearias] = useState([]);
  const [barbeariaId, setBarbeariaId] = useState("");
  const [barbeiros, setBarbeiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // carregar barbearias do dono
  useEffect(() => {
    (async () => {
      setErr("");
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setErr("Não autenticado.");
        return;
      }

      const { data: barbs, error: barbsErr } = await supabase
        .from("barbearias")
        .select("id, nome")
        .eq("dono_id", user.id);

      if (barbsErr) {
        setErr("Erro ao carregar barbearias.");
        return;
      }

      setBarbearias(barbs || []);

      if (barbs?.length === 1) {
        setBarbeariaId(barbs[0].id); // seleciona automático
      }
    })();
  }, []);

  // carregar barbeiros quando a barbearia for escolhida
  useEffect(() => {
    if (!barbeariaId) return;
    (async () => {
      setLoading(true);
      setErr("");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, phone")
        .eq("barbearia_id", barbeariaId)
        .eq("role", "barber");

      if (error) {
        setErr("Erro ao carregar barbeiros.");
        setLoading(false);
        return;
      }

      setBarbeiros(data || []);
      setLoading(false);
    })();
  }, [barbeariaId]);

  if (err) return <p className="text-red-400">{err}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">Barbeiros</h1>

      {/* Se tiver mais de uma barbearia, mostra select */}
      {barbearias.length > 1 && (
        <div className="mb-6">
          <label className="text-white font-semibold mr-3">Selecione a barbearia:</label>
          <select
            value={barbeariaId}
            onChange={(e) => setBarbeariaId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            <option value="">-- Escolha --</option>
            {barbearias.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Se não tiver nenhuma barbearia */}
      {barbearias.length === 0 && (
        <p className="text-gray-400">Você ainda não cadastrou nenhuma barbearia.</p>
      )}

      {/* Enquanto carrega */}
      {loading && barbeariaId && <p className="text-gray-400">Carregando barbeiros...</p>}

      {/* Se já tem barbearia selecionada */}
      {!loading && barbeariaId && (
        <div className="space-y-3">
          {barbeiros.length === 0 ? (
            <p className="text-gray-400">Nenhum barbeiro cadastrado.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-2">Nome</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Telefone</th>
                </tr>
              </thead>
              <tbody>
                {barbeiros.map((b) => (
                  <tr key={b.id} className="border-b border-gray-700">
                    <td className="p-2">{b.name}</td>
                    <td className="p-2">{b.email}</td>
                    <td className="p-2">{b.phone || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}