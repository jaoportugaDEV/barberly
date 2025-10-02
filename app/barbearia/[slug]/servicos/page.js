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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* topo */}
        <div className="flex items-center gap-3 mb-10">
          <Link
            href={`/barbearia/${slug}`}
            className="text-gray-400 hover:text-white transition"
          >
            ← Voltar
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            {barbearia?.nome
              ? `Escolher serviço — ${barbearia.nome}`
              : "Escolher serviço"}
          </h1>
        </div>

        {/* estados */}
        {loading && <p className="text-gray-400">Carregando serviços…</p>}
        {!!erro && <p className="text-red-400">{erro}</p>}
        {!loading && !erro && servicos.length === 0 && (
          <p className="text-gray-400">Nenhum serviço cadastrado.</p>
        )}

        {/* lista de serviços */}
        {!loading && !erro && servicos.length > 0 && (
          <div className="space-y-5">
            {servicos.map((s) => (
              <button
                key={s.id}
                onClick={() => goToServico(s.id)}
                className="w-full text-left px-6 py-5 
                  rounded-2xl shadow-lg 
                  bg-white/5 backdrop-blur-md border border-white/10
                  hover:bg-white/10 hover:shadow-yellow-500/30
                  transition flex items-center justify-between"
              >
                <div>
                  <p className="text-lg font-semibold">{s.name}</p>
                  <p className="text-sm text-gray-400">
                    {formatDur(s.duration_minutes)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-yellow-400">
                    {formatPrice(s.price)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
