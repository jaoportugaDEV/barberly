"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Package,
  PlusCircle,
  RefreshCw,
  Search,
  ShoppingCart,
  Tag,
  Wallet2,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

export default function VendasPage() {
  const { donoid } = useParams();
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [busca, setBusca] = useState("");
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
        .maybeSingle();

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
      setProdutos(data || []);
      const cats = [...new Set((data || []).map((p) => p.categoria))];
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
      const novaQtd = produtoSelecionado.quantidade - quantidade;
      const { error: erroEstoque } = await supabase
        .from("produtos")
        .update({ quantidade: novaQtd })
        .eq("id", produtoSelecionado.id);

      if (erroEstoque) throw erroEstoque;

      const { error: erroVenda } = await supabase.from("vendas").insert([
        {
          empresa_id: empresaId,
          produto_id: produtoSelecionado.id,
          categoria: produtoSelecionado.categoria,
          produto: produtoSelecionado.nome,
          quantidade,
          preco: produtoSelecionado.preco,
          total,
          data_venda: new Date().toISOString(),
        },
      ]);

      if (erroVenda) throw erroVenda;

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

      setMostrarModal(false);
      setProdutoSelecionado(null);
      setQuantidade(1);
      carregarProdutos(empresaId);
    } catch (err) {
      console.error(err);
      Swal.fire("Erro", "Não foi possível concluir a venda.", "error");
    }
  }

  const formatCurrency = (valor = 0) =>
    Number(valor || 0).toLocaleString("pt-PT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const categoriasOrdenadas = [...categorias]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const produtosFiltrados = produtos
    .filter((p) =>
      categoriaSelecionada ? p.categoria === categoriaSelecionada : true
    )
    .filter((p) => {
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      return (
        p.nome?.toLowerCase().includes(termo) ||
        p.categoria?.toLowerCase().includes(termo)
      );
    });

  const produtosParaSelecao = categoriaSelecionada
    ? produtos.filter((p) => p.categoria === categoriaSelecionada)
    : produtos;

  const baixoEstoque = produtos.filter(
    (p) => (Number(p.quantidade) || 0) <= 5
  );

  const totalItens = produtos.reduce(
    (acc, p) => acc + (Number(p.quantidade) || 0),
    0
  );

  const valorEstoque = produtos.reduce(
    (acc, p) =>
      acc + (Number(p.preco) || 0) * (Number(p.quantidade) || 0),
    0
  );

  const statCards = [
    {
      label: "Produtos",
      value: produtos.length,
      helper: "cadastrados",
      icon: Package,
    },
    {
      label: "Categorias",
      value: categoriasOrdenadas.length,
      helper: "organizadas",
      icon: Tag,
    },
    {
      label: "Itens em estoque",
      value: totalItens,
      helper: "unidades disponíveis",
      icon: ShoppingCart,
    },
    {
      label: "Valor em produtos",
      value: `€${formatCurrency(valorEstoque)}`,
      helper: "potencial de faturação",
      icon: Wallet2,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-4 lg:p-8 space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
            Operação
          </p>
          <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent flex items-center gap-3">
            <ShoppingCart size={28} />
            Vendas de produtos
          </h1>
          <p className="text-gray-400 max-w-xl mt-2">
            Registre vendas em poucos cliques, acompanhe o estoque e encontre
            rapidamente os itens disponíveis.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => carregarProdutos(empresaId)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-700 text-gray-200 hover:border-yellow-500 hover:text-yellow-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!empresaId}
          >
            <RefreshCw size={16} />
            Atualizar lista
          </button>
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 px-5 py-3 rounded-xl text-black font-semibold shadow-lg shadow-yellow-600/30 hover:scale-[1.02] transition"
          >
            <PlusCircle size={18} />
            Registar venda
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, helper, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-800/70 bg-gray-900/40 backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">{label}</p>
              <span className="p-2 rounded-full bg-gray-800">
                <Icon size={18} className="text-yellow-400" />
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{value}</p>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {helper}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-4 bg-gray-900/30 border border-gray-800 rounded-2xl p-4 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou categoria"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-950/60 border border-gray-800 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setCategoriaSelecionada("");
              setBusca("");
            }}
            className="self-start px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-400 transition"
          >
            Limpar filtros
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoriaSelecionada("")}
            className={`px-4 py-2 rounded-full text-sm border transition ${
              categoriaSelecionada === ""
                ? "bg-yellow-500 text-black border-yellow-500"
                : "border-gray-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-400"
            }`}
          >
            Todas
          </button>
          {categoriasOrdenadas.map((categoria) => (
            <button
              key={categoria}
              onClick={() => setCategoriaSelecionada(categoria)}
              className={`px-4 py-2 rounded-full text-sm border transition ${
                categoriaSelecionada === categoria
                  ? "bg-yellow-500 text-black border-yellow-500"
                  : "border-gray-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-400"
              }`}
            >
              {categoria}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">
            Produtos disponíveis
          </h2>
          <p className="text-sm text-gray-400">
            {produtosFiltrados.length} resultado
            {produtosFiltrados.length === 1 ? "" : "s"}
          </p>
        </div>

        {produtosFiltrados.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {produtosFiltrados.map((produto) => {
              const estoqueAtual = Number(produto.quantidade) || 0;
              const estoqueCritico = estoqueAtual <= 5;
              return (
                <div
                  key={produto.id}
                  className="rounded-2xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {produto.nome}
                      </p>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Tag size={14} className="text-yellow-400" />
                        {produto.categoria}
                      </p>
                    </div>
                    {estoqueCritico && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-yellow-300 bg-yellow-500/10 px-3 py-1 rounded-full">
                        <AlertTriangle size={14} />
                        Baixo estoque
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>
                      Em estoque:{" "}
                      <span className="text-white font-semibold">
                        {estoqueAtual} un
                      </span>
                    </span>
                    <span>
                      Preço unitário:{" "}
                      <span className="text-green-400 font-semibold">
                        €{formatCurrency(produto.preco)}
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setProdutoSelecionado(produto);
                      setQuantidade(1);
                      setMostrarModal(true);
                    }}
                    className="w-full mt-auto rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold py-2 hover:scale-[1.01] transition"
                  >
                    Registar venda
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-700 p-8 text-center text-gray-400">
            Nenhum produto encontrado com os filtros selecionados.
          </div>
        )}
      </section>

      {baixoEstoque.length > 0 && (
        <section className="rounded-2xl border border-yellow-600/40 bg-yellow-500/5 p-5 space-y-4">
          <div className="flex items-center gap-2 text-yellow-300">
            <AlertTriangle size={18} />
            <h3 className="text-lg font-semibold">
              Itens com estoque crítico ({baixoEstoque.length})
            </h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {baixoEstoque.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-yellow-600/30 bg-gray-900/60 px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-semibold">{item.nome}</p>
                  <p className="text-sm text-gray-400">{item.categoria}</p>
                </div>
                <span className="text-yellow-300 font-semibold">
                  {item.quantidade} un
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-yellow-400">
                Registar nova venda
              </h2>
              <button
                onClick={() => setMostrarModal(false)}
                className="p-2 rounded-lg hover:bg-gray-900 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Categoria
                </label>
                <select
                  value={categoriaSelecionada}
                  onChange={(e) => setCategoriaSelecionada(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-3 focus:ring-2 focus:ring-yellow-500 outline-none"
                >
                  <option value="">Selecione uma categoria</option>
                  {categoriasOrdenadas.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Produto
                </label>
                <select
                  value={produtoSelecionado?.id ? String(produtoSelecionado.id) : ""}
                  onChange={(e) => {
                    const produto = produtos.find(
                      (p) => String(p.id) === e.target.value
                    );
                    setProdutoSelecionado(produto || null);
                  }}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-3 focus:ring-2 focus:ring-yellow-500 outline-none"
                >
                  <option value="">Selecione um produto</option>
                  {produtosParaSelecao.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.nome} — {p.quantidade} em estoque
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={produtoSelecionado?.quantidade || undefined}
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-3 focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>
                <div className="rounded-xl bg-gray-900 border border-gray-800 p-4 flex flex-col justify-center">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Total estimado
                  </p>
                  <p className="text-2xl font-bold text-green-400">
                    €{formatCurrency(calcularTotal())}
                  </p>
                  {produtoSelecionado && (
                    <p className="text-xs text-gray-500 mt-1">
                      Preço unitário: €{formatCurrency(produtoSelecionado.preco)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-400 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarVenda}
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!produtoSelecionado}
              >
                Confirmar venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
