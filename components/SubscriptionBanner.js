"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { AlertCircle, Crown, Calendar, X } from "lucide-react";

export default function SubscriptionBanner() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setSubscription(sub);
    } catch (error) {
      console.error("Erro ao verificar assinatura:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !subscription || dismissed) return null;

  const isTrial = subscription.status === "trial";
  const isActive = subscription.status === "active";
  const isPastDue = subscription.status === "past_due";
  
  // Calcula dias restantes do trial
  let daysLeft = 0;
  if (isTrial && subscription.trial_end) {
    const trialEnd = new Date(subscription.trial_end);
    const today = new Date();
    daysLeft = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));
  }

  const trialExpiringSoon = isTrial && daysLeft <= 3 && daysLeft > 0;
  const trialExpired = isTrial && daysLeft <= 0;

  // Não mostra banner se assinatura está ativa e não vai cancelar
  if (isActive && !subscription.cancel_at_period_end) return null;

  return (
    <>
      {/* Banner de Trial Ativo */}
      {isTrial && daysLeft > 3 && (
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 mb-6 relative">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Período de Trial Ativo
              </h3>
              <p className="text-blue-200 text-sm mb-2">
                Você está usando o Barberly gratuitamente! Restam {daysLeft} dias de trial.
              </p>
              <p className="text-blue-300/80 text-xs">
                Aproveite para explorar todos os recursos da plataforma.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Trial Expirando em Breve */}
      {trialExpiringSoon && (
        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/40 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                ⏰ Seu trial acaba em {daysLeft} {daysLeft === 1 ? "dia" : "dias"}!
              </h3>
              <p className="text-yellow-200 text-sm mb-3">
                Continue aproveitando todos os recursos do Barberly. Assine agora e não perca seu progresso!
              </p>
              <button
                onClick={() => router.push("/assinatura")}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 transform hover:scale-105"
              >
                Assinar por €20/mês
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Trial Expirado */}
      {trialExpired && (
        <div className="bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/40 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                ❌ Seu período de trial expirou
              </h3>
              <p className="text-red-200 text-sm mb-3">
                Para continuar usando o Barberly e acessar todos os recursos, assine agora por apenas €20/mês.
              </p>
              <button
                onClick={() => router.push("/assinatura")}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 transform hover:scale-105"
              >
                Assinar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Pagamento Atrasado */}
      {isPastDue && (
        <div className="bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/40 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                ⚠️ Problema com o pagamento
              </h3>
              <p className="text-red-200 text-sm mb-3">
                Não conseguimos processar seu último pagamento. Por favor, atualize seus dados de pagamento para continuar usando a plataforma.
              </p>
              <button
                onClick={() => router.push("/assinatura")}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 transform hover:scale-105"
              >
                Atualizar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Cancelamento Agendado */}
      {isActive && subscription.cancel_at_period_end && subscription.current_period_end && (
        <div className="bg-gradient-to-r from-orange-600/20 to-orange-700/20 border border-orange-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Assinatura será cancelada
              </h3>
              <p className="text-orange-200 text-sm mb-3">
                Sua assinatura será cancelada em{" "}
                {new Date(subscription.current_period_end).toLocaleDateString("pt-PT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                . Você pode continuar usando até lá.
              </p>
              <button
                onClick={() => router.push("/assinatura")}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 transform hover:scale-105"
              >
                Reativar Assinatura
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

