"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, X, Pencil, Trash2, Download, FileText } from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// formatador de moeda em €
const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);

export default function FinanceiroPage() {
  const [lancamentos, setLancamentos] = useState([]);
  const [tipo, setTipo] = useState("entrada");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [ano, setAno] = useState(new Date().getFullYear());

  // carregar/salvar no localStorage
  useEffect(() => {
    const saved = localStorage.getItem("barberly_finance");
    if (saved) setLancamentos(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("barberly_finance", JSON.stringify(lancamentos));
  }, [lancamentos]);

  // adicionar ou editar lançamento
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!descricao || !valor || !data) return;

    if (editingId) {
      setLancamentos((prev) =>
        prev.map((l) =>
          l.id === editingId
            ? { ...l, tipo, descricao, valor: parseFloat(valor), data }
            : l
        )
      );
      setEditingId(null);
    } else {
      setLancamentos((prev) => [
        {
          id: crypto.randomUUID(),
          tipo,
          descricao,
          valor: parseFloat(valor),
          data,
        },
        ...prev,
      ]);
    }

    setTipo("entrada");
    setDescricao("");
    setValor("");
    setData("");
  };

  const startEdit = (l) => {
    setEditingId(l.id);
    setTipo(l.tipo);
    setDescricao(l.descricao);
    setValor(l.valor);
    setData(l.data);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTipo("entrada");
    setDescricao("");
    setValor("");
    setData("");
  };

  const removeLancamento = (id) => {
    if (!confirm("Remover lançamento?")) return;
    setLancamentos((prev) => prev.filter((l) => l.id !== id));
  };

  // gera dados agregados por mês
  const dadosMensais = useMemo(() => {
    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: new Date(0, i).toLocaleString("pt-PT", { month: "short" }),
      entradas: 0,
      saidas: 0,
    }));

    lancamentos.forEach((l) => {
      const d = new Date(l.data);
      if (d.getFullYear() === ano) {
        const index = d.getMonth();
        if (l.tipo === "entrada") {
          meses[index].entradas += l.valor;
        } else {
          meses[index].saidas += l.valor;
        }
      }
    });

    return meses;
  }, [lancamentos, ano]);

  const resumo = useMemo(() => {
    const entradas = dadosMensais.reduce((acc, m) => acc + m.entradas, 0);
    const saidas = dadosMensais.reduce((acc, m) => acc + m.saidas, 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [dadosMensais]);

  // exportar para CSV
  const exportCSV = () => {
    const headers = ["Data", "Tipo", "Descrição", "Valor (€)"];
    const rows = lancamentos.map((l) => [
      new Date(l.data).toLocaleDateString("pt-PT"),
      l.tipo === "entrada" ? "Entrada" : "Saída",
      l.descricao,
      l.valor.toFixed(2).replace(".", ","),
    ]);

    const csvContent =
      [headers, ...rows].map((row) => row.join(";")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `financeiro_${ano}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // exportar para PDF
  const exportPDF = async () => {
    const doc = new jsPDF();

    // carregar logo
    const logo = new Image();
    logo.src = "/barberly-logo.png"; // logo em public/
    await new Promise((resolve) => {
      logo.onload = resolve;
    });

    // logo no topo
    doc.addImage(logo, "PNG", 150, 10, 40, 20);

    // título
    doc.setFontSize(16);
    doc.text("Relatório Financeiro - Barberly", 14, 20);
    doc.setFontSize(12);
    doc.text(`Ano: ${ano}`, 14, 30);

    // resumo
    doc.text(`Entradas: ${formatCurrency(resumo.entradas)}`, 14, 45);
    doc.text(`Saídas: ${formatCurrency(resumo.saidas)}`, 14, 55);
    doc.text(`Saldo: ${formatCurrency(resumo.saldo)}`, 14, 65);

    // tabela
    const rows = lancamentos
      .filter((l) => new Date(l.data).getFullYear() === ano)
      .map((l) => [
        new Date(l.data).toLocaleDateString("pt-PT"),
        l.tipo === "entrada" ? "Entrada" : "Saída",
        l.descricao,
        formatCurrency(l.valor),
      ]);

    autoTable(doc, {
      startY: 75,
      head: [["Data", "Tipo", "Descrição", "Valor (€)"]],
      body: rows,
    });

    doc.save(`financeiro_${ano}.pdf`);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">Financeiro</h1>

      {/* Filtro de ano + Exportar */}
      <div className="flex items-center gap-4 mb-6">
        <input
          type="number"
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white w-28"
        />
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          <Download size={16} /> Exportar CSV
        </button>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <FileText size={16} /> Exportar PDF
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-green-600 text-white p-4 rounded-lg shadow">
          <h2 className="font-bold">Entradas</h2>
          <p className="text-2xl">{formatCurrency(resumo.entradas)}</p>
        </div>
        <div className="bg-red-600 text-white p-4 rounded-lg shadow">
          <h2 className="font-bold">Saídas</h2>
          <p className="text-2xl">{formatCurrency(resumo.saidas)}</p>
        </div>
        <div className="bg-yellow-600 text-white p-4 rounded-lg shadow">
          <h2 className="font-bold">Saldo</h2>
          <p className="text-2xl">{formatCurrency(resumo.saldo)}</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-gray-900 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-bold mb-4">Entradas vs Saídas</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dadosMensais}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="mes" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="entradas" stroke="#4ade80" />
            <Line type="monotone" dataKey="saidas" stroke="#f87171" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-4 rounded-lg mb-6 flex gap-4 items-end"
      >
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        >
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
        <input
          type="text"
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <input
          type="number"
          placeholder="Valor (€)"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-32 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
        >
          {editingId ? <Save size={16} /> : <Plus size={16} />}
          {editingId ? "Salvar" : "Adicionar"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            <X size={16} /> Cancelar
          </button>
        )}
      </form>

      {/* Tabela */}
      <div className="bg-gray-900 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Lançamentos</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2">Data</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Descrição</th>
              <th className="p-2">Valor (€)</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lancamentos
              .filter((l) => new Date(l.data).getFullYear() === ano)
              .map((l) => (
                <tr key={l.id} className="border-b border-gray-700">
                  <td className="p-2">
                    {new Date(l.data).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="p-2">
                    {l.tipo === "entrada" ? "Entrada" : "Saída"}
                  </td>
                  <td className="p-2">{l.descricao}</td>
                  <td className="p-2">{formatCurrency(l.valor)}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => startEdit(l)}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => removeLancamento(l.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
