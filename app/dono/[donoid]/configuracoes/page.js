"use client";

import { useEffect, useState, useMemo } from "react";
import { Save } from "lucide-react";
import supabase from "@/lib/supabaseClient";

export default function ConfiguracoesPage() {
  const [perfil, setPerfil] = useState({
    nome: "",
    email: "",
    foto_url: "",
  });
  const [userId, setUserId] = useState(null);

  // pré-visualização
  const [previewFile, setPreviewFile] = useState(null); // File
  const [previewUrl, setPreviewUrl] = useState(""); // blob:url/...
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

  // quando o usuário escolhe um arquivo, só geramos a preview
  function handleSelecionarArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // libera URL anterior (evita vazamento)
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  // faz o upload do arquivo selecionado (se houver)
  async function handleSalvarAlteracoes() {
    try {
      if (!userId) {
        alert("Usuário não autenticado.");
        return;
      }

      if (!previewFile) {
        alert("Selecione uma foto antes de salvar.");
        return;
      }

      setUploading(true);

      const fileExt = previewFile.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload para o bucket "profile_pics"
      const { error: uploadError } = await supabase.storage
        .from("profile_pics")
        .upload(filePath, previewFile, { upsert: true });

      if (uploadError) throw uploadError;

      // URL pública
      const { data: urlData } = supabase.storage
        .from("profile_pics")
        .getPublicUrl(filePath);

      const fotoUrl = urlData.publicUrl;

      // Atualiza no banco
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ foto_url: fotoUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      // aplica no estado e limpa a prévia
      setPerfil((prev) => ({ ...prev, foto_url: fotoUrl }));
      limparPreview();

      alert("✅ Foto atualizada com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar foto:", err);
      alert("❌ Erro ao salvar. Verifique permissões de storage/policies.");
    } finally {
      setUploading(false);
    }
  }

  function limparPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl("");
  }

  async function handleRemoverFoto() {
    if (!userId) return;
    if (!confirm("Deseja remover sua foto de perfil?")) return;

    await supabase.from("profiles").update({ foto_url: null }).eq("id", userId);
    setPerfil((prev) => ({ ...prev, foto_url: "" }));
    limparPreview();
    alert("Foto removida com sucesso!");
  }

  // o que vamos mostrar como imagem principal:
  // prioridade: preview > foto do perfil do banco > placeholder
  const imagemParaExibir = useMemo(
    () =>
      previewUrl ||
      perfil.foto_url ||
      "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png",
    [previewUrl, perfil.foto_url]
  );

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold text-yellow-500 mb-8">
        Configurações do Dono
      </h1>

      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 text-center max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-yellow-400">
          Foto do Dono
        </h2>

        <div className="flex flex-col items-center gap-4">
          <img
            src={imagemParaExibir}
            alt="Foto do Dono"
            className="w-28 h-28 rounded-full border-4 border-yellow-500 object-cover shadow-md"
          />

          {/* Mostrar botão remover se estiver usando a foto do banco (não a preview) */}
          {!previewUrl && perfil.foto_url && (
            <button
              onClick={handleRemoverFoto}
              className="text-red-400 text-sm hover:text-red-500"
            >
              Remover foto
            </button>
          )}

          <div className="flex flex-col items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleSelecionarArquivo}
              disabled={uploading}
              className="text-sm text-gray-300"
            />
            {previewUrl && (
              <button
                onClick={limparPreview}
                className="text-xs text-gray-400 hover:text-gray-300"
              >
                Cancelar pré-visualização
              </button>
            )}
          </div>

          <button
            onClick={handleSalvarAlteracoes}
            disabled={uploading || !previewFile}
            className={`mt-3 flex items-center gap-2 px-5 py-2 rounded-lg font-semibold ${
              uploading || !previewFile
                ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                : "bg-yellow-600 hover:bg-yellow-700 text-black"
            }`}
          >
            <Save size={18} />
            {uploading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
