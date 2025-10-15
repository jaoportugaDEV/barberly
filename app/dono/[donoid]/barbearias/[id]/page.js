"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage"; // função util de crop

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
      className="space-y-3 bg-gray-900 p-6 rounded-lg border border-gray-700"
    >
      <input
        type="text"
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
      />
      <input
        type="text"
        placeholder="Endereço"
        value={endereco}
        onChange={(e) => setEndereco(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
      />
      <input
        type="text"
        placeholder="Telefone"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
      />
      <input
        type="text"
        placeholder="Cidade"
        value={cidade}
        onChange={(e) => setCidade(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
      />
      <textarea
        placeholder="Sobre a barbearia"
        value={sobre}
        onChange={(e) => setSobre(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white min-h-[100px]"
      />

      {/* 🔹 Horários */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-sm text-gray-300 mb-1">Abertura</label>
          <input
            type="time"
            value={horaAbertura}
            onChange={(e) => setHoraAbertura(e.target.value)}
            step="900"
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm text-gray-300 mb-1">Fechamento</label>
          <input
            type="time"
            value={horaFechamento}
            onChange={(e) => setHoraFechamento(e.target.value)}
            step="900"
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
        </div>
      </div>

      {/* 🔹 Link do Google Maps */}
      <input
        type="text"
        placeholder="Link do Google Maps (colar a URL do local)"
        value={mapsUrl}
        onChange={(e) => setMapsUrl(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
      />

      {/* 🔹 Foto de ajuda */}
      <div className="mt-2 space-y-2">
        <p className="text-sm text-gray-300">
          Foto de ajuda (opcional) — aparece no “Sobre” da página pública.
        </p>

        {ajudaFotoUrl ? (
          <div className="flex items-center gap-4">
            <img
              src={ajudaFotoUrl}
              alt="Foto de ajuda"
              className="w-28 h-28 object-cover rounded border border-gray-700"
            />
            <button
              type="button"
              onClick={handleRemoverAjuda}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
            >
              Remover foto de ajuda
            </button>
          </div>
        ) : (
          <label className="inline-block">
            <span className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg cursor-pointer">
              {uploadingAjuda ? "Enviando..." : "Escolher foto de ajuda"}
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

      <button
        type="submit"
        className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg"
      >
        Salvar alterações
      </button>

      {!!msg && (
        <p
          className={`mt-2 text-sm font-semibold ${
            msg.startsWith("✅") ? "text-green-400" : "text-red-400"
          }`}
        >
          {msg}
        </p>
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
    <div>
      <h2 className="text-xl font-bold mb-4 text-yellow-500">Fotos</h2>

      <label className="inline-block mb-4">
        <span className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg cursor-pointer">
          {uploading ? "Enviando..." : "Adicionar Foto"}
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
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
          <div className="relative w-[90%] max-w-lg h-[400px] bg-gray-900 rounded-lg">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, cropped) => setCroppedAreaPixels(cropped)}
            />
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setCropSrc(null)}
              className="bg-red-600 px-4 py-2 rounded-lg text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleCropSave}
              className="bg-green-600 px-4 py-2 rounded-lg text-white"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Grid de fotos */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {fotos.map((foto) => (
          <div
            key={foto.id}
            className="relative rounded-lg border border-gray-700 overflow-hidden"
          >
            <img
              src={foto.url}
              alt="Foto da barbearia"
              className="w-full h-60 object-cover cursor-pointer"
              onClick={() => setLightbox(foto.url)}
            />
            <button
              onClick={() => handleDelete(foto.id, foto.url)}
              className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-80 hover:opacity-100"
            >
              Excluir
            </button>
          </div>
        ))}
      </div>

      {/* Lightbox */}
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

  if (!barbearia) return <p className="p-6 text-gray-400">Carregando...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">
        Editar: {barbearia.nome}
      </h1>

      <div className="flex space-x-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setTab("dados")}
          className={`pb-2 ${
            tab === "dados"
              ? "border-b-2 border-yellow-500 text-yellow-500"
              : "text-gray-400"
          }`}
        >
          Dados
        </button>
        <button
          onClick={() => setTab("fotos")}
          className={`pb-2 ${
            tab === "fotos"
              ? "border-b-2 border-yellow-500 text-yellow-500"
              : "text-gray-400"
          }`}
        >
          Fotos
        </button>
      </div>

      {tab === "dados" && (
        <TabDados barbearia={barbearia} setBarbearia={setBarbearia} />
      )}
      {tab === "fotos" && <TabFotos barbeariaId={id} />}
    </div>
  );
}
