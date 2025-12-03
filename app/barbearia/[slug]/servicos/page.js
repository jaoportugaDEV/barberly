"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";

export default function EscolherServicoPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [erro, setErro] = useState("");
  
  // Header scroll state
  const [scrolled, setScrolled] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      setErro("");

      // Buscar barbearia
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

      // Buscar serviços
      const { data: rows, error: errServ } = await supabase
        .from("services")
        .select("id, name, price, duration_minutes")
        .eq("barbearia_id", barb.id)
        .order("name", { ascending: true });

      if (errServ) {
        setErro("Não foi possível carregar os serviços.");
        setLoading(false);
        return;
      }

      setServicos(rows || []);
      setLoading(false);
    })();
  }, [slug]);

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      
      if (currentScroll > lastScroll && currentScroll > 80) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      
      setScrolled(currentScroll > 20);
      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatPrice = (v) => {
    if (v === null || v === undefined) return "—";
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(Number(v));
  };

  const formatDur = (m) => {
    if (!m && m !== 0) return "";
    return `${m} min`;
  };

  // 🚀 Correção: vai para a página de colaboradores
  const goToServico = (id) => {
    router.push(`/barbearia/${slug}/servicos/${id}/colaboradores`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-black text-white font-sans">
      {/* HEADER FIXO */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        } ${
          scrolled
            ? "bg-black/90 backdrop-blur-2xl border-b border-yellow-500/20 shadow-lg shadow-yellow-500/10"
            : "bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-24 sm:h-28 lg:h-32">
            {/* Logo */}
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 sm:gap-3 hover:scale-105 transition-all duration-300 focus:outline-none group"
            >
              <img
                src="/saloniq-logo.png"
                alt="Saloniq"
                className="h-16 sm:h-20 lg:h-28 w-auto drop-shadow-2xl group-hover:drop-shadow-[0_0_30px_rgba(253,184,19,0.5)]"
              />
            </button>
          </div>
        </div>
      </header>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-yellow-500/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 pt-32 sm:pt-36 lg:pt-40">
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 sm:gap-4 mb-6">
            <Link
              href={`/barbearia/${slug}`}
              className="text-gray-400 hover:text-yellow-400 transition-all flex items-center gap-2 group hover:scale-105"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm sm:text-base font-medium">Voltar</span>
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600 bg-clip-text text-transparent leading-tight drop-shadow-lg">
            {barbearia?.nome
              ? `Escolher serviço — ${barbearia.nome}`
              : "Escolher serviço"}
          </h1>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-16 w-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mb-4 drop-shadow-[0_0_20px_rgba(253,184,19,0.5)]"></div>
              <p className="text-gray-300 font-medium">Carregando serviços…</p>
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
        {!loading && !erro && servicos.length === 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/10 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400 text-lg">Nenhum serviço cadastrado.</p>
          </div>
        )}

        {!loading && !erro && servicos.length > 0 && (
          <div className="space-y-4 sm:space-y-5">
            {servicos.map((s) => (
              <button
                key={s.id}
                onClick={() => goToServico(s.id)}
                className="w-full text-left group relative overflow-hidden bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl hover:border-yellow-500/60 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 transform hover:scale-[1.03]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-yellow-500/50 transition-all"></div>
                      <p className="text-xl sm:text-2xl font-black text-white group-hover:text-yellow-400 transition-colors">
                        {s.name}
                      </p>
                    </div>
                    {formatDur(s.duration_minutes) && (
                      <div className="flex items-center gap-2 text-gray-400 mt-2 group-hover:text-gray-300 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm sm:text-base font-medium">{formatDur(s.duration_minutes)}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right sm:text-left sm:ml-4">
                    <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent drop-shadow-lg">
                      {formatPrice(s.price)}
                    </p>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-all duration-300"></div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
