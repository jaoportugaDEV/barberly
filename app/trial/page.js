"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { CheckCircle2, Sparkles, Zap, TrendingUp, Shield, Loader2 } from "lucide-react";

export default function TrialPage() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkExistingTrial();
  }, []);

  const checkExistingTrial = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      // Verifica se já tem assinatura
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (subscription) {
        // Já tem trial ou assinatura, redireciona para signup
        router.push("/signup");
        return;
      }

      setChecking(false);
    } catch (error) {
      console.error("Erro ao verificar trial:", error);
      setChecking(false);
    }
  };

  const handleStartTrial = async () => {
    setLoading(true);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert("Por favor, faça login primeiro.");
        router.push("/login");
        return;
      }

      // Calcula datas do trial (7 dias)
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      // Cria o registro de trial
      const { error: subError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          status: "trial",
          trial_start: trialStart.toISOString(),
          trial_end: trialEnd.toISOString(),
        });

      if (subError) {
        console.error("Erro ao criar trial:", subError);
        alert("Erro ao iniciar período de teste. Tente novamente.");
        return;
      }

      // Redireciona para página de signup
      router.push("/signup");
    } catch (error) {
      console.error("Erro ao iniciar trial:", error);
      alert("Erro ao iniciar período de teste. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToPayment = () => {
    router.push("/assinatura");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
          <p className="text-gray-400">Verificando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl mb-6 shadow-lg shadow-yellow-600/30">
            <Sparkles className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 bg-clip-text text-transparent mb-4">
            Bem-vindo ao Barberly
          </h1>
          <p className="text-xl text-gray-300">
            Escolha como deseja começar
          </p>
        </div>

        {/* Cards com opções */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card Trial Gratuito */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-yellow-600/50 shadow-xl relative overflow-hidden group hover:border-yellow-500 transition-all duration-300">
            {/* Badge "Recomendado" */}
            <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
              RECOMENDADO
            </div>
            
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-xl mb-4">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Trial Gratuito de 7 Dias
              </h2>
              <p className="text-gray-400">
                Experimente todos os recursos sem compromisso
              </p>
            </div>

            <div className="mb-8 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">Acesso completo por 7 dias</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">Sem cartão de crédito necessário</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">Cancele a qualquer momento</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">Configure tudo no seu tempo</span>
              </div>
            </div>

            <button
              onClick={handleStartTrial}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando...
                </span>
              ) : (
                "Iniciar Trial Gratuito"
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Após 7 dias: €20/mês
            </p>
          </div>

          {/* Card Assinatura Direta */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-xl relative overflow-hidden group hover:border-gray-600 transition-all duration-300">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-xl mb-4">
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Assinar Agora
              </h2>
              <p className="text-gray-400">
                Comece imediatamente com acesso total
              </p>
            </div>

            <div className="mb-8 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">Todos os recursos premium</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">Suporte prioritário</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">Sem interrupções</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">Faturamento mensal</span>
              </div>
            </div>

            <button
              onClick={handleGoToPayment}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Assinar por €20/mês
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Cancele quando quiser
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Tudo incluído no Barberly
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Gestão de Agendamentos</h4>
                <p className="text-sm text-gray-400">Calendário intuitivo e notificações</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Controle Financeiro</h4>
                <p className="text-sm text-gray-400">Relatórios e análises detalhadas</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Gestão de Estoque</h4>
                <p className="text-sm text-gray-400">Controle completo de produtos</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Múltiplas Barbearias</h4>
                <p className="text-sm text-gray-400">Gerencie todos os seus salões</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Dashboard Completo</h4>
                <p className="text-sm text-gray-400">Visão geral de tudo em tempo real</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Segurança Total</h4>
                <p className="text-sm text-gray-400">Seus dados sempre protegidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

