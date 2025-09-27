"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function DonoDashboard() {
  const [barbearias, setBarbearias] = useState([]);
  const [serviceMap, setServiceMap] = useState({});
  const [profileMap, setProfileMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        const { data: agendamentos } = await supabase
          .from("appointments")
          .select("id, starts_at, status, service_id, barber_id")
          .eq("barbearia_id", barb.id)
          .order("starts_at", { ascending: true });

        (agendamentos || []).forEach((a) => {
          if (a.service_id) allServiceIds.add(a.service_id);
          if (a.barber_id) allBarberIds.add(a.barber_id);
        });

        let totalGanhos = 0;
        let servicosFeitos = 0;

        (agendamentos || []).forEach((a) => {
          if (a.status === "confirmado" || a.status === "concluido") {
            servicosFeitos++;
          }
        });

        results.push({
          ...barb,
          agendamentos: agendamentos || [],
          financeiro: { totalGanhos, servicosFeitos },
        });
      }

      if (allServiceIds.size > 0) {
        const { data: services } = await supabase
          .from("services")
          .select("id, name, price")
          .in("id", Array.from(allServiceIds));
        const map = {};
        (services || []).forEach(
          (s) => (map[s.id] = { name: s.name, price: s.price })
        );
        setServiceMap(map);

        results.forEach((r) => {
          let total = 0;
          r.agendamentos.forEach((a) => {
            if (
              (a.status === "confirmado" || a.status === "concluido") &&
              map[a.service_id]
            ) {
              total += map[a.service_id].price || 0;
            }
          });
          r.financeiro.totalGanhos = total;
        });
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

      {barbearias.length === 0 && (
        <p className="text-gray-400">
          Você ainda não tem barbearias cadastradas.
        </p>
      )}

      <div className="space-y-8">
        {barbearias.map((b) => {
          const startIndex = (currentPage - 1) * itemsPerPage;
          const paginatedAgendamentos = b.agendamentos.slice(
            startIndex,
            startIndex + itemsPerPage
          );
          const totalPages = Math.ceil(b.agendamentos.length / itemsPerPage);

          return (
            <div
              key={b.id}
              className="bg-gray-900 p-6 rounded-lg border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4">{b.nome}</h2>

              {/* Resumo financeiro */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-600 text-white p-4 rounded-lg shadow">
                  <h3 className="font-bold">Ganhos (€)</h3>
                  <p className="text-3xl font-bold">
                    €{b.financeiro.totalGanhos}
                  </p>
                </div>
                <div className="bg-green-600 text-white p-4 rounded-lg shadow">
                  <h3 className="font-bold">Serviços feitos</h3>
                  <p className="text-3xl font-bold">
                    {b.financeiro.servicosFeitos}
                  </p>
                </div>
              </div>

              {/* Agendamentos */}
              <h3 className="text-lg font-bold text-white mb-2">Agendamentos</h3>
              {b.agendamentos.length === 0 ? (
                <p className="text-gray-400">Nenhum agendamento.</p>
              ) : (
                <>
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
                      {paginatedAgendamentos.map((a) => (
                        <tr key={a.id} className="border-b border-gray-700">
                          <td className="p-2">
                            {new Date(a.starts_at).toLocaleString("pt-PT")}
                          </td>
                          <td className="p-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                a.status === "concluido"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : a.status === "pendente"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : a.status === "confirmado"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="p-2">
                            {profileMap[a.barber_id] || a.barber_id || "—"}
                          </td>
                          <td className="p-2">
                            {serviceMap[a.service_id]?.name || a.service_id || "—"}
                            {serviceMap[a.service_id]?.price
                              ? ` (€${serviceMap[a.service_id]?.price})`
                              : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex justify-end items-center gap-4 mt-4">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                      >
                        ◀ Anterior
                      </button>
                      <span className="text-gray-300">
                        Página {currentPage} de {totalPages}
                      </span>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                      >
                        Próximo ▶
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
