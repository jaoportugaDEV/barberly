"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { PlusCircle, Loader2, Package } from "lucide-react";

export default function NovoProdutoPage() {
  const router = useRouter();
  const { donoid } = useParams();

  const [empresas, setEmpresas] = useState([]);
  const [imagem, setImagem] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    empresa_id: "",
    nome: "",
    descricao: "",
    categoria: "",
    preco: "",
    custo: "",
    quantidade: "",
    alerta_minimo: "",
  });

  useEffect(() => {
    carregarEmpresas();
  }, []);

  async function carregarEmpresas() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { data, error } = await supabase
      .from("barbearias")
      .select("id, nome")
      .eq("dono_id", auth.user.id);

    if (error) console.error(error);
    else setEmpresas(data || []);
  }

  async function handleSalvar() {
    try {
      setLoading(true);

      if (!form.empresa_id || !form.nome || !form.preco) {
        alert("⚠️ Preencha pelo menos nome, empresa e preço.");
        setLoading(false);
        return;
      }

      // Upload da imagem (opcional)
      let imagem_url = null;
      if (imagem) {
        const fileName = `${Date.now()}_${imagem.name}`;
        const { error: uploadError } = await supabase.storage
          .from("produtos")
          .upload(fileName, imagem);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("produtos")
          .getPublicUrl(fileName);

        imagem_url = publicUrl.publicUrl;
      }

      const produto = {
        ...form,
        preco: parseFloat(form.preco) || 0,
        custo: parseFloat(form.custo) || 0,
        quantidade: parseInt(form.quantidade) || 0,
        alerta_minimo: parseInt(form.alerta_minimo) || 0,
        imagem_url,
      };

      const { error } = await supabase.from("produtos").insert([produto]);
      if (error) throw error;

      alert("✅ Produto cadastrado com sucesso!");
      router.push(`/dono/${donoid}/estoque`);
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao cadastrar produto: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white p-10 flex flex-col items-center">
      <div className="w-full max-w-2xl backdrop-blur-lg bg-gray-900/60 border border-yellow-600/40 shadow-2xl rounded-3xl p-8 transition-all duration-300 hover:shadow-yellow-600/20">
        {/* Título */}
        <div className="flex items-center justify-center mb-8">
          <PlusCircle size={34} className="text-yellow-500 mr-3" />
          <h1 className="text-3xl font-extrabold text-yellow-500 tracking-wide">
            Novo Produto
          </h1>
        </div>

        {/* Formulário */}
        <div className="flex flex-col gap-5">
          <select
            value={form.empresa_id}
            onChange={(e) => setForm({ ...form, empresa_id: e.target.value })}
            className="p-3 rounded-lg bg-gray-800/70 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-yellow-500 outline-none transition"
          >
            <option value="">-- Selecione a empresa --</option>
            {empresas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Nome do produto"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="p-3 rounded-lg bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 outline-none transition"
          />

          <input
            type="text"
            placeholder="Categoria (ex: Shampoo, Creme, Suplemento)"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="p-3 rounded-lg bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 outline-none transition"
          />

          <textarea
            placeholder="Descrição do produto"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            className="p-3 rounded-lg bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 outline-none resize-none h-28 transition"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Preço (€)"
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: e.target.value })}
              className="p-3 rounded-lg bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 outline-none transition"
            />

            <input
              type="number"
              placeholder="Custo (€)"
              value={form.custo}
              onChange={(e) => setForm({ ...form, custo: e.target.value })}
              className="p-3 rounded-lg bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Quantidade inicial"
              value={form.quantidade}
              onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              className="p-3 rounded-lg bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 outline-none transition"
            />

            <input
              type="number"
              placeholder="Estoque mínimo (alerta)"
              value={form.alerta_minimo}
              onChange={(e) =>
                setForm({ ...form, alerta_minimo: e.target.value })
              }
              className="p-3 rounded-lg bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 outline-none transition"
            />
          </div>

          {/* Upload de imagem */}
          <div className="mt-3">
            <label className="block text-gray-300 mb-2 font-medium">
              Imagem do produto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImagem(e.target.files[0])}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 
              file:rounded-lg file:border-0 file:text-sm file:font-semibold 
              file:bg-yellow-500 file:text-black hover:file:bg-yellow-600 cursor-pointer transition"
            />
          </div>

          <hr className="border-gray-700 my-4" />

          {/* Botões */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => router.push(`/dono/${donoid}/estoque`)}
              className="px-5 py-2 bg-gray-600/80 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105"
            >
              Cancelar
            </button>

            <button
              disabled={loading}
              onClick={handleSalvar}
              className={`px-5 py-2 font-semibold rounded-lg transition-all duration-300 hover:scale-105 ${
                loading
                  ? "bg-yellow-400/70 cursor-not-allowed"
                  : "bg-yellow-600 hover:bg-yellow-700 text-black"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} /> Salvando...
                </span>
              ) : (
                "Salvar Produto"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
