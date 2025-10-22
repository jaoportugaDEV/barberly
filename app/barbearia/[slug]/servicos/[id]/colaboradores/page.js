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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/barbearia/${slug}/servicos`}
            className="text-gray-300 hover:text-white"
          >
            ← Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-yellow-500">
            {barbearia?.nome
              ? `Escolher colaborador — ${barbearia.nome}`
              : "Escolher colaborador"}
          </h1>
        </div>

        {/* Estados */}
        {loading && <p className="text-gray-400">Carregando colaboradores…</p>}
        {!!erro && <p className="text-red-400">{erro}</p>}

        {!loading && !erro && (
          <div className="space-y-3">
            {/* Qualquer colaborador */}
            <button
              onClick={() => handleEscolha("qualquer")}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition"
            >
              <img
                src="/placeholder.png"
                alt="Qualquer"
                className="w-12 h-12 rounded-full object-cover"
              />
              <span className="font-medium">Qualquer colaborador</span>
            </button>

            {/* Lista de colaboradores */}
            {colaboradores.length === 0 ? (
              <p className="text-gray-400">Nenhum colaborador cadastrado.</p>
            ) : (
              colaboradores.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleEscolha(c.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition"
                >
                  <img
                    src={
                      c.foto_url ||
                      "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
                    }
                    alt={c.name}
                    className="w-12 h-12 rounded-full object-cover border border-yellow-600"
                  />
                  <div>
                    <p className="font-medium capitalize">{c.name}</p>
                    <p className="text-sm text-gray-400 italic">
                      {c.role === "owner" ? "Dono (colaborador)" : "Barbeiro"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
