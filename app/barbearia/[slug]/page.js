"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function BarbeariaPublicPage() {
  const params = useParams();
  const slug = params.slug;
  const [barbearia, setBarbearia] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [tab, setTab] = useState("pessoas");

  // Buscar barbearia
  const fetchBarbearia = async () => {
    const { data, error } = await supabase
      .from("barbearias")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!error && data) {
      setBarbearia(data);
      fetchFotos(data.id);
      fetchBarbeiros(data.id);
    }
  };

  // Buscar fotos
  const fetchFotos = async (barbeariaId) => {
    const { data, error } = await supabase
      .from("barbearia_fotos")
      .select("id, url")
      .eq("barbearia_id", barbeariaId)
      .order("created_at", { ascending: false });

    if (!error) setFotos(data || []);
  };

  // Buscar barbeiros
  const fetchBarbeiros = async (barbeariaId) => {
    const { data, error } = await supabase
      .from("barbeiros")
      .select("id, nome, foto_url")
      .eq("barbearia_id", barbeariaId)
      .order("nome", { ascending: true });

    if (!error) setBarbeiros(data || []);
  };

  useEffect(() => {
    if (slug) fetchBarbearia();
  }, [slug]);

  if (!barbearia) return <p className="p-6 text-gray-400">Carregando...</p>;

  return (
    <div className="text-white max-w-6xl mx-auto">
      {/* GALERIA NO TOPO */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 h-[400px] rounded-lg overflow-hidden">
          <div className="col-span-2 row-span-2">
            <img
              src={fotos[0].url}
              alt="Foto principal"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightbox(fotos[0].url)}
            />
          </div>
          {fotos.slice(1, 5).map((foto) => (
            <div key={foto.id}>
              <img
                src={foto.url}
                alt="Foto da barbearia"
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightbox(foto.url)}
              />
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Foto ampliada"
            className="max-w-[95%] max-h-[95%] object-contain rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* CARD INFERIOR */}
      <div className="mt-6 p-6 bg-gray-900 rounded-lg shadow-lg border border-gray-800">
        <h1 className="text-3xl font-bold">{barbearia.nome}</h1>
        <p className="text-gray-300">
          {barbearia.endereco}, {barbearia.cidade}
        </p>
        <p className="text-gray-400">{barbearia.telefone}</p>
        <p className="text-green-400 mt-1">
          {barbearia.horario ? `Aberto até ${barbearia.horario}` : "Horário não informado"}
        </p>

        {/* Botões */}
        <div className="flex space-x-4 mt-4">
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold">
            Marcar
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold">
            Favorito
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold">
            Mais
          </button>
        </div>
      </div>

      {/* ABAS */}
      <div className="mt-8 border-b border-gray-700 flex space-x-6">
        <button
          onClick={() => setTab("pessoas")}
          className={`pb-2 ${
            tab === "pessoas"
              ? "border-b-2 border-yellow-500 text-yellow-500"
              : "text-gray-400"
          }`}
        >
          Pessoas
        </button>
        <button
          onClick={() => setTab("sobre")}
          className={`pb-2 ${
            tab === "sobre"
              ? "border-b-2 border-yellow-500 text-yellow-500"
              : "text-gray-400"
          }`}
        >
          Sobre
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="mt-6">
        {tab === "pessoas" && (
          <div>
            <h2 className="text-xl font-semibold text-yellow-500 mb-4">As pessoas</h2>
            {barbeiros.length === 0 ? (
              <p className="text-gray-400">Nenhum barbeiro cadastrado.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {barbeiros.map((barbeiro) => (
                  <div key={barbeiro.id} className="text-center">
                    <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-2 border-gray-700">
                      <img
                        src={barbeiro.foto_url || "/placeholder.png"}
                        alt={barbeiro.nome}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="mt-2 font-medium">{barbeiro.nome}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "sobre" && (
          <div>
            <h2 className="text-xl font-semibold text-yellow-500 mb-4">Sobre</h2>
            <p className="text-gray-300">{barbearia.sobre || "Sem descrição."}</p>

            {barbearia.endereco && (
              <div className="mt-6">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    barbearia.endereco + ", " + barbearia.cidade
                  )}&output=embed`}
                  width="100%"
                  height="300"
                  allowFullScreen=""
                  loading="lazy"
                  className="rounded-lg border border-gray-700"
                ></iframe>
                <p className="mt-2 text-gray-400">
                  {barbearia.endereco}, {barbearia.cidade}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
