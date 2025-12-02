import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabaseServer";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Cliente Supabase Admin (bypassa RLS)
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req) {
  try {
    console.log("🔵 [REACTIVATE] Iniciando reativação de assinatura...");
    
    // Tenta pegar o token do header Authorization
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    const supabase = await createClient();
    
    let user;
    
    // Se tem token no header, usa ele
    if (token) {
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !userData?.user) {
        console.error("❌ [REACTIVATE] Token inválido:", authError);
        return NextResponse.json(
          { error: "Token de autenticação inválido." },
          { status: 401 }
        );
      }
      
      user = userData.user;
    } else {
      // Senão, tenta via cookies
      const {
        data: { user: cookieUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !cookieUser) {
        console.error("❌ [REACTIVATE] Não autenticado:", authError);
        return NextResponse.json(
          { error: "Não autenticado." },
          { status: 401 }
        );
      }
      
      user = cookieUser;
    }

    console.log("✅ [REACTIVATE] Usuário autenticado:", user.id);

    // Busca subscription usando Admin (bypassa RLS)
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("🔍 [REACTIVATE] Resultado da busca:", {
      hasSubscription: !!subscription,
      subscriptionId: subscription?.stripe_subscription_id,
      error: subError,
    });

    if (subError) {
      console.error("❌ [REACTIVATE] Erro ao buscar assinatura:", subError);
      return NextResponse.json(
        { error: "Erro ao buscar assinatura.", details: subError.message },
        { status: 500 }
      );
    }

    if (!subscription) {
      console.error("❌ [REACTIVATE] Nenhuma assinatura encontrada para o usuário");
      return NextResponse.json(
        { error: "Você não possui uma assinatura ativa." },
        { status: 404 }
      );
    }

    if (!subscription.stripe_subscription_id) {
      console.error("❌ [REACTIVATE] Subscription sem stripe_subscription_id");
      return NextResponse.json(
        { error: "Assinatura incompleta. Por favor, entre em contato com o suporte." },
        { status: 400 }
      );
    }

    console.log("✅ [REACTIVATE] Subscription encontrada:", subscription.stripe_subscription_id);

    // Verifica se é subscription de teste (ID fake)
    const isTestSubscription = subscription.stripe_subscription_id?.includes('teste');
    
    let reactivatedSubscription;
    if (isTestSubscription) {
      console.log("⚠️ [REACTIVATE] Subscription de TESTE detectada - pulando Stripe");
      // Para teste, cria um objeto fake
      reactivatedSubscription = {
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 dias
      };
    } else {
      // Reativa no Stripe de verdade
      console.log("🔵 [REACTIVATE] Reativando no Stripe...");
      reactivatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: false,
        }
      );
      console.log("✅ [REACTIVATE] Reativada no Stripe");
    }

    // Atualiza no banco usando Admin
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: false,
        status: "active",
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("❌ [REACTIVATE] Erro ao atualizar banco:", updateError);
    } else {
      console.log("✅ [REACTIVATE] Banco atualizado com sucesso");
    }

    return NextResponse.json({
      success: true,
      message: "Assinatura reativada com sucesso!",
      periodEnd: new Date(reactivatedSubscription.current_period_end * 1000),
    });
  } catch (error) {
    console.error("❌ [REACTIVATE] Erro ao reativar assinatura:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Erro ao reativar assinatura.", details: error.message },
      { status: 500 }
    );
  }
}

