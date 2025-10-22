"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export default function BarbeariaPublicPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [barbearia, setBarbearia] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [lightbox, setLightbox] = useState(null);

  // Modal de cadastro
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [defaultCountry, setDefaultCountry] = useState("pt");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  const [statusAberto, setStatusAberto] = useState(null);

  // Detectar país do navegador
  useEffect(() => {
    const lang = navigator.language || navigator.userLanguage;
    if (lang.startsWith("pt-BR")) setDefaultCountry("br");
    else if (lang.startsWith("pt")) setDefaultCountry("pt");
    else if (lang.startsWith("es")) setDefaultCountry("es");
    else if (lang.startsWith("fr")) setDefaultCountry("fr");
    else setDefaultCountry("pt");
  }, []);

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
      verificarStatus(data.horario_abertura, data.horario_fechamento);
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

  // Verifica se está aberto agora
  function verificarStatus(horaAbertura, horaFechamento) {
    if (!horaAbertura || !horaFechamento) {
      setStatusAberto("indefinido");
      return;
    }

    const agora = new Date();
    const [hA, mA] = horaAbertura.split(":").map(Number);
    const [hF, mF] = horaFechamento.split(":").map(Number);

    const abertura = new Date();
    abertura.setHours(hA, mA, 0, 0);

    const fechamento = new Date();
    fechamento.setHours(hF, mF, 0, 0);

    if (agora >= abertura && agora <= fechamento) {
      setStatusAberto("aberto");
    } else {
      setStatusAberto("fechado");
    }
  }

  useEffect(() => {
    if (slug) fetchBarbearia();

    const interval = setInterval(() => {
      if (barbearia) {
        verificarStatus(
          barbearia.horario_abertura,
          barbearia.horario_fechamento
        );
      }
    }, 300000);
    return () => clearInterval(interval);
  }, [slug, barbearia]);

  // Salvar cliente
  const handleSalvarCliente = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) {
      setMsg("❌ Preencha todos os campos!");
      return;
    }

    setSalvando(true);
    setMsg("");

    try {
      const { data: existente } = await supabase
        .from("clientes")
        .select("id")
        .eq("telefone", telefone)
        .eq("barbearia_id", barbearia.id)
        .single();

      if (existente) {
        localStorage.setItem("client_name", nome);
        localStorage.setItem("client_phone", telefone);
        setMsg("✅ Cliente já registado! Redirecionando...");
        setTimeout(() => {
          setShowModal(false);
          router.push(`/barbearia/${slug}/servicos`);
        }, 1000);
        return;
      }

      const { error } = await supabase.from("clientes").insert([
        {
          nome,
          telefone,
          barbearia_id: barbearia.id,
        },
      ]);

      if (error) throw error;

      localStorage.setItem("client_name", nome);
      localStorage.setItem("client_phone", telefone);

      setMsg("✅ Dados registados com sucesso!");
      setTimeout(() => {
        setShowModal(false);
        router.push(`/barbearia/${slug}/servicos`);
      }, 1200);
    } catch (err) {
      setMsg("❌ Erro ao guardar os dados!");
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  if (!barbearia)
    return <p className="p-6 text-gray-400">Carregando barbearia...</p>;

  const horarioTexto =
    barbearia.horario_abertura && barbearia.horario_fechamento
      ? `Das ${barbearia.horario_abertura.slice(0, 5)} às ${barbearia.horario_fechamento.slice(0, 5)}`
      : null;

  return (
    <div className="text-white bg-gradient-to-b from-neutral-950 via-neutral-900 to-black min-h-screen font-sans">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* GALERIA */}
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

        {/* CARD */}
        <div className="mt-8 flex items-center justify-between p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent capitalize">
              {barbearia.nome}
            </h1>
            <p className="text-gray-300 mt-1">
              {barbearia.endereco}, {barbearia.cidade}
            </p>
            <p className="text-gray-400">{barbearia.telefone}</p>

            {statusAberto === "indefinido" ? (
              <p className="text-gray-500 mt-1">Horário não informado</p>
            ) : statusAberto === "aberto" ? (
              <p className="text-green-400 mt-1 font-medium">
                🟢 Aberto agora — {horarioTexto}
              </p>
            ) : (
              <p className="text-red-400 mt-1 font-medium">
                🔴 Fechado — abre às{" "}
                {barbearia.horario_abertura?.slice(0, 5) || "--:--"}
              </p>
            )}
          </div>

          <div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-8 py-3 rounded-lg font-semibold shadow-md transition transform hover:scale-[1.05]"
            >
              Marcar
            </button>
          </div>
        </div>

        {/* SOBRE */}
        <div id="sobre" className="mt-12">
          <h2 className="text-2xl font-bold text-yellow-500 mb-4">Sobre</h2>
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-lg flex flex-col md:flex-row gap-6">
            <div className="flex-1 text-gray-300">
              {barbearia.sobre ? (
                <p className="whitespace-pre-line">{barbearia.sobre}</p>
              ) : (
                <p>Sem descrição.</p>
              )}
              {barbearia.instagram && (
                <p className="mt-3 text-sm text-gray-400">
                  Instagram:{" "}
                  <span className="font-medium">{barbearia.instagram}</span>
                </p>
              )}
            </div>

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
                      className="block text-blue-400 hover:underline text-sm mt-2"
                    >
                      Instruções 📍
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 p-6 rounded-2xl w-full max-w-sm border border-neutral-700 shadow-xl">
            <h2 className="text-xl font-semibold text-yellow-500 mb-4 text-center">
              Identifique-se para agendar
            </h2>

            <form onSubmit={handleSalvarCliente} className="space-y-4">
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500"
              />

              {/* Campo de telefone com bandeira */}
              <div className="w-full">
                <PhoneInput
                  country={defaultCountry}
                  value={telefone}
                  onChange={(value) => setTelefone(value)}
                  inputStyle={{
                    width: "100%",
                    backgroundColor: "#171717",
                    color: "white",
                    border: "1px solid #3f3f46",
                    borderRadius: "0.5rem",
                    height: "42px",
                    paddingLeft: "48px",
                    fontSize: "15px",
                  }}
                  buttonStyle={{
                    backgroundColor: "#1f1f1f",
                    border: "1px solid #3f3f46",
                    borderRight: "none",
                  }}
                  dropdownStyle={{
                    backgroundColor: "#1f1f1f",
                    color: "white",
                  }}
                />
              </div>

              {!!msg && (
                <p
                  className={`text-sm font-medium ${
                    msg.startsWith("✅") ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {msg}
                </p>
              )}

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-black font-semibold transition disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
