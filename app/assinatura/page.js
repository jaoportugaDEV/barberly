"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  BarChart
} from "lucide-react";

export default function AssinaturaPage() {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const canceled = searchParams.get("canceled");
  const success = searchParams.get("success");

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
        .maybeSingle(); // maybeSingle() não falha quando não há resultado

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
      // Pega o token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("Você precisa estar logado para assinar.");
        router.push("/login");
        return;
      }

      console.log("🔵 Enviando requisição para criar checkout...");
      console.log("Token:", session.access_token ? "Presente" : "Ausente");
      
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include", // Garante que cookies sejam enviados
      });

      console.log("📊 Status da resposta:", response.status);

      const data = await response.json();
      console.log("📦 Dados recebidos:", data);

      if (!response.ok) {
        console.error("❌ Erro na API:", data);
        alert(`Erro: ${data.error || 'Erro desconhecido'}\nDetalhes: ${data.details || 'Sem detalhes'}`);
        return;
      }

      if (data.error) {
        alert(data.error);
        return;
      }

      // Redireciona diretamente para a URL do checkout
      if (data.url) {
        console.log("✅ Redirecionando para checkout...");
        window.location.href = data.url;
      } else {
        console.error("❌ URL de checkout não recebida");
        alert("Erro: URL de checkout não foi recebida.");
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      alert("Erro ao processar pagamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);

    try {
      // Pega o token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("Você precisa estar logado para gerenciar a assinatura.");
        router.push("/login");
        return;
      }

      console.log("🔵 Acessando portal de gerenciamento...");
      console.log("Token:", session.access_token ? "Presente" : "Ausente");
      
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include", // Garante que cookies sejam enviados
      });

      console.log("📊 Status da resposta:", response.status);

      const data = await response.json();
      console.log("📦 Dados recebidos:", data);

      if (!response.ok) {
        console.error("❌ Erro na API:", data);
        alert(`Erro: ${data.error || 'Erro desconhecido'}\nDetalhes: ${data.details || 'Sem detalhes'}`);
        return;
      }

      if (data.error) {
        alert(data.error);
        return;
      }

      // Verifica se é uma conta de teste
      if (data.isTestAccount) {
        console.log("⚠️ Conta de teste detectada");
        alert("Esta é uma conta de teste. Para gerenciar uma assinatura real, você precisa assinar primeiro.");
        // Atualiza a página para mostrar as opções corretas
        window.location.reload();
        return;
      }

      // Redireciona para o portal do Stripe
      if (data.url) {
        console.log("✅ Redirecionando para portal...");
        window.location.href = data.url;
      } else {
        console.error("❌ URL do portal não recebida");
        alert("Erro: URL do portal não foi recebida.");
      }
    } catch (error) {
      console.error("Erro ao acessar portal:", error);
      alert("Erro ao acessar portal de assinatura.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
          <p className="text-gray-400">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  const isActive = subscription?.status === "active";
  const isTrial = subscription?.status === "trial";
  const trialEnded = isTrial && subscription?.trial_end && new Date(subscription.trial_end) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Alertas */}
        {canceled && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400">Pagamento cancelado. Você pode tentar novamente quando quiser.</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-400">✅ Pagamento realizado com sucesso! Bem-vindo ao Saloniq Premium.</p>
          </div>
        )}

        {trialEnded && !isActive && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <p className="text-yellow-400">⚠️ Seu período de trial expirou. Assine agora para continuar usando a plataforma.</p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 bg-clip-text text-transparent mb-4">
            {isActive ? "Sua Assinatura" : "Assine o Saloniq"}
          </h1>
          <p className="text-xl text-gray-300">
            {isActive 
              ? "Gerencie sua assinatura e pagamentos" 
              : "Gerencie suas barbearias com excelência"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Plano de Assinatura */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm rounded-2xl border-2 border-yellow-600/50 p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-black" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Plano Premium</h2>
                    <p className="text-gray-400">Acesso completo a todos os recursos</p>
                  </div>
                </div>
                {isActive && (
                  <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold border border-green-500/30">
                    Ativo
                  </div>
                )}
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">€20</span>
                  <span className="text-gray-400 text-xl">/mês</span>
                </div>
                <p className="text-gray-400 mt-2">Cancele quando quiser, sem taxas adicionais</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Barbearias Ilimitadas</span>
                    <p className="text-sm text-gray-400">Gerencie quantas barbearias precisar</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Agendamentos Ilimitados</span>
                    <p className="text-sm text-gray-400">Sem limites de reservas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Controle Financeiro Completo</span>
                    <p className="text-sm text-gray-400">Relatórios e análises detalhadas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Gestão de Estoque</span>
                    <p className="text-sm text-gray-400">Controle de produtos e vendas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Dashboard em Tempo Real</span>
                    <p className="text-sm text-gray-400">Acompanhe tudo em tempo real</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Suporte Prioritário</span>
                    <p className="text-sm text-gray-400">Atendimento rápido e dedicado</p>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              {isActive ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Carregando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Gerenciar Assinatura
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
              )}
            </div>
          </div>

          {/* Sidebar com informações */}
          <div className="space-y-6">
            {/* Status atual */}
            {subscription && (
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  Status Atual
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="text-white font-semibold capitalize">
                      {subscription.status === "trial" && "Período de Teste"}
                      {subscription.status === "active" && "Ativo"}
                      {subscription.status === "canceled" && "Cancelado"}
                      {subscription.status === "past_due" && "Pagamento Pendente"}
                    </p>
                  </div>
                  {isTrial && subscription.trial_end && (
                    <div>
                      <p className="text-sm text-gray-400">Trial termina em</p>
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
                    <div>
                      <p className="text-sm text-gray-400">Próxima renovação</p>
                      <p className="text-white font-semibold">
                        {new Date(subscription.current_period_end).toLocaleDateString("pt-PT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recursos principais */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">O que você terá</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Equipe ilimitada</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Controle de estoque</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <BarChart className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Relatórios avançados</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Dados seguros</span>
                </div>
              </div>
            </div>

            {/* Garantia */}
            <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 backdrop-blur-sm rounded-xl p-6 border border-green-700/30">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-bold text-white">Garantia</h3>
              </div>
              <p className="text-sm text-gray-300">
                Cancele quando quiser, sem taxas de cancelamento. Seus dados estarão sempre seguros e disponíveis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

