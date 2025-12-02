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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">
            Configurações do Dono
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Gerencie sua foto de perfil</p>
        </div>

        <div className="backdrop-blur-md bg-gray-800/60 p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-700/50 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/50 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-yellow-400">
              Foto de Perfil
            </h2>
          </div>

          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <div className="relative group">
              <img
                src={imagemParaExibir}
                alt="Foto do Dono"
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-yellow-500 object-cover shadow-xl transition-transform duration-300 group-hover:scale-105"
              />
              {previewUrl && (
                <div className="absolute inset-0 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-medium text-yellow-400 bg-black/50 px-3 py-1 rounded-full">
                    Pré-visualização
                  </span>
                </div>
              )}
            </div>

            {perfil.nome && (
              <div className="text-center">
                <p className="text-lg sm:text-xl font-semibold text-white">{perfil.nome}</p>
                <p className="text-sm sm:text-base text-gray-400">{perfil.email}</p>
              </div>
            )}

            {!previewUrl && perfil.foto_url && (
              <button
                onClick={handleRemoverFoto}
                className="flex items-center gap-2 text-red-400 text-sm sm:text-base hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remover foto
              </button>
            )}

            <div className="w-full max-w-md">
              <label className="block mb-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelecionarArquivo}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600 file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>

              {previewUrl && (
                <button
                  onClick={limparPreview}
                  className="w-full text-xs sm:text-sm text-gray-400 hover:text-gray-300 transition-colors mb-3"
                >
                  Cancelar pré-visualização
                </button>
              )}

              <button
                onClick={handleSalvarAlteracoes}
                disabled={uploading || !previewFile}
                className={`w-full mt-4 flex items-center justify-center gap-2 px-5 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base transition-all ${
                  uploading || !previewFile
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-md hover:scale-[1.02]"
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>

            {previewFile && (
              <div className="w-full max-w-md bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                      {previewFile.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(previewFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
