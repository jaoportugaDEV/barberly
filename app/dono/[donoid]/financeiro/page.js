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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-10 sm:h-12 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full"></div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              {financeiroGeral ? "Financeiro Geral" : "Financeiro de Serviços"}
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base ml-4">
            Gerencie e acompanhe todas as receitas da sua barbearia
          </p>
        </div>

        {/* Switch + filtros */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-yellow-600/30 shadow-2xl mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Toggle Switch */}
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-white font-semibold text-sm sm:text-base whitespace-nowrap">
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

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="flex-1 min-w-[140px] px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-gray-800/70 border border-gray-700 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-sm sm:text-base"
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
                className="w-24 sm:w-28 px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-gray-800/70 border border-gray-700 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-sm sm:text-base"
              />

              <input
                type="date"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                className="flex-1 min-w-[140px] px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-gray-800/70 border border-gray-700 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-sm sm:text-base"
              />

              <button
                onClick={limparFiltros}
                className="px-4 sm:px-5 py-2 sm:py-3 bg-red-600/80 hover:bg-red-600 text-white rounded-xl font-semibold shadow-lg transition-all duration-200 hover:scale-105 text-sm sm:text-base whitespace-nowrap"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Botões de Exportação */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-800">
            <button
              onClick={exportarCSV}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-5 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:scale-105 text-sm sm:text-base"
            >
              <Download size={18} /> Exportar CSV
            </button>
            <button
              onClick={exportarPDF}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:scale-105 text-sm sm:text-base"
            >
              <Download size={18} /> Exportar PDF
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm border border-yellow-600/30 p-6 sm:p-8 rounded-xl shadow-2xl mb-6 sm:mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-gray-400 text-sm sm:text-base font-semibold mb-2">Total Recebido</h2>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                €{total.toFixed(2)}
              </p>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-600/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Desktop - Tabela */}
        <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-800 shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-gray-900 to-gray-950 text-yellow-500 text-sm">
                <th className="p-4 font-semibold">Data</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold">Cliente/Produto</th>
                <th className="p-4 font-semibold">Valor (€)</th>
                <th className="p-4 font-semibold">Responsável</th>
              </tr>
            </thead>
            <tbody className="bg-gradient-to-br from-gray-900/50 to-gray-950/50">
              {[...agendamentos, ...vendas].length ? (
                <>
                  {agendamentos.map((a) => (
                    <tr
                      key={`serv-${a.id}`}
                      className="hover:bg-gray-900/80 transition-all duration-200 border-b border-gray-800"
                    >
                      <td className="p-4 text-gray-300 text-sm">
                        {new Date(a.starts_at).toLocaleString("pt-PT")}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                          Serviço
                        </span>
                      </td>
                      <td className="p-4 text-white font-medium">
                        {a.client_name || "—"} ({a.services?.name || "—"})
                      </td>
                      <td className="p-4 font-bold text-green-400 text-lg">
                        €{(a.services?.price ?? 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-gray-300">
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
                        className="hover:bg-gray-900/80 transition-all duration-200 border-b border-gray-800"
                      >
                        <td className="p-4 text-gray-300 text-sm">
                          {new Date(v.data_venda).toLocaleString("pt-PT")}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                            Produto
                          </span>
                        </td>
                        <td className="p-4 text-white font-medium">{v.produto}</td>
                        <td className="p-4 font-bold text-green-400 text-lg">
                          €{Number(v.total).toFixed(2)}
                        </td>
                        <td className="p-4 text-gray-300">{v.vendedor || "—"}</td>
                      </tr>
                    ))}
                </>
              ) : (
                <tr>
                  <td colSpan="5" className="p-10 text-center">
                    <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-400 text-base">Nenhum registro encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile - Cards */}
        <div className="lg:hidden space-y-4">
          {[...agendamentos, ...vendas].length ? (
            <>
              {agendamentos.map((a) => (
                <div
                  key={`serv-${a.id}`}
                  className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-5 rounded-xl border border-gray-800 shadow-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                          Serviço
                        </span>
                      </div>
                      <h3 className="text-white font-bold text-base mb-1">
                        {a.client_name || "—"}
                      </h3>
                      <p className="text-gray-400 text-sm">{a.services?.name || "—"}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-green-400 font-bold text-xl whitespace-nowrap">
                        €{(a.services?.price ?? 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-sm">
                    <span className="text-gray-400">
                      {new Date(a.starts_at).toLocaleString("pt-PT")}
                    </span>
                    <span className="text-gray-300 font-medium">
                      {barberMap[a.barber_id] || barberMap[a.user_id] || "—"}
                    </span>
                  </div>
                </div>
              ))}
              {financeiroGeral &&
                vendas.map((v) => (
                  <div
                    key={`vend-${v.id}`}
                    className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-5 rounded-xl border border-gray-800 shadow-xl"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                            Produto
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-base">{v.produto}</h3>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-green-400 font-bold text-xl whitespace-nowrap">
                          €{Number(v.total).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-sm">
                      <span className="text-gray-400">
                        {new Date(v.data_venda).toLocaleString("pt-PT")}
                      </span>
                      <span className="text-gray-300 font-medium">{v.vendedor || "—"}</span>
                    </div>
                  </div>
                ))}
            </>
          ) : (
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800 rounded-xl p-10 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400">Nenhum registro encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
