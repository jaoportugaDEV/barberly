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
    <div className="min-h-screen p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="backdrop-blur-lg bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-yellow-600/30 shadow-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 transition-all duration-300 hover:shadow-yellow-600/20">
          {/* Título */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                <PlusCircle size={28} className="text-yellow-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent tracking-wide">
                Novo Produto
              </h1>
            </div>
          </div>

          {/* Formulário */}
          <div className="flex flex-col gap-4 sm:gap-5">
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Empresa *
              </label>
              <select
                value={form.empresa_id}
                onChange={(e) => setForm({ ...form, empresa_id: e.target.value })}
                className="w-full p-3 sm:p-4 rounded-xl bg-gray-800/70 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-sm sm:text-base"
              >
                <option value="">-- Selecione a empresa --</option>
                {empresas.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                placeholder="Ex: Shampoo Anti-Caspa"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full p-3 sm:p-4 rounded-xl bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Categoria
              </label>
              <input
                type="text"
                placeholder="Ex: Shampoo, Creme, Suplemento"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full p-3 sm:p-4 rounded-xl bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Descrição
              </label>
              <textarea
                placeholder="Descreva o produto..."
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full p-3 sm:p-4 rounded-xl bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none resize-none h-28 transition-all text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Preço de Venda (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.preco}
                  onChange={(e) => setForm({ ...form, preco: e.target.value })}
                  className="w-full p-3 sm:p-4 rounded-xl bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Custo (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.custo}
                  onChange={(e) => setForm({ ...form, custo: e.target.value })}
                  className="w-full p-3 sm:p-4 rounded-xl bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Quantidade Inicial
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                  className="w-full p-3 sm:p-4 rounded-xl bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Estoque Mínimo (Alerta)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.alerta_minimo}
                  onChange={(e) =>
                    setForm({ ...form, alerta_minimo: e.target.value })
                  }
                  className="w-full p-3 sm:p-4 rounded-xl bg-gray-800/70 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Upload de imagem */}
            <div className="mt-2">
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Imagem do Produto
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImagem(e.target.files[0])}
                  className="block w-full text-sm text-gray-400 
                  file:mr-4 file:py-3 file:px-5 
                  file:rounded-xl file:border-0 file:text-sm file:font-semibold 
                  file:bg-gradient-to-r file:from-yellow-500 file:to-yellow-600 
                  file:text-black hover:file:from-yellow-600 hover:file:to-yellow-700 
                  cursor-pointer transition-all file:transition-all file:duration-200 file:hover:scale-105
                  bg-gray-800/70 border border-gray-700 rounded-xl p-2"
                />
              </div>
              {imagem && (
                <p className="mt-2 text-xs text-green-400 flex items-center gap-2">
                  <Package size={14} /> {imagem.name}
                </p>
              )}
            </div>

            <hr className="border-gray-700/50 my-2" />

            {/* Botões */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
              <button
                onClick={() => router.push(`/dono/${donoid}/estoque`)}
                className="w-full sm:w-auto px-6 py-3 bg-gray-700/80 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
              >
                Cancelar
              </button>

              <button
                disabled={loading}
                onClick={handleSalvar}
                className={`w-full sm:w-auto px-6 py-3 font-semibold rounded-xl transition-all duration-300 text-sm sm:text-base ${
                  loading
                    ? "bg-yellow-400/70 cursor-not-allowed text-black"
                    : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black hover:scale-105 shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> Salvando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Package size={18} /> Salvar Produto
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
