"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { 
  CalendarDays, 
  Filter, 
  TrendingUp, 
  Wallet2, 
  Receipt,
  DollarSign,
  Clock,
  X
} from "lucide-react";

export default function FinanceiroPage() {
  const [barberId, setBarberId] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [filtro, setFiltro] = useState("mes"); // "mes" | "dia"
  const [dataFiltro, setDataFiltro] = useState("");

  // 🔹 Definir período atual automaticamente
  useEffect(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    
    // Define o mês atual por padrão
    setDataFiltro(`${ano}-${mes}`);
  }, []);

  // 🔹 Buscar o usuário logado
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setBarberId(user.id);
      }
    };
    getUser();
  }, []);

  // 🔹 Atualizar dados sempre que filtro ou data mudar
  useEffect(() => {
    if (barberId) {
      fetchFinanceiro();
    }
  }, [barberId, filtro, dataFiltro]);

  // 🔹 Buscar registros no banco
  async function fetchFinanceiro() {
    let query = supabase
      .from("financeiro")
      .select(
        `
        id,
        data,
        valor,
        descricao,
        services(name)
      `
      )
      .eq("barbeiro_id", barberId)
      .order("data", { ascending: false });

    // Filtros de mês e dia
    if (filtro === "mes" && dataFiltro) {
      const inicio = new Date(dataFiltro + "-01T00:00:00");
      const fim = new Date(inicio);
      fim.setMonth(fim.getMonth() + 1);
      query = query
        .gte("data", inicio.toISOString())
        .lt("data", fim.toISOString());
    } else if (filtro === "dia" && dataFiltro) {
      const inicio = new Date(dataFiltro + "T00:00:00");
      const fim = new Date(dataFiltro + "T23:59:59");
      query = query
        .gte("data", inicio.toISOString())
        .lte("data", fim.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Erro ao buscar financeiro:", error);
      setRegistros([]);
      setTotal(0);
      return;
    }

    setRegistros(data || []);
    const soma = (data || []).reduce((acc, a) => acc + (a.valor || 0), 0);
    setTotal(soma);
  }

  const formatCurrency = (valor = 0) =>
    Number(valor || 0).toLocaleString("pt-PT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const periodoLabel = (() => {
    if (!dataFiltro) return filtro === "mes" ? "mês atual" : "dia atual";
    try {
      if (filtro === "mes") {
        const dt = new Date(`${dataFiltro}-01T00:00:00`);
        const label = dt.toLocaleDateString("pt-PT", {
          month: "long",
          year: "numeric",
        });
        // Verificar se é o mês atual
        if (dataFiltro === periodoAtual) {
          return `${label} (atual)`;
        }
        return label;
      }
      const dt = new Date(`${dataFiltro}T00:00:00`);
      const label = dt.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      // Verificar se é o dia atual
      if (dataFiltro === periodoAtual) {
        return `${label} (hoje)`;
      }
      return label;
    } catch {
      return "período selecionado";
    }
  })();
  const ticketMedio = registros.length ? total / registros.length : 0;
  const ultimoRegistro = registros[0];
  const resumoCards = [
    {
      label: "💰 Total",
      value: `€${formatCurrency(total)}`,
      helper: periodoLabel,
      icon: Wallet2,
      color: "yellow",
    },
    {
      label: "📋 Registros",
      value: registros.length,
      helper: "lançamentos",
      icon: Receipt,
      color: "blue",
    },
    {
      label: "📊 Ticket Médio",
      value: `€${formatCurrency(ticketMedio)}`,
      helper: "por atendimento",
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "🕐 Último",
      value: ultimoRegistro
        ? `€${formatCurrency(ultimoRegistro.valor)}`
        : "—",
      helper: ultimoRegistro
        ? new Date(ultimoRegistro.data).toLocaleDateString("pt-PT", {
            day: "2-digit",
            month: "short",
          })
        : "Sem registros",
      icon: Clock,
      color: "purple",
    },
  ];
  // Verificar se é o período atual
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
  const diaAtual = String(hoje.getDate()).padStart(2, '0');
  const periodoAtual = filtro === "mes" ? `${anoAtual}-${mesAtual}` : `${anoAtual}-${mesAtual}-${diaAtual}`;
  const temFiltroAplicado = Boolean(dataFiltro);

  return (
    <div className="max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-2">
              💰 Financeiro
            </h1>
            <p className="text-gray-400 text-sm lg:text-base">
              Acompanhe seus ganhos e gerencie suas receitas
            </p>
          </div>
          
          {/* Badge Total Rápido */}
          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/30 backdrop-blur-sm border border-yellow-600/40 rounded-xl p-4 shadow-lg">
            <p className="text-xs text-yellow-400 mb-1">Total Atual</p>
            <p className="text-2xl lg:text-3xl font-bold text-yellow-300">
              €{formatCurrency(total)}
            </p>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
        <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/20 backdrop-blur-sm border border-yellow-600/30 rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-yellow-400">{resumoCards[0].label}</p>
            <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <Wallet2 className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-yellow-300 mb-1">{resumoCards[0].value}</p>
          <p className="text-xs text-yellow-600 capitalize">
            {resumoCards[0].helper}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 backdrop-blur-sm border border-blue-600/30 rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-blue-400">{resumoCards[1].label}</p>
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-blue-300 mb-1">{resumoCards[1].value}</p>
          <p className="text-xs text-blue-600">
            {resumoCards[1].helper}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-green-950/20 backdrop-blur-sm border border-green-600/30 rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-green-400">{resumoCards[2].label}</p>
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-green-300 mb-1">{resumoCards[2].value}</p>
          <p className="text-xs text-green-600">
            {resumoCards[2].helper}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 backdrop-blur-sm border border-purple-600/30 rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-purple-400">{resumoCards[3].label}</p>
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-purple-300 mb-1">{resumoCards[3].value}</p>
          <p className="text-xs text-purple-600 capitalize">
            {resumoCards[3].helper}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm border border-gray-800 rounded-xl p-4 lg:p-6 mb-6 lg:mb-8 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-bold text-white">Filtrar Período</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Tipo de filtro */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Tipo
            </label>
            <select
              value={filtro}
              onChange={(e) => {
                const novoFiltro = e.target.value;
                setFiltro(novoFiltro);
                
                // Atualizar automaticamente para o período atual
                const hoje = new Date();
                const ano = hoje.getFullYear();
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                const dia = String(hoje.getDate()).padStart(2, '0');
                
                if (novoFiltro === "mes") {
                  setDataFiltro(`${ano}-${mes}`);
                } else if (novoFiltro === "dia") {
                  setDataFiltro(`${ano}-${mes}-${dia}`);
                }
              }}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white transition-all"
            >
              <option value="mes" className="bg-gray-800">📅 Por mês</option>
              <option value="dia" className="bg-gray-800">📆 Por dia</option>
            </select>
          </div>

          {/* Seletor de período */}
          <div className="lg:col-span-5">
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Período
            </label>
            {filtro === "mes" ? (
              <input
                type="month"
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white transition-all"
              />
            ) : (
              <input
                type="date"
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white transition-all"
              />
            )}
          </div>

          {/* Botões de ação */}
          <div className="lg:col-span-4 flex gap-2 lg:items-end">
            <button
              onClick={() => {
                // Redefinir para o período atual
                const hoje = new Date();
                const ano = hoje.getFullYear();
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                const dia = String(hoje.getDate()).padStart(2, '0');
                
                if (filtro === "mes") {
                  setDataFiltro(`${ano}-${mes}`);
                } else {
                  setDataFiltro(`${ano}-${mes}-${dia}`);
                }
              }}
              className="flex items-center justify-center gap-2 bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm border border-gray-700 hover:border-yellow-500 text-gray-300 hover:text-yellow-400 px-4 py-3 rounded-lg transition-all duration-200"
              title={filtro === "mes" ? "Voltar ao mês atual" : "Voltar ao dia atual"}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">{filtro === "mes" ? "Mês Atual" : "Hoje"}</span>
              <span className="sm:hidden">Atual</span>
            </button>
            <button
              onClick={fetchFinanceiro}
              className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-semibold px-5 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* Badge do período ativo */}
        {dataFiltro && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <CalendarDays className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-yellow-400 font-medium">
              Período: <span className="capitalize font-bold">{periodoLabel}</span>
            </span>
            {dataFiltro === periodoAtual && (
              <span className="ml-2 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400 font-semibold">
                Atual
              </span>
            )}
          </div>
        )}
      </div>

      {/* Lista de Registros */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-bold text-white">
            Lançamentos
            {registros.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({registros.length} {registros.length === 1 ? 'registro' : 'registros'})
              </span>
            )}
          </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm shadow-xl">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-700">
                <th className="p-4 text-left text-sm font-semibold text-yellow-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Data/Hora
                  </div>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-yellow-400">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Serviço
                  </div>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-yellow-400">
                  Descrição
                </th>
                <th className="p-4 text-right text-sm font-semibold text-yellow-400">
                  <div className="flex items-center justify-end gap-2">
                    <DollarSign className="w-4 h-4" />
                    Valor
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {registros.length > 0 ? (
                registros.map((r, index) => (
                  <tr
                    key={r.id}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-all duration-200 ${
                      index % 2 === 0 ? 'bg-gray-900/20' : 'bg-transparent'
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">
                          {new Date(r.data).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(r.data).toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-medium">
                        {r.services?.name || "Serviço"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-400">
                        {r.descricao || "—"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-green-400 font-bold text-lg">
                        €{formatCurrency(r.valor)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="p-12 text-center"
                  >
                    <Wallet2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nenhum registro encontrado</p>
                    <p className="text-gray-600 text-sm mt-1">
                      {temFiltroAplicado 
                        ? "Tente ajustar os filtros" 
                        : "Os lançamentos aparecerão aqui"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {registros.length > 0 ? (
            registros.map((r) => (
              <div
                key={r.id}
                className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm border border-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-white font-bold">
                        {r.services?.name || "Serviço"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(r.data).toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })} às {new Date(r.data).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5">
                    <span className="text-green-400 font-bold text-base">
                      €{formatCurrency(r.valor)}
                    </span>
                  </div>
                </div>
                {r.descricao && (
                  <div className="bg-gray-800/50 rounded-lg p-2 mt-2">
                    <p className="text-sm text-gray-400">
                      {r.descricao}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-gray-800/30 rounded-xl p-12 text-center border border-gray-800/50">
              <Wallet2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum registro encontrado</p>
              <p className="text-gray-600 text-sm mt-1">
                {temFiltroAplicado 
                  ? "Tente ajustar os filtros" 
                  : "Os lançamentos aparecerão aqui"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
