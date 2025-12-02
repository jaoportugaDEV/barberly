"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";

export default function EscolherColaboradorPage() {
  const { slug, id } = useParams(); // slug = barbearia, id = serviço
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [barbearia, setBarbearia] = useState(null);
  const [colaboradores, setColaboradores] = useState([]);
  const [erro, setErro] = useState("");
  const [userId, setUserId] = useState(null);

  // 🔹 Obter usuário autenticado
  useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setUserId(authData.user.id);
        console.log("🧠 Dono/usuário logado:", authData.user.id);
      }
    })();
  }, []);

  // 🔹 Carregar colaboradores
  useEffect(() => {
    if (!slug || !id) return;

    (async () => {
      setLoading(true);
      setErro("");

      try {
        // 🔹 Buscar barbearia pelo slug
        const { data: barb, error: errBarb } = await supabase
          .from("barbearias")
          .select("id, nome")
          .eq("slug", slug)
          .single();

        if (errBarb || !barb) {
          setErro("Não foi possível carregar a barbearia.");
          setLoading(false);
          return;
        }
        setBarbearia(barb);

        // 🔹 Buscar todos os colaboradores válidos
        const { data: perfis, error: errPerfis } = await supabase
          .from("profiles")
          .select("id, name, foto_url, role, is_colaborador, barbearia_id")
          .eq("barbearia_id", barb.id)
          .or("role.eq.barber,and(role.eq.owner,is_colaborador.eq.true)")
          .order("name", { ascending: true });

        if (errPerfis) {
          console.error(errPerfis);
          setErro("Erro ao carregar colaboradores.");
          setLoading(false);
          return;
        }

        // 🔹 Elimina duplicações (caso o dono apareça 2x)
        const idsUsados = new Set();
        const perfisFiltrados = [];
        for (const p of perfis || []) {
          if (!idsUsados.has(p.id)) {
            idsUsados.add(p.id);
            perfisFiltrados.push(p);
          }
        }

        // 🔹 Substitui a foto do dono (owner logado) pela versão mais recente
        const perfisAjustados = perfisFiltrados.map((p) => {
          if (p.id === userId) {
            // força recarregar imagem mais recente direto do banco
            return { ...p, foto_url: p.foto_url || "" };
          }
          return p;
        });

        setColaboradores(perfisAjustados);
      } catch (e) {
        console.error(e);
        setErro("Erro inesperado ao carregar colaboradores.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, id, userId]);

  // 🔹 Redireciona para o colaborador escolhido
  const handleEscolha = (colabId) => {
    if (colabId === "qualquer") {
      router.push(`/barbearia/${slug}/servicos/${id}/colaboradores/any/horarios`);
    } else {
      router.push(`/barbearia/${slug}/servicos/${id}/colaboradores/${colabId}/horarios`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-black text-white font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 sm:gap-4 mb-6">
            <Link
              href={`/barbearia/${slug}/servicos`}
              className="text-gray-400 hover:text-yellow-500 transition-colors flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm sm:text-base">Voltar</span>
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent leading-tight">
            {barbearia?.nome
              ? `Escolher colaborador — ${barbearia.nome}`
              : "Escolher colaborador"}
          </h1>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-12 w-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">Carregando colaboradores…</p>
            </div>
          </div>
        )}
        {!!erro && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
            <p className="text-red-400 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {erro}
            </p>
          </div>
        )}

        {!loading && !erro && (
          <div className="space-y-4 sm:space-y-5">
            <button
              onClick={() => handleEscolha("qualquer")}
              className="w-full group relative overflow-hidden bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xl sm:text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors mb-1">
                    Qualquer colaborador
                  </p>
                  <p className="text-sm sm:text-base text-gray-400">
                    Escolha qualquer profissional disponível
                  </p>
                </div>
                <svg className="w-6 h-6 text-gray-400 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/10 transition-colors"></div>
            </button>

            {colaboradores.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/10 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-400 text-lg">Nenhum colaborador cadastrado.</p>
              </div>
            ) : (
              colaboradores.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleEscolha(c.id)}
                  className="w-full group relative overflow-hidden bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                    <div className="relative">
                      <img
                        src={
                          c.foto_url ||
                          "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
                        }
                        alt={c.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-yellow-500/50 group-hover:border-yellow-500 group-hover:scale-110 transition-all shadow-lg"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-neutral-900"></div>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xl sm:text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors capitalize mb-1">
                        {c.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base text-gray-400">
                          {c.role === "owner" ? "Dono (colaborador)" : "Barbeiro"}
                        </span>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/10 transition-colors"></div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
