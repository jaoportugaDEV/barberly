"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Link from "next/link";

export default function ProdutoDetalhesPage() {
  const { donoid, produtoid } = useParams();
  const router = useRouter();

  const [produto, setProduto] = useState(null);
  const [movs, setMovs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantidade, setQuantidade] = useState("");
  const [tipo, setTipo] = useState("entrada");
  const [observacao, setObservacao] = useState("");

  // carregar produto e movimentações
  useEffect(() => {
    if (!produtoid) return;
    carregarProduto();
  }, [produtoid]);

  async function carregarProduto() {
    try {
      setLoading(true);

      // produto
      const { data: p, error: e1 } = await supabase
        .from("produtos")
        .select("*")
        .eq("id", produtoid)
        .single();
      if (e1) throw e1;
      setProduto(p);

      // movimentações
      const { data: m, error: e2 } = await supabase
        .from("movimentacoes_estoque")
        .select("id, tipo, quantidade, data, observacao, usuario_id")
        .eq("produto_id", produtoid)
        .order("data", { ascending: false });

      if (e2) throw e2;
      setMovs(m || []);
    } catch (err) {
      console.error("Erro ao carregar produto:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function registrarMovimentacao() {
    if (!quantidade || quantidade <= 0) {
      alert("⚠️ Informe uma quantidade válida.");
      return;
    }

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return alert("Usuário não autenticado.");

      const { error } = await supabase.from("movimentacoes_estoque").insert([
        {
          produto_id: produtoid,
          tipo,
          quantidade: parseInt(quantidade),
          usuario_id: auth.user.id,
          observacao,
        },
      ]);

      if (error) throw error;

      alert("✅ Movimentação registrada com sucesso!");
      setQuantidade("");
      setObservacao("");
      carregarProduto(); // atualizar automaticamente
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao registrar movimentação: " + err.message);
    }
  }

  async function atualizarProduto() {
    try {
      const { error } = await supabase
        .from("produtos")
        .update({
          nome: produto.nome,
          descricao: produto.descricao,
          preco: parseFloat(produto.preco) || 0,
          custo: parseFloat(produto.custo) || 0,
          categoria: produto.categoria,
          alerta_minimo: parseInt(produto.alerta_minimo) || 0,
        })
        .eq("id", produtoid);

      if (error) throw error;
      alert("✅ Produto atualizado com sucesso!");
      carregarProduto();
    } catch (err) {
      alert("❌ Erro ao atualizar produto: " + err.message);
    }
  }

  if (loading)
    return (
      <div className="p-8 text-white min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        Carregando informações...
      </div>
    );

  if (!produto)
    return (
      <div className="p-8 text-white min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        Produto não encontrado.
      </div>
    );

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* topo */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-yellow-500 tracking-wide">
          🧾 {produto.nome}
        </h1>
        <Link
          href={`/dono/${donoid}/estoque`}
          className="text-gray-300 hover:text-yellow-400 transition"
        >
          ← Voltar ao estoque
        </Link>
      </div>

      {/* Detalhes */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gray-900/80 p-6 rounded-2xl border border-gray-700 shadow-xl">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">
            📋 Detalhes do Produto
          </h2>

          <div className="flex flex-col gap-3">
            <input
              value={produto.nome || ""}
              onChange={(e) => setProduto({ ...produto, nome: e.target.value })}
              placeholder="Nome"
              className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
            />

            <input
              value={produto.categoria || ""}
              onChange={(e) =>
                setProduto({ ...produto, categoria: e.target.value })
              }
              placeholder="Categoria"
              className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
            />

            <textarea
              value={produto.descricao || ""}
              onChange={(e) =>
                setProduto({ ...produto, descricao: e.target.value })
              }
              placeholder="Descrição"
              className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none resize-none h-24"
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={produto.preco || ""}
                onChange={(e) =>
                  setProduto({ ...produto, preco: e.target.value })
                }
                placeholder="Preço (€)"
                className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
              />
              <input
                type="number"
                value={produto.custo || ""}
                onChange={(e) =>
                  setProduto({ ...produto, custo: e.target.value })
                }
                placeholder="Custo (€)"
                className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            </div>

            <input
              type="number"
              value={produto.alerta_minimo || ""}
              onChange={(e) =>
                setProduto({ ...produto, alerta_minimo: e.target.value })
              }
              placeholder="Estoque mínimo"
              className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
            />

            <div className="flex justify-between items-center mt-3">
              <span className="text-lg text-gray-300">
                Estoque atual:{" "}
                <span
                  className={`font-bold ${
                    produto.quantidade <= produto.alerta_minimo
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {produto.quantidade}
                </span>
              </span>

              <button
                onClick={atualizarProduto}
                className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg font-semibold transition"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>

        {/* Registrar movimentação */}
        <div className="bg-gray-900/80 p-6 rounded-2xl border border-gray-700 shadow-xl">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">
            🔁 Movimentação de Estoque
          </h2>

          <div className="flex flex-col gap-4">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
            >
              <option value="entrada">Entrada (+)</option>
              <option value="saida">Saída (-)</option>
            </select>

            <input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Quantidade"
              className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
            />

            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observação (opcional)"
              className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none resize-none h-20"
            />

            <button
              onClick={registrarMovimentacao}
              className="bg-green-600 hover:bg-green-700 text-black font-semibold py-2 rounded-lg transition"
            >
              Registrar
            </button>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-gray-900/80 p-6 rounded-2xl border border-gray-700 shadow-xl">
        <h2 className="text-xl font-semibold text-yellow-400 mb-4">
          📜 Histórico de Movimentações
        </h2>

        {movs.length === 0 ? (
          <p className="text-gray-400 italic">Nenhuma movimentação registrada.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-800/60 text-yellow-500 uppercase text-sm">
                  <th className="p-3">Data</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Qtd</th>
                  <th className="p-3">Observação</th>
                </tr>
              </thead>
              <tbody>
                {movs.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-700/40 hover:bg-white/5 transition"
                  >
                    <td className="p-3">
                      {new Date(m.data).toLocaleString("pt-PT")}
                    </td>
                    <td
                      className={`p-3 font-semibold ${
                        m.tipo === "entrada" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {m.tipo}
                    </td>
                    <td className="p-3">{m.quantidade}</td>
                    <td className="p-3 text-gray-300">{m.observacao || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
