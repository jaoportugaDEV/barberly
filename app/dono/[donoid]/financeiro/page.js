"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ Import correto para PDF
import { Download } from "lucide-react";

export default function FinanceiroPage() {
  const [userId, setUserId] = useState(null);
  const [barbeariaIds, setBarbeariaIds] = useState([]);
  const [barbeirosIds, setBarbeirosIds] = useState([]);

  const [agendamentos, setAgendamentos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [total, setTotal] = useState(0);

  // filtros
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [dia, setDia] = useState("");

  // toggle — false = serviços | true = geral (serviços + produtos)
  const [financeiroGeral, setFinanceiroGeral] = useState(false);

  const [barberMap, setBarberMap] = useState({});

  // carregar usuário, barbearias e barbeiros
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
      setUserId(auth.user.id);

      const { data: barbs } = await supabase
        .from("barbearias")
        .select("id")
        .eq("dono_id", auth.user.id);

      const barbeariasIds = (barbs || []).map((b) => b.id);
      setBarbeariaIds(barbeariasIds);

      if (barbeariasIds.length > 0) {
        const { data: barbsFuncs } = await supabase
          .from("barbeiros")
          .select("id")
          .in("barbearia_id", barbeariasIds);

        setBarbeirosIds((barbsFuncs || []).map((b) => b.id));
      }
    })();
  }, []);

  // atualizar quando algo muda
  useEffect(() => {
    if (!userId || barbeariaIds.length === 0) return;
    carregarFinanceiro();
  }, [userId, barbeariaIds, barbeirosIds, mes, ano, dia, financeiroGeral]);

  // buscar serviços e vendas (se geral = true)
  async function carregarFinanceiro() {
    try {
      // -------- SERVIÇOS ----------
      let query = supabase
        .from("appointments")
        .select(
          `id, starts_at, status, user_id, barber_id, barbearia_id, client_name, services ( name, price )`
        )
        .eq("status", "concluido")
        .order("starts_at", { ascending: false });

      const filters = [
        `barbearia_id.in.(${barbeariaIds.join(",")})`,
        `user_id.eq.${userId}`,
      ];
      if (barbeirosIds.length > 0) {
        filters.push(`barber_id.in.(${barbeirosIds.join(",")})`);
      }
      query = query.or(filters.join(","));

      // aplicar filtros de data
      if (dia) {
        query = query
          .gte("starts_at", `${dia}T00:00:00`)
          .lte("starts_at", `${dia}T23:59:59`);
      } else {
        if (ano) {
          query = query
            .gte("starts_at", `${ano}-01-01`)
            .lte("starts_at", `${ano}-12-31`);
        }
        if (mes) {
          query = query
            .gte("starts_at", `${ano}-${mes}-01`)
            .lt("starts_at", `${ano}-${mes}-32`);
        }
      }

      const { data: servicos, error: errServ } = await query;
      if (errServ) throw errServ;

      setAgendamentos(servicos || []);

      // nomes barbeiros
      const ids = Array.from(
        new Set(
          (servicos || [])
            .flatMap((a) => [a.user_id, a.barber_id])
            .filter(Boolean)
        )
      );

      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", ids);

        const map = {};
        (profs || []).forEach((p) => (map[p.id] = p.name));
        setBarberMap(map);
      }

      // -------- VENDAS (só se for geral) ----------
      let vendasList = [];
      if (financeiroGeral) {
        const { data: vendasData, error: errVend } = await supabase
          .from("vendas")
          .select("*")
          .in("empresa_id", barbeariaIds)
          .order("data_venda", { ascending: false });

        if (errVend) throw errVend;

        // aplicar filtros também
        let filtradas = vendasData || [];
        if (dia)
          filtradas = filtradas.filter(
            (v) => v.data_venda.slice(0, 10) === dia
          );
        else if (mes)
          filtradas = filtradas.filter(
            (v) => v.data_venda.startsWith(`${ano}-${mes}`)
          );
        else if (ano)
          filtradas = filtradas.filter((v) =>
            v.data_venda.startsWith(`${ano}`)
          );

        vendasList = filtradas;
        setVendas(vendasList);
      } else {
        setVendas([]);
      }

      // -------- TOTAL GERAL ----------
      const totalServicos = (servicos || []).reduce(
        (acc, a) => acc + (a?.services?.price || 0),
        0
      );
      const totalVendas = (vendasList || []).reduce(
        (acc, v) => acc + Number(v.total || 0),
        0
      );
      setTotal(totalServicos + totalVendas);
    } catch (err) {
      console.error("Erro ao buscar financeiro:", err);
      setAgendamentos([]);
      setVendas([]);
      setTotal(0);
    }
  }

  // limpar filtros
  function limparFiltros() {
    setMes("");
    setAno(String(new Date().getFullYear()));
    setDia("");
  }

  // ✅ EXPORTAR CSV
  function exportarCSV() {
    const registros = [
      ...agendamentos.map((a) => ({
        data: new Date(a.starts_at).toLocaleString("pt-PT"),
        tipo: "Serviço",
        nome: `${a.client_name || "—"} (${a.services?.name || "—"})`,
        valor: (a.services?.price ?? 0).toFixed(2),
        responsavel: barberMap[a.barber_id] || barberMap[a.user_id] || "—",
      })),
      ...vendas.map((v) => ({
        data: new Date(v.data_venda).toLocaleString("pt-PT"),
        tipo: "Produto",
        nome: v.produto,
        valor: Number(v.total).toFixed(2),
        responsavel: v.vendedor || "—",
      })),
    ];

    if (registros.length === 0) return alert("Nenhum dado para exportar.");

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        ["Data", "Tipo", "Cliente/Produto", "Valor (€)", "Responsável"].join(","),
        ...registros.map((r) =>
          [r.data, r.tipo, r.nome, r.valor, r.responsavel].join(",")
        ),
      ].join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "financeiro.csv";
    link.click();
  }

  // ✅ EXPORTAR PDF
  function exportarPDF() {
    const registros = [
      ...agendamentos.map((a) => [
        new Date(a.starts_at).toLocaleString("pt-PT"),
        "Serviço",
        `${a.client_name || "—"} (${a.services?.name || "—"})`,
        `€${(a.services?.price ?? 0).toFixed(2)}`,
        barberMap[a.barber_id] || barberMap[a.user_id] || "—",
      ]),
      ...vendas.map((v) => [
        new Date(v.data_venda).toLocaleString("pt-PT"),
        "Produto",
        v.produto,
        `€${Number(v.total).toFixed(2)}`,
        v.vendedor || "—",
      ]),
    ];

    if (registros.length === 0) return alert("Nenhum dado para exportar.");

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório Financeiro", 14, 20);

    autoTable(doc, {
      head: [["Data", "Tipo", "Cliente/Produto", "Valor (€)", "Responsável"]],
      body: registros,
      startY: 30,
      theme: "grid",
      styles: { fontSize: 10 },
    });

    doc.text(
      `Total Recebido: €${total.toFixed(2)}`,
      14,
      doc.lastAutoTable.finalY + 10
    );

    doc.save("financeiro.pdf");
  }

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      <h1 className="text-3xl font-extrabold text-yellow-500 mb-8 tracking-wide flex items-center gap-2">
        💰 {financeiroGeral ? "Financeiro Geral" : "Financeiro de Serviços"}
      </h1>

      {/* Switch + filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-white/90 font-medium">
            {financeiroGeral ? "Ver apenas Serviços" : "Incluir Vendas"}
          </span>
          <button
            onClick={() => setFinanceiroGeral((v) => !v)}
            className={`w-14 h-7 rounded-full p-1 flex items-center transition-all ${
              financeiroGeral ? "bg-green-500" : "bg-gray-600"
            }`}
            type="button"
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                financeiroGeral ? "translate-x-7" : ""
              }`}
            />
          </button>
        </label>

        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
        >
          <option value="">Todos os meses</option>
          {Array.from({ length: 12 }).map((_, i) => {
            const v = String(i + 1).padStart(2, "0");
            const label = [
              "Janeiro",
              "Fevereiro",
              "Março",
              "Abril",
              "Maio",
              "Junho",
              "Julho",
              "Agosto",
              "Setembro",
              "Outubro",
              "Novembro",
              "Dezembro",
            ][i];
            return (
              <option key={v} value={v}>
                {label}
              </option>
            );
          })}
        </select>

        <input
          type="number"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          placeholder="Ano"
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 w-28 focus:ring-2 focus:ring-yellow-500 outline-none"
        />

        <input
          type="date"
          value={dia}
          onChange={(e) => setDia(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
        />

        <button
          onClick={limparFiltros}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium shadow-lg transition"
        >
          Limpar
        </button>

        {/* Exportações */}
        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black px-5 py-2 rounded-lg font-semibold shadow-lg transition"
        >
          <Download size={16} /> CSV
        </button>
        <button
          onClick={exportarPDF}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold shadow-lg transition"
        >
          <Download size={16} /> PDF
        </button>
      </div>

      {/* Total */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="text-xl font-semibold">
          Total Recebido:{" "}
          <span className="text-green-400 font-bold text-2xl">
            €{total.toFixed(2)}
          </span>
        </h2>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl shadow-lg border border-white/10">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-800/60 text-yellow-500 uppercase text-sm">
              <th className="p-3">Data</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Cliente/Produto</th>
              <th className="p-3">Valor (€)</th>
              <th className="p-3">Responsável</th>
            </tr>
          </thead>
          <tbody>
            {[...agendamentos, ...vendas].length ? (
              <>
                {agendamentos.map((a) => (
                  <tr
                    key={`serv-${a.id}`}
                    className="hover:bg-white/5 transition border-b border-gray-700/50"
                  >
                    <td className="p-3">
                      {new Date(a.starts_at).toLocaleString("pt-PT")}
                    </td>
                    <td className="p-3 text-yellow-400 font-semibold">Serviço</td>
                    <td className="p-3">
                      {a.client_name || "—"} ({a.services?.name || "—"})
                    </td>
                    <td className="p-3 font-semibold text-green-400">
                      €{(a.services?.price ?? 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      {barberMap[a.barber_id] ||
                        barberMap[a.user_id] ||
                        "—"}
                    </td>
                  </tr>
                ))}
                {financeiroGeral &&
                  vendas.map((v) => (
                    <tr
                      key={`vend-${v.id}`}
                      className="hover:bg-white/5 transition border-b border-gray-700/50"
                    >
                      <td className="p-3">
                        {new Date(v.data_venda).toLocaleString("pt-PT")}
                      </td>
                      <td className="p-3 text-blue-400 font-semibold">Produto</td>
                      <td className="p-3">{v.produto}</td>
                      <td className="p-3 font-semibold text-green-400">
                        €{Number(v.total).toFixed(2)}
                      </td>
                      <td className="p-3">{v.vendedor || "—"}</td>
                    </tr>
                  ))}
              </>
            ) : (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-400 italic">
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
