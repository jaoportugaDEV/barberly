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
      .from("profiles")
      .select("id, name, foto_url")
      .eq("barbearia_id", barbeariaId)
      .eq("role", "barber")
      .order("name", { ascending: true });

    if (!error) setBarbeiros(data || []);
  };

  useEffect(() => {
    if (slug) fetchBarbearia();
  }, [slug]);

  if (!barbearia) return <p className="p-6 text-gray-400">Carregando...</p>;

  return (
    <div className="text-white bg-black min-h-screen font-sans">
      {/* adiciona espaçamento no topo e no rodapé */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        
        {/* GALERIA ESTILO NOONA */}
        {fotos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 h-[400px] rounded-xl overflow-hidden">
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
              className="max-w-[90%] max-h-[90%] object-contain rounded-lg"
            />
          </div>
        )}

        {/* CARD PRINCIPAL */}
        <div className="mt-8 flex items-center justify-between p-6 bg-neutral-900 rounded-xl border border-neutral-800 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold">{barbearia.nome}</h1>
            <p className="text-gray-300 mt-1">
              {barbearia.endereco}, {barbearia.cidade}
            </p>
            <p className="text-gray-400">{barbearia.telefone}</p>
            <p className="text-green-400 mt-1 font-medium">
              {barbearia.horario
                ? `Aberto até ${barbearia.horario}`
                : "Horário não informado"}
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-semibold shadow-md transition">
              Marcar
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg font-semibold shadow-md transition">
              Favorito
            </button>
            <button className="bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-lg font-semibold shadow-md transition">
              Mais
            </button>
          </div>
        </div>

        {/* TABS (link âncora) */}
        <div className="flex space-x-8 mt-10 border-b border-neutral-800 pb-2 text-lg">
          <a href="#pessoas" className="hover:text-yellow-500">
            Pessoas
          </a>
          <a href="#sobre" className="hover:text-yellow-500">
            Sobre
          </a>
        </div>

        {/* SEÇÃO PESSOAS */}
        <div id="pessoas" className="mt-10">
          <h2 className="text-2xl font-bold text-yellow-500 mb-6">
            Nossa Equipe
          </h2>
          {barbeiros.length === 0 ? (
            <p className="text-gray-400">Nenhum barbeiro cadastrado.</p>
          ) : (
            <div className="flex flex-wrap gap-6">
              {barbeiros.map((barbeiro) => (
                <div
                  key={barbeiro.id}
                  className="text-center transition-transform hover:scale-105"
                >
                  <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border border-gray-700 shadow-md">
                    <img
                      src={barbeiro.foto_url || "/placeholder.png"}
                      alt={barbeiro.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="mt-2 font-medium">{barbeiro.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEÇÃO SOBRE */}
        <div id="sobre" className="mt-12">
          <h2 className="text-2xl font-bold text-yellow-500 mb-4">Sobre</h2>

          <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow-lg flex flex-col md:flex-row gap-6">
            {/* Texto / Instagram */}
            <div className="flex-1 text-gray-300">
              {barbearia.sobre ? (
                <p className="whitespace-pre-line">{barbearia.sobre}</p>
              ) : (
                <p>Sem descrição.</p>
              )}

              {barbearia.instagram && (
                <p className="mt-3 text-sm text-gray-400">
                  Instagram:{" "}
                  <a
                    href={barbearia.instagram}
                    target="_blank"
                    className="text-blue-400 hover:underline"
                  >
                    {barbearia.instagram}
                  </a>
                </p>
              )}
            </div>

            {/* Imagem de ajuda + link discreto */}
            <div className="flex-1">
              {barbearia.ajuda_foto_url && (
                <div>
                  <img
                    src={barbearia.ajuda_foto_url}
                    alt="Foto de ajuda"
                    className="w-full max-h-[180px] object-cover rounded-lg shadow-md"
                  />
                  {barbearia.maps_url && (
                    <a
                      href={barbearia.maps_url}
                      target="_blank"
                      className="text-blue-400 text-sm hover:underline flex items-center gap-1 mt-2"
                    >
                      Instruções <span>📍</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
