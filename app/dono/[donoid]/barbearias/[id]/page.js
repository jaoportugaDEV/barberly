"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage"; // função util de crop
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  Globe,
  Image as ImageIcon,
  Upload,
  X,
  CheckCircle2,
  XCircle,
  Save,
  Trash2,
  Loader2,
  Calendar,
  FileText,
} from "lucide-react";

// =======================
// COMPONENTE TAB DADOS
// =======================
function TabDados({ barbearia, setBarbearia }) {
  const [nome, setNome] = useState(barbearia?.nome || "");
  const [endereco, setEndereco] = useState(barbearia?.endereco || "");
  const [telefone, setTelefone] = useState(barbearia?.telefone || "");
  const [cidade, setCidade] = useState(barbearia?.cidade || "");
  const [sobre, setSobre] = useState(barbearia?.sobre || "");
  const [mapsUrl, setMapsUrl] = useState(barbearia?.maps_url || "");

  // 🔹 horários de funcionamento
  const [horaAbertura, setHoraAbertura] = useState(
    barbearia?.horario_abertura?.slice(0, 5) || "09:00"
  );
  const [horaFechamento, setHoraFechamento] = useState(
    barbearia?.horario_fechamento?.slice(0, 5) || "18:00"
  );

  const [ajudaFotoUrl, setAjudaFotoUrl] = useState(barbearia?.ajuda_foto_url || "");
  const [uploadingAjuda, setUploadingAjuda] = useState(false);
  const [msg, setMsg] = useState("");

  // =======================
  // SALVAR DADOS
  // =======================
  const handleSave = async (e) => {
    e.preventDefault();
    setMsg("");

    // 🧠 validação simples
    if (horaFechamento <= horaAbertura) {
      setMsg("❌ O horário de fechamento deve ser depois do horário de abertura.");
      return;
    }

    const { error } = await supabase
      .from("barbearias")
      .update({
        nome,
        endereco,
        telefone,
        cidade,
        sobre,
        maps_url: mapsUrl,
        horario_abertura: horaAbertura,
        horario_fechamento: horaFechamento,
      })
      .eq("id", barbearia.id);

    if (error) {
      setMsg("❌ Erro ao salvar alterações.");
    } else {
      setMsg("✅ Alterações salvas!");
      setBarbearia({
        ...barbearia,
        nome,
        endereco,
        telefone,
        cidade,
        sobre,
        maps_url: mapsUrl,
        horario_abertura: horaAbertura,
        horario_fechamento: horaFechamento,
      });
    }
  };

  // =======================
  // UPLOAD DA FOTO DE AJUDA
  // =======================
  const handleUploadAjuda = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAjuda(true);
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${barbearia.id}/ajuda-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("barbearias")
        .upload(filePath, file, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("barbearias").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { error: dbError } = await supabase
        .from("barbearias")
        .update({ ajuda_foto_url: publicUrl })
        .eq("id", barbearia.id);

      if (dbError) throw dbError;

      setAjudaFotoUrl(publicUrl);
      setBarbearia({ ...barbearia, ajuda_foto_url: publicUrl });
      setMsg("✅ Foto de ajuda atualizada!");
    } catch (err) {
      console.error(err);
      setMsg("❌ Erro ao enviar a foto de ajuda.");
    } finally {
      setUploadingAjuda(false);
      e.target.value = "";
    }
  };

  // =======================
  // REMOVER FOTO DE AJUDA
  // =======================
  const handleRemoverAjuda = async () => {
    if (!ajudaFotoUrl) return;

    try {
      let path =
        ajudaFotoUrl.split("/barbearias/")[1] ||
        ajudaFotoUrl.split("/").slice(-2).join("/");

      if (path) {
        await supabase.storage.from("barbearias").remove([path]);
      }

      const { error } = await supabase
        .from("barbearias")
        .update({ ajuda_foto_url: null })
        .eq("id", barbearia.id);

      if (error) throw error;

      setAjudaFotoUrl("");
      setBarbearia({ ...barbearia, ajuda_foto_url: null });
      setMsg("✅ Foto de ajuda removida.");
    } catch (err) {
      console.error(err);
      setMsg("❌ Erro ao remover a foto de ajuda.");
    }
  };

  // =======================
  // FORMULÁRIO
  // =======================
  return (
    <form
      onSubmit={handleSave}
      className="space-y-6 bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-6 rounded-xl border border-gray-800 shadow-xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Nome da barbearia
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Digite o nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Telefone
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Digite o telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Endereço
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Digite o endereço completo"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Cidade
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Digite a cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Link do Google Maps
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Cole a URL do Google Maps"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          Sobre a barbearia
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
          <textarea
            placeholder="Descreva sua barbearia..."
            value={sobre}
            onChange={(e) => setSobre(e.target.value)}
            className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 min-h-[120px] resize-y transition-all"
          />
        </div>
      </div>

      {/* 🔹 Horários */}
      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-3">
          Horário de funcionamento
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-2">Abertura</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="time"
                value={horaAbertura}
                onChange={(e) => setHoraAbertura(e.target.value)}
                step="900"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">Fechamento</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="time"
                value={horaFechamento}
                onChange={(e) => setHoraFechamento(e.target.value)}
                step="900"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Foto de ajuda */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-400">
          Foto de ajuda (opcional)
        </label>
        <p className="text-xs text-gray-500">
          Esta foto aparece na seção "Sobre" da página pública da barbearia.
        </p>

        {ajudaFotoUrl ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <img
              src={ajudaFotoUrl}
              alt="Foto de ajuda"
              className="w-32 h-32 object-cover rounded-lg border border-gray-700"
            />
            <button
              type="button"
              onClick={handleRemoverAjuda}
              className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <Trash2 className="w-4 h-4" />
              Remover foto
            </button>
          </div>
        ) : (
          <label className="inline-block">
            <span className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-semibold px-6 py-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 shadow-lg">
              {uploadingAjuda ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Escolher foto de ajuda
                </>
              )}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadAjuda}
              disabled={uploadingAjuda}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-800">
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <Save className="w-5 h-5" />
          Salvar alterações
        </button>
      </div>

      {!!msg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            msg.startsWith("✅")
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {msg.startsWith("✅") ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-semibold">{msg}</p>
        </div>
      )}
    </form>
  );
}

// =======================
// COMPONENTE TAB FOTOS
// =======================
function TabFotos({ barbeariaId }) {
  const [fotos, setFotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const fetchFotos = async () => {
    const { data, error } = await supabase
      .from("barbearia_fotos")
      .select("id, url")
      .eq("barbearia_id", barbeariaId)
      .order("created_at", { ascending: false });

    if (!error) setFotos(data || []);
  };

  useEffect(() => {
    if (barbeariaId) fetchFotos();
  }, [barbeariaId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    try {
      setUploading(true);
      const croppedImageBlob = await getCroppedImg(cropSrc, croppedAreaPixels);

      const fileName = `${barbeariaId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("barbearias")
        .upload(fileName, croppedImageBlob, {
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("barbearias").getPublicUrl(fileName);

      await supabase
        .from("barbearia_fotos")
        .insert([{ barbearia_id: barbeariaId, url: data.publicUrl }]);

      setCropSrc(null);
      fetchFotos();
    } catch (err) {
      console.error("Erro ao salvar crop:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, url) => {
    if (!confirm("Excluir esta foto?")) return;

    const filePath = url.split("/").slice(-2).join("/");
    await supabase.storage.from("barbearias").remove([filePath]);
    await supabase.from("barbearia_fotos").delete().eq("id", id);

    fetchFotos();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-1">
            Galeria de Fotos
          </h2>
          <p className="text-gray-400 text-sm">
            Adicione fotos da sua barbearia para exibir na página pública
          </p>
        </div>
      </div>

      <label className="inline-block">
        <span className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-semibold px-6 py-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 shadow-lg">
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Adicionar Foto
            </>
          )}
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {/* Crop modal */}
      {cropSrc && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl border border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Ajustar Foto</h3>
              <button
                onClick={() => setCropSrc(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="relative w-full h-[400px] bg-gray-800 rounded-lg overflow-hidden">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, cropped) => setCroppedAreaPixels(cropped)}
                style={{
                  containerStyle: { borderRadius: "8px" },
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => setCropSrc(null)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
                Cancelar
              </button>
              <button
                onClick={handleCropSave}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                Salvar Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de fotos */}
      {fotos.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-950/50 border border-gray-800 rounded-xl p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">
            Nenhuma foto adicionada ainda.
          </p>
          <p className="text-gray-500 text-sm">
            Adicione fotos da sua barbearia para exibir na página pública.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className="group relative rounded-xl border border-gray-800 overflow-hidden bg-gray-900 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl"
            >
              <img
                src={foto.url}
                alt="Foto da barbearia"
                className="w-full h-64 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-110"
                onClick={() => setLightbox(foto.url)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button
                onClick={() => handleDelete(foto.id, foto.url)}
                className="absolute top-3 right-3 bg-red-600/90 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                title="Excluir foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={lightbox}
            alt="Foto ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// =======================
// PÁGINA PRINCIPAL
// =======================
export default function BarbeariaEditPage() {
  const params = useParams();
  const id = params.id;
  const [barbearia, setBarbearia] = useState(null);
  const [tab, setTab] = useState("dados");

  const fetchBarbearia = async () => {
    const { data, error } = await supabase
      .from("barbearias")
      .select("*")
      .eq("id", id)
      .single();

    if (!error) setBarbearia(data);
  };

  useEffect(() => {
    if (id) fetchBarbearia();
  }, [id]);

  if (!barbearia) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando informações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full"></div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
            Editar: {barbearia.nome}
          </h1>
        </div>
        <p className="text-gray-400 text-sm lg:text-base ml-4">
          Gerencie os dados e fotos da sua barbearia
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-900/50 rounded-lg p-1 border border-gray-800">
        <button
          onClick={() => setTab("dados")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
            tab === "dados"
              ? "bg-gradient-to-r from-yellow-600 to-yellow-500 text-black shadow-lg"
              : "text-gray-400 hover:text-yellow-400 hover:bg-gray-800/50"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Dados</span>
        </button>
        <button
          onClick={() => setTab("fotos")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
            tab === "fotos"
              ? "bg-gradient-to-r from-yellow-600 to-yellow-500 text-black shadow-lg"
              : "text-gray-400 hover:text-yellow-400 hover:bg-gray-800/50"
          }`}
        >
          <ImageIcon className="w-5 h-5" />
          <span>Fotos</span>
        </button>
      </div>

      {/* Tab Content */}
      {tab === "dados" && (
        <TabDados barbearia={barbearia} setBarbearia={setBarbearia} />
      )}
      {tab === "fotos" && <TabFotos barbeariaId={id} />}
    </div>
  );
}

