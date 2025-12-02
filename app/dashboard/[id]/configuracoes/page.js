"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { Camera, Trash2, Upload, UserCircle2 } from "lucide-react";

export default function ConfiguracoesFuncionario() {
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoAtual, setFotoAtual] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    // Obtém o utilizador autenticado
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        setUserInfo({
          nome: data.user.user_metadata?.nome || data.user.email,
          email: data.user.email,
        });

        // Carrega a foto atual do perfil
        const { data: perfil } = await supabase
          .from("profiles")
          .select("foto_url, name")
          .eq("id", data.user.id)
          .single();

        if (perfil?.foto_url) {
          setFotoPreview(perfil.foto_url);
          setFotoAtual(perfil.foto_url);
        }
        if (perfil?.name) {
          setUserInfo((prev) => ({
            ...prev,
            nome: perfil.name,
          }));
        }
      }
    };
    getUser();
  }, []);

  const handleSelecionarArquivo = (file) => {
    if (!file) {
      setFotoFile(null);
      setFotoPreview(fotoAtual);
      return;
    }
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setFotoPreview(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // 🔹 Faz upload da imagem e atualiza o banco
  const handleSalvarFoto = async () => {
    if (!fotoFile || !userId) {
      alert("Selecione uma imagem antes de salvar!");
      return;
    }

    try {
      setCarregando(true);
      // Nome único para a imagem
      const fileName = `${userId}-${Date.now()}.jpg`;

      // Upload no bucket profile_pics
      const { error: uploadError } = await supabase.storage
        .from("profile_pics")
        .upload(fileName, fotoFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Pegar URL pública
      const { data } = supabase.storage.from("profile_pics").getPublicUrl(fileName);
      const fotoUrl = data.publicUrl;

      // Atualizar no perfil
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ foto_url: fotoUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setFotoPreview(fotoUrl);
      setFotoAtual(fotoUrl);
      setFotoFile(null);
      alert("✅ Foto de perfil atualizada com sucesso!");
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao enviar foto: " + err.message);
    } finally {
      setCarregando(false);
    }
  };

  // 🔹 Remove foto (opcional)
  const handleRemoverFoto = async () => {
    if (!userId) return;

    try {
      setCarregando(true);
      await supabase.from("profiles").update({ foto_url: null }).eq("id", userId);
      setFotoPreview(null);
      setFotoAtual(null);
      setFotoFile(null);
      alert("🗑️ Foto removida.");
    } catch (err) {
      console.error(err);
      alert("❌ Não foi possível remover a foto.");
    } finally {
      setCarregando(false);
    }
  };

  const iniciais =
    userInfo?.nome
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("") || "BB";
  const fotoSelecionadaNome = fotoFile?.name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-4 lg:p-8 space-y-8">
      <section className="flex flex-col gap-2 text-center lg:text-left">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
          Perfil profissional
        </p>
        <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          Configurações do funcionário
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto lg:mx-0">
          Atualize a sua foto e mantenha o perfil alinhado com a identidade da
          barbearia. Layout repaginado e pronto para mobile.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm p-6 flex flex-col items-center text-center gap-4">
          <div className="relative">
            {fotoPreview ? (
              <img
                src={fotoPreview}
                alt="Foto de perfil"
                className="w-32 h-32 rounded-full object-cover border-4 border-yellow-500 shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-2xl font-semibold text-gray-400">
                {iniciais}
              </div>
            )}
            <span className="absolute -bottom-2 -right-2 bg-yellow-500 text-black p-2 rounded-full shadow-lg">
              <Camera size={18} />
            </span>
          </div>
          <div>
            <p className="text-xl font-semibold text-white">
              {userInfo?.nome || "Colaborador"}
            </p>
            <p className="text-sm text-gray-400">{userInfo?.email}</p>
          </div>
          <button
            onClick={handleRemoverFoto}
            disabled={!fotoPreview || carregando}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 disabled:opacity-40"
          >
            <Trash2 size={16} />
            Remover foto atual
          </button>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm p-6 space-y-6">
          <div className="flex items-center gap-2 text-yellow-400">
            <Upload size={18} />
            <h2 className="text-lg font-semibold">Atualizar foto</h2>
          </div>

          <label
            htmlFor="foto-upload"
            className="w-full border-2 border-dashed border-gray-700 rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-yellow-500 hover:bg-gray-900/60 transition"
          >
            <UserCircle2 size={42} className="text-gray-500" />
            <div className="text-center text-sm text-gray-400">
              <p>Clique para escolher uma imagem (PNG ou JPG)</p>
              {fotoSelecionadaNome ? (
                <p className="text-yellow-400 mt-1 truncate">
                  {fotoSelecionadaNome}
                </p>
              ) : (
                <p className="text-gray-500 mt-1">
                  até 5MB • proporção quadrada recomendada
                </p>
              )}
            </div>
          </label>
          <input
            id="foto-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleSelecionarArquivo(e.target.files?.[0] || null)}
          />

          {fotoFile && (
            <div className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
              Pré-visualização pronta. Clique em salvar para confirmar.
            </div>
          )}

          <div className="text-sm text-gray-400 space-y-2">
            <span className="text-white font-semibold">Dicas rápidas</span>
            <ul className="list-disc list-inside space-y-1">
              <li>Prefira fundos neutros e rostos bem iluminados.</li>
              <li>Garanta arquivos abaixo de 5MB para evitar falhas.</li>
              <li>
                Depois de salvar, atualize o app para ver a nova foto em todos os
                dispositivos.
              </li>
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSalvarFoto}
              disabled={!fotoFile || carregando}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold shadow-lg shadow-yellow-600/30 hover:scale-[1.01] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? "A atualizar..." : "Salvar foto"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
