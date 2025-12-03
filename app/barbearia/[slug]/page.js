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
  
  // Header scroll state
  const [scrolled, setScrolled] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);

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

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      
      // Detecta se rolou para baixo ou para cima
      if (currentScroll > lastScroll && currentScroll > 80) {
        setHeaderVisible(false); // Esconde ao rolar para baixo
      } else {
        setHeaderVisible(true); // Mostra ao rolar para cima
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-16 w-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mb-4 drop-shadow-[0_0_20px_rgba(253,184,19,0.5)]"></div>
          <p className="text-gray-300 text-lg font-medium">Carregando barbearia...</p>
        </div>
      </div>
    );

  const horarioTexto =
    barbearia.horario_abertura && barbearia.horario_fechamento
      ? `Das ${barbearia.horario_abertura.slice(0, 5)} às ${barbearia.horario_fechamento.slice(0, 5)}`
      : null;

  return (
    <div className="text-white bg-gradient-to-b from-neutral-950 via-neutral-900 to-black min-h-screen font-sans">
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

      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-yellow-500/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 pt-32 sm:pt-36 lg:pt-40">
        {/* GALERIA */}
        {fotos.length > 0 && (
          <div className="mb-8 sm:mb-12 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 h-[250px] sm:h-[350px] lg:h-[450px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
              <div className="col-span-2 row-span-2 group relative overflow-hidden">
                <img
                  src={fotos[0].url}
                  alt="Foto principal"
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-110"
                  onClick={() => setLightbox(fotos[0].url)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
              </div>
              {fotos.slice(1, 5).map((foto, idx) => (
                <div
                  key={foto.id}
                  className="group relative overflow-hidden"
                >
                  <img
                    src={foto.url}
                    alt={`Foto da barbearia ${idx + 2}`}
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-110"
                    onClick={() => setLightbox(foto.url)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIGHTBOX */}
        {lightbox && (
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
            onClick={() => setLightbox(null)}
          >
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white hover:text-yellow-400 transition-colors text-2xl sm:text-3xl font-bold bg-black/50 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center backdrop-blur-sm hover:bg-black/70"
              >
                ×
              </button>
            <img
              src={lightbox}
              alt="Foto ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* CARD PRINCIPAL */}
        <div className="mb-8 sm:mb-12 animate-fade-in-up">
          <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/10 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1 space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600 bg-clip-text text-transparent capitalize leading-tight drop-shadow-lg">
                  {barbearia.nome}
                </h1>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm sm:text-base">
                  <div className="flex items-center gap-2 text-gray-300">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-300">
                      {barbearia.endereco}, {barbearia.cidade}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{barbearia.telefone}</span>
                  </div>
                </div>

                <div className="pt-2">
                  {statusAberto === "indefinido" ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50">
                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                      <span className="text-gray-400 text-sm sm:text-base">Horário não informado</span>
                    </div>
                  ) : statusAberto === "aberto" ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-green-400 font-medium text-sm sm:text-base">
                        Aberto agora — {horarioTexto}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-red-400 font-medium text-sm sm:text-base">
                        Fechado — abre às {barbearia.horario_abertura?.slice(0, 5) || "--:--"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:ml-6">
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-500 hover:via-amber-500 hover:to-amber-600 px-10 py-5 rounded-2xl font-black text-black shadow-2xl shadow-yellow-500/40 transition-all duration-300 transform hover:scale-110 hover:shadow-yellow-500/60 text-lg sm:text-xl uppercase tracking-wide"
                >
                  Marcar Agendamento
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SOBRE */}
        <div id="sobre" className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text mb-6 sm:mb-8 flex items-center gap-3">
            <span className="h-1.5 w-16 bg-gradient-to-r from-yellow-500 via-amber-500 to-transparent rounded-full shadow-lg shadow-yellow-500/50"></span>
            Sobre
          </h2>
          <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/10 shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              <div className="flex-1 space-y-4">
                {barbearia.sobre ? (
                  <p className="text-gray-300 leading-relaxed text-base sm:text-lg whitespace-pre-line">
                    {barbearia.sobre}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">Sem descrição disponível.</p>
                )}
                {barbearia.instagram && (
                  <div className="pt-4 border-t border-white/10">
                    <a
                      href={`https://instagram.com/${barbearia.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-500 transition-colors group"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span className="font-medium">{barbearia.instagram}</span>
                    </a>
                  </div>
                )}
              </div>

              {barbearia.ajuda_foto_url && (
                <div className="flex-1 lg:max-w-md">
                  <div className="relative group overflow-hidden rounded-2xl shadow-xl">
                    <img
                      src={barbearia.ajuda_foto_url}
                      alt="Foto de ajuda"
                      className="w-full h-auto max-h-[300px] object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {barbearia.maps_url && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <a
                      href={barbearia.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-white hover:text-yellow-400 transition-colors font-medium group/link"
                    >
                          <svg className="w-5 h-5 group-hover/link:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Ver no mapa</span>
                          <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-6 sm:p-8 rounded-3xl w-full max-w-md border border-neutral-700/50 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                Identifique-se para agendar
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSalvarCliente} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  placeholder="Digite seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone
                </label>
                <PhoneInput
                  country={defaultCountry}
                  value={telefone}
                  onChange={(value) => setTelefone(value)}
                  inputStyle={{
                    width: "100%",
                    backgroundColor: "rgba(38, 38, 38, 0.5)",
                    color: "white",
                    border: "1px solid #3f3f46",
                    borderRadius: "0.75rem",
                    height: "48px",
                    paddingLeft: "52px",
                    fontSize: "16px",
                  }}
                  inputProps={{
                    className: "focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500",
                  }}
                  buttonStyle={{
                    backgroundColor: "rgba(23, 23, 23, 0.8)",
                    border: "1px solid #3f3f46",
                    borderRight: "none",
                    borderRadius: "0.75rem 0 0 0.75rem",
                  }}
                  dropdownStyle={{
                    backgroundColor: "#171717",
                    color: "white",
                    borderRadius: "0.75rem",
                  }}
                />
              </div>

              {!!msg && (
                <div
                  className={`p-3 rounded-xl text-sm font-medium ${
                    msg.startsWith("✅")
                      ? "bg-green-500/10 border border-green-500/30 text-green-400"
                      : "bg-red-500/10 border border-red-500/30 text-red-400"
                  }`}
                >
                  {msg}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700 text-white font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-black shadow-lg shadow-yellow-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 uppercase tracking-wide"
                >
                  {salvando ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Salvando...
                    </span>
                  ) : (
                    "Confirmar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
