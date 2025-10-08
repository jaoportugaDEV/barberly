"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import {
  Package,
  AlertTriangle,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function EstoquePage() {
  const { donoid } = useParams();
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      setProdutos(data || []);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function excluirProduto(id, nome) {
    const confirm = await Swal.fire({
      title: "Tem certeza?",
      text: `Deseja excluir o produto "${nome}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;

      Swal.fire("Excluído!", "O produto foi removido com sucesso.", "success");
      await carregarProdutos();
    } catch (err) {
      console.error(err);
      Swal.fire("Erro", "Não foi possível excluir o produto.", "error");
    }
  }

  const filtrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const totalProdutos = produtos.length;
  const totalEstoque = produtos.reduce((acc, p) => acc + (Number(p.quantidade) || 0), 0);

  // 💶 Cálculo do valor total e lucro estimado
  const valorTotal = produtos.reduce((acc, p) => {
    const quantidade = Number(p.quantidade) || 0;
    const preco = Number(p.preco) || 0;
    return acc + quantidade * preco;
  }, 0);

  const lucroEstimado = produtos.reduce((acc, p) => {
    const quantidade = Number(p.quantidade) || 0;
    const preco = Number(p.preco) || 0;
    const custo = Number(p.custo) || 0;
    return acc + quantidade * (preco - custo);
  }, 0);

  // 🧮 Função de formatação para euro
  const formatarEuro = (valor) =>
    valor.toLocaleString("pt-PT", {
      style: "currency",
      currency: "EUR",
    });

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-extrabold text-yellow-500 flex items-center gap-3">
          <Package size={28} /> Estoque
        </h1>

        <Link
          href={`/dono/${donoid}/novo`}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition"
        >
          <PlusCircle size={18} /> Novo Produto
        </Link>
      </div>

      {/* Resumo rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-yellow-600 rounded-xl p-5 text-center shadow-lg">
          <h3 className="text-gray-300 text-sm uppercase">Produtos Cadastrados</h3>
          <p className="text-3xl font-bold text-yellow-400 mt-1">{totalProdutos}</p>
        </div>

        <div className="bg-gray-900/50 border border-yellow-600 rounded-xl p-5 text-center shadow-lg">
          <h3 className="text-gray-300 text-sm uppercase">Itens em Estoque</h3>
          <p className="text-3xl font-bold text-green-400 mt-1">{totalEstoque}</p>
        </div>

        <div className="bg-gray-900/50 border border-yellow-600 rounded-xl p-5 text-center shadow-lg">
          <h3 className="text-gray-300 text-sm uppercase">Valor Total em Estoque (€)</h3>
          <p className="text-3xl font-bold text-blue-400 mt-1">
            {formatarEuro(valorTotal)}
          </p>
        </div>

        <div className="bg-gray-900/50 border border-yellow-600 rounded-xl p-5 text-center shadow-lg">
          <h3 className="text-gray-300 text-sm uppercase">Lucro Estimado (€)</h3>
          <p className="text-3xl font-bold text-green-300 mt-1">
            {formatarEuro(lucroEstimado)}
          </p>
        </div>
      </div>

      {/* Campo de busca */}
      <div className="relative mt-6">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Pesquisar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
        />
      </div>

      {/* Tabela de produtos */}
      <div className="overflow-x-auto rounded-xl border border-gray-800 mt-4 shadow-lg">
        {loading ? (
          <p className="text-center py-6 text-gray-400">Carregando produtos...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-center py-6 text-gray-400">
            Nenhum produto encontrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-yellow-500">
              <tr>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Categoria</th>
                <th className="p-3 text-center">Quantidade</th>
                <th className="p-3 text-center">Preço (€)</th>
                <th className="p-3 text-center">Custo (€)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-gray-800 hover:bg-gray-900/60 transition"
                >
                  <td className="p-3 font-semibold text-yellow-300">{p.nome}</td>
                  <td className="p-3 text-gray-300">{p.categoria || "—"}</td>
                  <td className="p-3 text-center text-gray-200">{p.quantidade}</td>
                  <td className="p-3 text-center text-green-400">
                    {formatarEuro(Number(p.preco) || 0)}
                  </td>
                  <td className="p-3 text-center text-gray-400">
                    {formatarEuro(Number(p.custo) || 0)}
                  </td>
                  <td className="p-3 text-center">
                    {p.quantidade <= p.alerta_minimo ? (
                      <span className="text-red-400 flex items-center gap-1 justify-center">
                        <AlertTriangle size={14} /> Baixo estoque
                      </span>
                    ) : (
                      <span className="text-green-400">OK</span>
                    )}
                  </td>
                  <td className="p-3 text-center flex items-center justify-center gap-4">
                    <Link
                      href={`/dono/${donoid}/${p.id}`}
                      className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300 transition font-medium"
                    >
                      <Edit3 size={15} /> Editar
                    </Link>
                    <button
                      onClick={() => excluirProduto(p.id, p.nome)}
                      className="inline-flex items-center gap-1 text-red-500 hover:text-red-400 transition font-medium"
                    >
                      <Trash2 size={15} /> Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
