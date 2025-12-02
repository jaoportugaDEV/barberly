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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 sm:h-12 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full"></div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              Gestão de Estoque
            </h1>
          </div>

          <Link
            href={`/dono/${donoid}/novo`}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold px-5 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <PlusCircle size={20} /> Novo Produto
          </Link>
        </div>

        {/* Resumo rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm border border-yellow-600/30 rounded-xl p-5 sm:p-6 text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider mb-2">Produtos Cadastrados</h3>
            <p className="text-3xl sm:text-4xl font-bold text-yellow-400">{totalProdutos}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm border border-yellow-600/30 rounded-xl p-5 sm:p-6 text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider mb-2">Itens em Estoque</h3>
            <p className="text-3xl sm:text-4xl font-bold text-green-400">{totalEstoque}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm border border-yellow-600/30 rounded-xl p-5 sm:p-6 text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider mb-2">Valor Total (€)</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-400">
              {formatarEuro(valorTotal)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm border border-yellow-600/30 rounded-xl p-5 sm:p-6 text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider mb-2">Lucro Estimado (€)</h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-300">
              {formatarEuro(lucroEstimado)}
            </p>
          </div>
        </div>

        {/* Campo de busca */}
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Pesquisar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-gray-800/80 text-white pl-12 pr-4 py-3 sm:py-4 rounded-xl border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-sm sm:text-base"
          />
        </div>

        {/* Desktop - Tabela de produtos */}
        <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-800 shadow-2xl">
          {loading ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-900/80 to-gray-950/80">
              <div className="inline-block w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">Carregando produtos...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-900/80 to-gray-950/80">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Nenhum produto encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-900 to-gray-950 text-yellow-500">
                <tr>
                  <th className="p-4 text-left font-semibold">Nome</th>
                  <th className="p-4 text-left font-semibold">Categoria</th>
                  <th className="p-4 text-center font-semibold">Quantidade</th>
                  <th className="p-4 text-center font-semibold">Preço (€)</th>
                  <th className="p-4 text-center font-semibold">Custo (€)</th>
                  <th className="p-4 text-center font-semibold">Status</th>
                  <th className="p-4 text-center font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-gradient-to-br from-gray-900/50 to-gray-950/50">
                {filtrados.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-gray-800 hover:bg-gray-900/80 transition-all duration-200"
                  >
                    <td className="p-4 font-semibold text-yellow-300">{p.nome}</td>
                    <td className="p-4 text-gray-300">{p.categoria || "—"}</td>
                    <td className="p-4 text-center text-gray-200 font-medium">{p.quantidade}</td>
                    <td className="p-4 text-center text-green-400 font-semibold">
                      {formatarEuro(Number(p.preco) || 0)}
                    </td>
                    <td className="p-4 text-center text-gray-400">
                      {formatarEuro(Number(p.custo) || 0)}
                    </td>
                    <td className="p-4 text-center">
                      {p.quantidade <= p.alerta_minimo ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                          <AlertTriangle size={14} /> Baixo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">OK</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/dono/${donoid}/${p.id}`}
                          className="inline-flex items-center gap-1 bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105"
                        >
                          <Edit3 size={14} /> Editar
                        </Link>
                        <button
                          onClick={() => excluirProduto(p.id, p.nome)}
                          className="inline-flex items-center gap-1 bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105"
                        >
                          <Trash2 size={14} /> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile - Cards de produtos */}
        <div className="lg:hidden space-y-4">
          {loading ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-900/80 to-gray-950/80 rounded-xl border border-gray-800">
              <div className="inline-block w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">Carregando produtos...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-900/80 to-gray-950/80 rounded-xl border border-gray-800">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum produto encontrado.</p>
            </div>
          ) : (
            filtrados.map((p) => (
              <div
                key={p.id}
                className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm border border-gray-800 rounded-xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-yellow-300 font-bold text-lg mb-1">{p.nome}</h3>
                    <p className="text-gray-400 text-sm">{p.categoria || "Sem categoria"}</p>
                  </div>
                  <div className="ml-3">
                    {p.quantidade <= p.alerta_minimo ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold whitespace-nowrap">
                        <AlertTriangle size={12} /> Baixo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">OK</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-800">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Quantidade</p>
                    <p className="text-white font-semibold text-lg">{p.quantidade}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Preço</p>
                    <p className="text-green-400 font-bold text-lg">{formatarEuro(Number(p.preco) || 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Custo</p>
                    <p className="text-gray-400 font-semibold">{formatarEuro(Number(p.custo) || 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Margem</p>
                    <p className="text-yellow-400 font-semibold">
                      {formatarEuro((Number(p.preco) || 0) - (Number(p.custo) || 0))}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/dono/${donoid}/${p.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                  >
                    <Edit3 size={16} /> Editar
                  </Link>
                  <button
                    onClick={() => excluirProduto(p.id, p.nome)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
