"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { CalendarDays, Filter, Trash2 } from "lucide-react";

export default function HistoricoVendasPage() {
  const { donoid } = useParams();
  const [vendas, setVendas] = useState([]);
  const [filtroMes, setFiltroMes] = useState("todos");
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroData, setFiltroData] = useState("");
  const [totalRecebido, setTotalRecebido] = useState(0);

  useEffect(() => {
    carregarVendas();
  }, [filtroMes, filtroAno, filtroData]);

  async function carregarVendas() {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      const { data: barbearia } = await supabase
        .from("barbearias")
        .select("id")
        .eq("dono_id", userId)
        .maybeSingle();

      if (!barbearia) return;

      let query = supabase
        .from("vendas")
        .select("*")
        .eq("empresa_id", barbearia.id)
        .order("data_venda", { ascending: false });

      if (filtroAno !== "todos") query = query.gte("data_venda", `${filtroAno}-01-01`);
      if (filtroMes !== "todos")
        query = query.lte("data_venda", `${filtroAno}-${String(filtroMes).padStart(2, "0")}-31`);
      if (filtroData) query = query.eq("data_venda", filtroData);

      const { data, error } = await query;
      if (error) throw error;

      setVendas(data || []);
      const total = data?.reduce((acc, v) => acc + Number(v.total || 0), 0);
      setTotalRecebido(total);
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
    }
  }

  function limparFiltros() {
    setFiltroMes("todos");
    setFiltroAno(new Date().getFullYear());
    setFiltroData("");
  }

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-yellow-500 flex items-center gap-3">
          <CalendarDays size={28} /> Histórico de Vendas
        </h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-900/50 border border-yellow-600 rounded-xl p-5">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-yellow-400" />
          <span className="text-gray-300 text-sm">Filtros:</span>
        </div>

        {/* Mês */}
        <select
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2"
        >
          <option value="todos">Todos os meses</option>
          {meses.map((m, i) => (
            <option key={i + 1} value={i + 1}>
              {m}
            </option>
          ))}
        </select>

        {/* Ano */}
        <input
          type="number"
          value={filtroAno}
          onChange={(e) => setFiltroAno(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 w-24"
        />

        {/* Data específica */}
        <input
          type="date"
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2"
        />

        {/* Limpar */}
        <button
          onClick={limparFiltros}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-2 rounded-lg transition"
        >
          <Trash2 size={16} /> Limpar
        </button>
      </div>

      {/* Total recebido */}
      <div className="bg-gray-900/60 border border-yellow-600 rounded-xl p-5 shadow-lg">
        <h3 className="text-gray-300 text-sm uppercase">Total Recebido</h3>
        <p className="text-3xl font-bold text-green-400 mt-1">
          €{totalRecebido.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Tabela de vendas */}
      <div className="overflow-x-auto rounded-xl border border-gray-800 mt-4 shadow-lg">
        {vendas.length === 0 ? (
          <p className="text-center py-6 text-gray-400">Nenhuma venda encontrada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-yellow-500">
              <tr>
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-left">Categoria</th>
                <th className="p-3 text-center">Preço (€)</th>
                <th className="p-3 text-center">Quantidade</th>
                <th className="p-3 text-center">Total (€)</th>
                <th className="p-3 text-center">Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((v) => (
                <tr key={v.id} className="border-t border-gray-800 hover:bg-gray-900/60 transition">
                  <td className="p-3 text-gray-300">
                    {new Date(v.data_venda).toLocaleString("pt-PT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-3 text-yellow-300 font-semibold">{v.produto}</td>
                  <td className="p-3 text-gray-400">{v.categoria}</td>
                  <td className="p-3 text-center text-green-400">
                    €{Number(v.preco).toFixed(2)}
                  </td>
                  <td className="p-3 text-center text-gray-200">{v.quantidade}</td>
                  <td className="p-3 text-center text-green-400 font-semibold">
                    €{Number(v.total).toFixed(2)}
                  </td>
                  <td className="p-3 text-center text-gray-300">{v.vendedor || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
