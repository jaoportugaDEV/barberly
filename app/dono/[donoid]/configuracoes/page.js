"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import supabase from "@/lib/supabaseClient";

export default function ConfiguracoesPage() {
  const [perfil, setPerfil] = useState({
    nome: "",
    email: "",
    foto_url: "",
  });
  const [userId, setUserId] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return;

    setUserId(user.user.id);

    const { data: perfilData } = await supabase
      .from("profiles")
      .select("name, email, foto_url")
      .eq("id", user.user.id)
      .single();

    if (perfilData) {
      setPerfil({
        nome: perfilData.name || "",
        email: perfilData.email || "",
        foto_url: perfilData.foto_url || "",
      });
    }
  }

  async function handleUploadFoto(e) {
    try {
      const file = e.target.files[0];
      if (!file || !userId) return;
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload para o bucket "profile_pics"
      const { error: uploadError } = await supabase.storage
        .from("profile_pics")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // URL pública
      const { data: urlData } = supabase.storage
        .from("profile_pics")
        .getPublicUrl(filePath);

      const fotoUrl = urlData.publicUrl;

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ foto_url: fotoUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setPerfil((prev) => ({ ...prev, foto_url: fotoUrl }));
      alert("✅ Foto atualizada com sucesso!");
    } catch (err) {
      console.error("Erro ao fazer upload da foto:", err);
      alert("❌ Erro ao enviar a foto. Verifique as permissões.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoverFoto() {
    if (!confirm("Deseja remover sua foto de perfil?")) return;
    await supabase.from("profiles").update({ foto_url: null }).eq("id", userId);
    setPerfil((prev) => ({ ...prev, foto_url: "" }));
    alert("Foto removida com sucesso!");
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold text-yellow-500 mb-8">
        Configurações do Dono
      </h1>

      {/* FOTO DE PERFIL */}
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 text-center max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-yellow-400">
          Foto do Dono
        </h2>

        <div className="flex flex-col items-center gap-4">
          <img
            src={
              perfil.foto_url ||
              "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
            }
            alt="Foto do Dono"
            className="w-28 h-28 rounded-full border-4 border-yellow-500 object-cover shadow-md"
          />

          {perfil.foto_url && (
            <button
              onClick={handleRemoverFoto}
              className="text-red-400 text-sm hover:text-red-500"
            >
              Remover foto
            </button>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleUploadFoto}
            disabled={uploading}
            className="text-sm text-gray-300"
          />

          <button
            onClick={() => alert('As alterações são salvas automaticamente após o upload.')}
            className="mt-3 flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black px-5 py-2 rounded-lg font-semibold"
          >
            <Save size={18} /> Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
