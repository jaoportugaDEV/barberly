"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function DonoDashboard() {
  const [barbearias, setBarbearias] = useState([]);
  const [serviceMap, setServiceMap] = useState({});
  const [profileMap, setProfileMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split("T")[0]
  );

  // paginação por barbearia
  const [currentPages, setCurrentPages] = useState({});
  const itemsPerPage = 8;
  
  const getCurrentPage = (barbeariaId) => currentPages[barbeariaId] || 1;
  const setCurrentPage = (barbeariaId, page) => {
    setCurrentPages((prev) => ({ ...prev, [barbeariaId]: page }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErr("");
      setCurrentPages({});

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        setErr("Não autenticado.");
        setLoading(false);
        return;
      }
      const user = authData.user;

      // 🔹 Busca barbearias do dono
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
      const allUserIds = new Set();

      for (const barb of barbs) {
        const inicioDia = new Date(`${dataSelecionada}T00:00:00`).toISOString();
        const fimDia = new Date(`${dataSelecionada}T23:59:59`).toISOString();

        const { data: agendamentos } = await supabase
          .from("appointments")
          .select("id, starts_at, status, service_id, user_id, barber_id")
          .eq("barbearia_id", barb.id)
          .gte("starts_at", inicioDia)
          .lte("starts_at", fimDia)
          .order("starts_at", { ascending: true });

        (agendamentos || []).forEach((a) => {
          if (a.service_id) allServiceIds.add(a.service_id);
          if (a.user_id) allUserIds.add(a.user_id);
          else if (a.barber_id) allUserIds.add(a.barber_id); // compatibilidade
        });

        let totalGanhos = 0;
        let servicosFeitos = 0;

        (agendamentos || []).forEach((a) => {
          if (a.status === "concluido") servicosFeitos++;
        });

        results.push({
          ...barb,
          agendamentos: agendamentos || [],
          financeiro: { totalGanhos, servicosFeitos },
        });
      }

      // 🔹 Mapear serviços
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
            if (a.status === "concluido" && map[a.service_id]) {
              total += map[a.service_id].price || 0;
            }
          });
          r.financeiro.totalGanhos = total;
        });
      } else setServiceMap({});

      // 🔹 Mapear barbeiros (usando user_id)
      if (allUserIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", Array.from(allUserIds));

        const map = {};
        (profiles || []).forEach((p) => (map[p.id] = p.name));
        setProfileMap(map);
      } else setProfileMap({});

      setBarbearias(results);
      setLoading(false);
    };

    fetchData();
  }, [dataSelecionada]);

  function mudarDia(direcao) {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() + direcao);
    setDataSelecionada(novaData.toISOString().split("T")[0]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
          <p className="text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }
  if (err) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400">
        {err}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-2">
          Dashboard do Dono
        </h1>
        <p className="text-gray-400 text-sm lg:text-base">
          Visão geral das suas barbearias e agendamentos
        </p>
      </div>

      {/* Controles de data */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 lg:p-6 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4">
          <button
            onClick={() => mudarDia(-1)}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Dia anterior"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center bg-gray-800/80 text-white rounded-lg px-4 py-2.5 border border-gray-700 flex-1 max-w-xs">
            <Calendar className="w-5 h-5 mr-2 text-yellow-400 flex-shrink-0" />
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="bg-transparent outline-none text-white w-full text-sm lg:text-base"
            />
          </div>

          <button
            onClick={() => mudarDia(1)}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Próximo dia"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        <p className="text-gray-400 text-sm lg:text-base text-center sm:text-left">
          Exibindo agendamentos de{" "}
          <span className="text-yellow-400 font-semibold">
            {new Date(dataSelecionada).toLocaleDateString("pt-PT", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </p>
      </div>

      {barbearias.length === 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-lg">
            Você ainda não tem barbearias cadastradas.
          </p>
        </div>
      )}

      <div className="space-y-6 lg:space-y-8">
        {barbearias.map((b) => {
          const currentPage = getCurrentPage(b.id);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const paginatedAgendamentos = b.agendamentos.slice(
            startIndex,
            startIndex + itemsPerPage
          );
          const totalPages = Math.ceil(b.agendamentos.length / itemsPerPage);

          return (
            <div
              key={b.id}
              className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-4 lg:p-6 rounded-xl border border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full"></div>
                <h2 className="text-xl lg:text-2xl font-bold text-white">
                  {b.nome}
                </h2>
              </div>

              {/* Resumo financeiro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                  <h3 className="text-sm lg:text-base font-semibold mb-2 opacity-90">
                    Ganhos (€)
                  </h3>
                  <p className="text-2xl lg:text-3xl font-bold">
                    €{b.financeiro.totalGanhos.toFixed(2)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                  <h3 className="text-sm lg:text-base font-semibold mb-2 opacity-90">
                    Serviços feitos
                  </h3>
                  <p className="text-2xl lg:text-3xl font-bold">
                    {b.financeiro.servicosFeitos}
                  </p>
                </div>
              </div>

              {/* Agendamentos */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-500" />
                  Agendamentos ({b.agendamentos.length})
                </h3>
              </div>
              {b.agendamentos.length === 0 ? (
                <div className="bg-gray-800/50 rounded-lg p-6 text-center border border-gray-800">
                  <p className="text-gray-400">Nenhum agendamento para este dia.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="p-3 text-gray-400 font-semibold text-sm">
                            Hora
                          </th>
                          <th className="p-3 text-gray-400 font-semibold text-sm">
                            Status
                          </th>
                          <th className="p-3 text-gray-400 font-semibold text-sm">
                            Barbeiro
                          </th>
                          <th className="p-3 text-gray-400 font-semibold text-sm">
                            Serviço
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAgendamentos.map((a) => (
                          <tr
                            key={a.id}
                            className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="p-3 text-white font-medium">
                              {new Date(a.starts_at).toLocaleTimeString("pt-PT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  a.status === "concluido"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                }`}
                              >
                                {a.status === "scheduled"
                                  ? "Agendado"
                                  : a.status === "concluido"
                                  ? "Concluído"
                                  : a.status}
                              </span>
                            </td>
                            <td className="p-3 text-gray-300">
                              {profileMap[a.user_id] ||
                                profileMap[a.barber_id] ||
                                "—"}
                            </td>
                            <td className="p-3 text-gray-300">
                              <div>
                                <div className="font-medium text-white">
                                  {serviceMap[a.service_id]?.name || "—"}
                                </div>
                                {serviceMap[a.service_id]?.price && (
                                  <div className="text-sm text-yellow-400">
                                    €{serviceMap[a.service_id].price}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-3">
                    {paginatedAgendamentos.map((a) => (
                      <div
                        key={a.id}
                        className="bg-gray-800/50 border border-gray-800 rounded-lg p-4 hover:border-yellow-600/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-yellow-500" />
                            <span className="text-white font-semibold">
                              {new Date(a.starts_at).toLocaleTimeString("pt-PT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              a.status === "concluido"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            }`}
                          >
                            {a.status === "scheduled"
                              ? "Agendado"
                              : a.status === "concluido"
                              ? "Concluído"
                              : a.status}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-gray-400 text-xs">Barbeiro:</span>
                            <p className="text-white font-medium">
                              {profileMap[a.user_id] ||
                                profileMap[a.barber_id] ||
                                "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">Serviço:</span>
                            <p className="text-white font-medium">
                              {serviceMap[a.service_id]?.name || "—"}
                            </p>
                            {serviceMap[a.service_id]?.price && (
                              <p className="text-yellow-400 text-sm font-semibold">
                                €{serviceMap[a.service_id].price}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex justify-center sm:justify-end items-center gap-4 mt-6 pt-4 border-t border-gray-800">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(b.id, currentPage - 1)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      <span className="text-gray-300 text-sm font-medium min-w-[100px] text-center">
                        Página {currentPage} de {totalPages}
                      </span>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(b.id, currentPage + 1)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95"
                        aria-label="Próxima página"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
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
