"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { ShoppingCart, PlusCircle } from "lucide-react";
import Swal from "sweetalert2";

export default function VendasPage() {
  const { donoid } = useParams();
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [empresaId, setEmpresaId] = useState(null);

  // 🔹 Ao iniciar, busca a empresa e carrega produtos
  useEffect(() => {
    buscarEmpresa();
  }, []);

  async function buscarEmpresa() {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) return;

      const { data: barbearia, error } = await supabase
        .from("barbearias")
        .select("id")
        .eq("dono_id", userId)
        .maybeSingle(); // Evita erro caso não encontre nada

      if (error) console.error("Erro ao buscar barbearia:", error);

      if (barbearia) {
        setEmpresaId(barbearia.id);
        carregarProdutos(barbearia.id);
      } else {
        console.warn("Nenhuma barbearia encontrada para este dono.");
      }
    } catch (err) {
      console.error("Erro ao buscar empresa:", err);
    }
  }

  async function carregarProdutos(empresa_id) {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("empresa_id", empresa_id);

    if (error) {
      console.error("Erro ao carregar produtos:", error);
    } else {
      setProdutos(data);
      const cats = [...new Set(data.map((p) => p.categoria))];
      setCategorias(cats);
    }
  }

  function calcularTotal() {
    if (!produtoSelecionado) return 0;
    const preco = Number(produtoSelecionado.preco) || 0;
    const qtd = Number(quantidade) || 0;
    return preco * qtd;
  }

  async function confirmarVenda() {
    if (!produtoSelecionado || !quantidade) {
      Swal.fire("Atenção", "Selecione um produto e informe a quantidade.", "warning");
      return;
    }

    if (quantidade > produtoSelecionado.quantidade) {
      Swal.fire("Erro", "Quantidade maior que o estoque disponível.", "error");
      return;
    }

    const total = calcularTotal();

    try {
      // 🔸 Atualiza estoque
      const novaQtd = produtoSelecionado.quantidade - quantidade;
      const { error: erroEstoque } = await supabase
        .from("produtos")
        .update({ quantidade: novaQtd })
        .eq("id", produtoSelecionado.id);

      if (erroEstoque) throw erroEstoque;

      // 🔸 Registra venda na tabela "vendas"
      const { error: erroVenda } = await supabase.from("vendas").insert([
        {
          empresa_id: empresaId,
          produto_id: produtoSelecionado.id,
          categoria: produtoSelecionado.categoria,
          produto: produtoSelecionado.nome,
          quantidade,
          preco: produtoSelecionado.preco,
          total,
        },
      ]);

      if (erroVenda) throw erroVenda;

      // 🔸 Feedback visual de sucesso
      setMostrarModal(false);
      setProdutoSelecionado(null);
      setQuantidade(1);

      Swal.fire({
        icon: "success",
        title: "Venda realizada!",
        html: `
          <div style="text-align: left">
            <b>Produto:</b> ${produtoSelecionado.nome}<br/>
            <b>Categoria:</b> ${produtoSelecionado.categoria}<br/>
            <b>Quantidade:</b> ${quantidade}<br/>
            <b>Total:</b> €${total.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
          </div>
        `,
        confirmButtonColor: "#16a34a",
      });

      carregarProdutos(empresaId);
    } catch (err) {
      console.error(err);
      Swal.fire("Erro", "Não foi possível concluir a venda.", "error");
    }
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-yellow-500 flex items-center gap-3">
          <ShoppingCart size={28} /> Vendas
        </h1>

        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition"
        >
          <PlusCircle size={18} /> Nova Venda
        </button>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-600 rounded-xl p-8 w-[450px] shadow-2xl">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">Nova Venda</h2>

            {/* Categoria */}
            <label className="block text-gray-300 text-sm mb-1">Categoria</label>
            <select
              value={categoriaSelecionada}
              onChange={(e) => setCategoriaSelecionada(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Produto */}
            <label className="block text-gray-300 text-sm mb-1">Produto</label>
            <select
              value={produtoSelecionado?.id || ""}
              onChange={(e) => {
                const produto = produtos.find((p) => p.id === e.target.value);
                setProdutoSelecionado(produto);
              }}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-yellow-500"
              disabled={!categoriaSelecionada}
            >
              <option value="">Selecione um produto</option>
              {produtos
                .filter((p) => p.categoria === categoriaSelecionada)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {p.quantidade} em estoque
                  </option>
                ))}
            </select>

            {/* Quantidade */}
            <label className="block text-gray-300 text-sm mb-1">Quantidade</label>
            <input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-yellow-500"
            />

            {/* Total */}
            <div className="flex justify-between text-lg font-semibold mb-6">
              <span className="text-gray-300">Total:</span>
              <span className="text-green-400">
                €
                {calcularTotal().toLocaleString("pt-PT", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMostrarModal(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarVenda}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
              >
                Confirmar Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
