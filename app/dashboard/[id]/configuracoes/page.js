"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function ConfiguracoesFuncionario() {
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Obtém o utilizador autenticado
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);

        // Carrega a foto atual do perfil
        const { data: perfil } = await supabase
          .from("profiles")
          .select("foto_url")
          .eq("id", data.user.id)
          .single();

        if (perfil?.foto_url) setFotoPreview(perfil.foto_url);
      }
    };
    getUser();
  }, []);

  // 🔹 Faz upload da imagem e atualiza o banco
  const handleSalvarFoto = async () => {
    if (!fotoFile || !userId) {
      alert("Selecione uma imagem antes de salvar!");
      return;
    }

    try {
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
      alert("✅ Foto de perfil atualizada com sucesso!");
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao enviar foto: " + err.message);
    }
  };

  // 🔹 Remove foto (opcional)
  const handleRemoverFoto = async () => {
    if (!userId) return;

    await supabase.from("profiles").update({ foto_url: null }).eq("id", userId);
    setFotoPreview(null);
    alert("🗑️ Foto removida.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">
        Configurações do Funcionário
      </h1>

      <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800 w-[400px] text-center">
        <h2 className="text-lg font-semibold mb-4 text-white">Foto de Perfil</h2>

        {fotoPreview ? (
          <>
            <img
              src={fotoPreview}
              alt="Foto de perfil"
              className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-yellow-500 shadow-md"
            />
            <button
              onClick={handleRemoverFoto}
              className="text-red-400 text-sm mt-2 hover:underline"
            >
              Remover foto
            </button>
          </>
        ) : (
          <div className="w-32 h-32 mx-auto rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400">
            Sem foto
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFotoFile(e.target.files[0])}
          className="mt-4 text-sm text-gray-300"
        />

        <button
          onClick={handleSalvarFoto}
          className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-5 py-2 rounded-lg"
        >
          Salvar Foto
        </button>
      </div>
    </div>
  );
}
