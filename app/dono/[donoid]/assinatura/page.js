"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { 
  CreditCard, 
  Check, 
  AlertCircle, 
  Loader2,
  Calendar,
  Shield,
  TrendingUp,
  Users,
  Package,
  BarChart,
  ExternalLink,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

export default function AssinaturaDonoPage() {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [checking, setChecking] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push("/login");
        return;
      }

      const { data: sub, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subError) {
        console.error("Erro ao buscar subscription:", subError);
      } else {
        setSubscription(sub);
      }
    } catch (error) {
      console.error("Erro ao verificar assinatura:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("Você precisa estar logado para assinar.");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Erro: ${data.error || 'Erro desconhecido'}`);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erro: URL de checkout não foi recebida.");
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      alert("Erro ao processar pagamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setActionLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("Você precisa estar logado.");
        router.push("/login");
        return;
      }

      console.log("🔵 Cancelando assinatura...");
      
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Erro na API:", data);
        alert(`Erro: ${data.error || 'Erro desconhecido'}`);
        return;
      }

      console.log("✅ Assinatura cancelada com sucesso");
      alert("Assinatura cancelada! Você ainda terá acesso até o final do período pago.");
      setShowCancelModal(false);
      checkSubscription(); // Recarrega os dados
    } catch (error) {
      console.error("❌ Erro ao cancelar:", error);
      alert("Erro ao cancelar assinatura.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setActionLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("Você precisa estar logado.");
        router.push("/login");
        return;
      }

      console.log("🔵 Reativando assinatura...");
      
      const response = await fetch("/api/stripe/reactivate-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Erro na API:", data);
        alert(`Erro: ${data.error || 'Erro desconhecido'}`);
        return;
      }

      console.log("✅ Assinatura reativada com sucesso");
      alert("Assinatura reativada com sucesso!");
      setShowReactivateModal(false);
      checkSubscription(); // Recarrega os dados
    } catch (error) {
      console.error("❌ Erro ao reativar:", error);
      alert("Erro ao reativar assinatura.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return {
          icon: CheckCircle2,
          text: "Ativo",
          className: "bg-green-500/20 text-green-400 border-green-500/30"
        };
      case "trial":
        return {
          icon: Clock,
          text: "Período de Teste",
          className: "bg-blue-500/20 text-blue-400 border-blue-500/30"
        };
      case "canceled":
        return {
          icon: XCircle,
          text: "Cancelado",
          className: "bg-red-500/20 text-red-400 border-red-500/30"
        };
      case "past_due":
        return {
          icon: AlertTriangle,
          text: "Pagamento Pendente",
          className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        };
      default:
        return {
          icon: AlertCircle,
          text: "Desconhecido",
          className: "bg-gray-500/20 text-gray-400 border-gray-500/30"
        };
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
          <p className="text-gray-400">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  const isActive = subscription?.status === "active";
  const isTrial = subscription?.status === "trial";
  const isCanceled = subscription?.status === "canceled";
  const isPastDue = subscription?.status === "past_due";
  const willCancel = subscription?.cancel_at_period_end === true;
  const trialEnded = isTrial && subscription?.trial_end && new Date(subscription.trial_end) < new Date();
  const hasSubscription = subscription !== null;

  const statusBadge = subscription ? getStatusBadge(subscription.status) : null;
  const StatusIcon = statusBadge?.icon;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-2">
          Gerenciar Assinatura
        </h1>
        <p className="text-gray-400 text-sm lg:text-base">
          {hasSubscription 
            ? "Gerencie sua assinatura e veja os detalhes do seu plano" 
            : "Assine agora para ter acesso completo à plataforma"}
        </p>
      </div>

      {/* Alertas */}
      {trialEnded && !isActive && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-semibold mb-1">Período de teste expirado</p>
            <p className="text-yellow-300/80 text-sm">
              Seu período de teste expirou. Assine agora para continuar usando a plataforma e não perder acesso aos seus dados.
            </p>
          </div>
        </div>
      )}

      {isPastDue && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold mb-1">Pagamento pendente</p>
            <p className="text-red-300/80 text-sm">
              Há um problema com o pagamento da sua assinatura. Atualize seus dados de pagamento para continuar usando a plataforma.
            </p>
          </div>
        </div>
      )}

      {isCanceled && (
        <div className="mb-6 bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-400 font-semibold mb-1">Assinatura cancelada</p>
            <p className="text-gray-300/80 text-sm">
              Sua assinatura foi cancelada. Você ainda tem acesso até o fim do período pago. Reative quando quiser!
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Card principal da assinatura */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status atual */}
          {hasSubscription && (
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm rounded-xl border border-gray-800 p-6 lg:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 lg:w-7 lg:h-7 text-black" />
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-white">Plano Premium</h2>
                    <p className="text-gray-400 text-sm lg:text-base">€20/mês</p>
                  </div>
                </div>
                {statusBadge && (
                  <div className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full text-sm font-semibold border ${statusBadge.className}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusBadge.text}
                  </div>
                )}
              </div>

              {/* Informações da assinatura */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-800">
                {isTrial && subscription.trial_end && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <p className="text-sm text-gray-400">Trial termina em</p>
                    </div>
                    <p className="text-white font-semibold">
                      {new Date(subscription.trial_end).toLocaleDateString("pt-PT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {isActive && subscription.current_period_end && (
                  <>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-yellow-400" />
                        <p className="text-sm text-gray-400">Próxima renovação</p>
                      </div>
                      <p className="text-white font-semibold">
                        {new Date(subscription.current_period_end).toLocaleDateString("pt-PT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-green-400" />
                        <p className="text-sm text-gray-400">Valor</p>
                      </div>
                      <p className="text-white font-semibold text-xl">€20,00</p>
                    </div>
                  </>
                )}
              </div>

              {/* Botões de ação */}
              <div className="space-y-3">
                {willCancel ? (
                  <>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-yellow-400 font-semibold mb-1">Cancelamento agendado</p>
                          <p className="text-yellow-300/80 text-sm">
                            Sua assinatura será cancelada em{" "}
                            {subscription.current_period_end && new Date(subscription.current_period_end).toLocaleDateString("pt-PT")}. 
                            Você ainda tem acesso até lá.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowReactivateModal(true)}
                      disabled={actionLoading}
                      className="w-full py-3 lg:py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-green-600/20"
                    >
                      {actionLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          Reativar Assinatura
                        </span>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={actionLoading}
                    className="w-full py-3 lg:py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-red-600/20"
                  >
                    {actionLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <XCircle className="w-5 h-5" />
                        Cancelar Assinatura
                      </span>
                    )}
                  </button>
                )}
                <p className="text-gray-400 text-xs lg:text-sm text-center">
                  {willCancel 
                    ? "Reative sua assinatura para continuar tendo acesso após o período atual"
                    : "Você pode cancelar a qualquer momento sem taxas adicionais"}
                </p>
              </div>
            </div>
          )}

          {/* Card de assinatura (quando não tem) */}
          {!hasSubscription && (
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm rounded-2xl border-2 border-yellow-600/50 p-6 lg:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 lg:w-7 lg:h-7 text-black" />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-white">Plano Premium</h2>
                  <p className="text-gray-400 text-sm lg:text-base">Acesso completo a todos os recursos</p>
                </div>
              </div>

              <div className="mb-6 lg:mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-bold text-white">€20</span>
                  <span className="text-gray-400 text-lg lg:text-xl">/mês</span>
                </div>
                <p className="text-gray-400 mt-2 text-sm lg:text-base">Cancele quando quiser, sem taxas adicionais</p>
              </div>

              {/* Features */}
              <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium text-sm lg:text-base">Barbearias Ilimitadas</span>
                    <p className="text-xs lg:text-sm text-gray-400">Gerencie quantas barbearias precisar</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium text-sm lg:text-base">Agendamentos Ilimitados</span>
                    <p className="text-xs lg:text-sm text-gray-400">Sem limites de reservas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium text-sm lg:text-base">Controle Financeiro Completo</span>
                    <p className="text-xs lg:text-sm text-gray-400">Relatórios e análises detalhadas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium text-sm lg:text-base">Gestão de Estoque</span>
                    <p className="text-xs lg:text-sm text-gray-400">Controle de produtos e vendas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium text-sm lg:text-base">Dashboard em Tempo Real</span>
                    <p className="text-xs lg:text-sm text-gray-400">Acompanhe tudo em tempo real</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium text-sm lg:text-base">Suporte Prioritário</span>
                    <p className="text-xs lg:text-sm text-gray-400">Atendimento rápido e dedicado</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3 lg:py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-yellow-600/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Assinar Agora
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Benefícios */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm rounded-xl border border-gray-800 p-6 lg:p-8 shadow-xl">
            <h3 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6">Por que assinar o Saloniq?</h3>
            <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1 text-sm lg:text-base">Aumente seus lucros</h4>
                  <p className="text-gray-400 text-xs lg:text-sm">Controle financeiro completo para maximizar ganhos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1 text-sm lg:text-base">Gerencie sua equipe</h4>
                  <p className="text-gray-400 text-xs lg:text-sm">Acompanhe o desempenho de cada colaborador</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1 text-sm lg:text-base">Agenda inteligente</h4>
                  <p className="text-gray-400 text-xs lg:text-sm">Nunca mais perca um agendamento</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1 text-sm lg:text-base">Controle de estoque</h4>
                  <p className="text-gray-400 text-xs lg:text-sm">Gerencie produtos e evite desperdícios</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recursos inclusos */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm rounded-xl border border-gray-800 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-400" />
              Incluído no plano
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-gray-300 text-sm">Equipe ilimitada</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-gray-300 text-sm">Controle de estoque</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-gray-300 text-sm">Relatórios avançados</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-gray-300 text-sm">Dados seguros</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-gray-300 text-sm">Agendamentos ilimitados</span>
              </div>
            </div>
          </div>

          {/* Garantia */}
          <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 backdrop-blur-sm rounded-xl border border-green-700/30 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-bold text-white">100% Garantido</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Cancele quando quiser, sem taxas de cancelamento. Seus dados estarão sempre seguros e disponíveis.
            </p>
            <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
              <Check className="w-4 h-4" />
              Sem compromisso de longo prazo
            </div>
          </div>

          {/* FAQ rápido */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm rounded-xl border border-gray-800 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Perguntas Frequentes</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-white font-semibold mb-1">Como cancelo?</p>
                <p className="text-gray-400">Clique em "Gerenciar no Portal Stripe" e cancele a qualquer momento.</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Os dados ficam salvos?</p>
                <p className="text-gray-400">Sim! Todos os seus dados permanecem seguros mesmo após cancelamento.</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Posso mudar de plano?</p>
                <p className="text-gray-400">No momento temos apenas um plano, mas novos planos virão em breve!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-red-600/50 p-6 lg:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-white">Cancelar Assinatura?</h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                Tem certeza que deseja cancelar sua assinatura?
              </p>
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    Você manterá acesso até o final do período pago
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    Seus dados permanecerão salvos
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    Você pode reativar a qualquer momento
                  </p>
                </div>
              </div>
              {subscription?.current_period_end && (
                <p className="text-yellow-400 text-sm font-semibold">
                  Acesso até: {new Date(subscription.current_period_end).toLocaleDateString("pt-PT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                Não, manter assinatura
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelando...
                  </span>
                ) : (
                  "Sim, cancelar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reativação */}
      {showReactivateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-green-600/50 p-6 lg:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-white">Reativar Assinatura?</h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                Ótima escolha! Ao reativar sua assinatura:
              </p>
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    O cancelamento será cancelado
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    Sua assinatura continuará automaticamente
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    Sem interrupção no serviço
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowReactivateModal(false)}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={handleReactivateSubscription}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reativando...
                  </span>
                ) : (
                  "Sim, reativar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

