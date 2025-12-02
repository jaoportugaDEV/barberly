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
    console.log("🔵 [CANCEL] Iniciando cancelamento de assinatura...");
    
    // Tenta pegar o token do header Authorization
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    const supabase = await createClient();
    
    let user;
    
    // Se tem token no header, usa ele
    if (token) {
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !userData?.user) {
        console.error("❌ [CANCEL] Token inválido:", authError);
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
        console.error("❌ [CANCEL] Não autenticado:", authError);
        return NextResponse.json(
          { error: "Não autenticado." },
          { status: 401 }
        );
      }
      
      user = cookieUser;
    }

    console.log("✅ [CANCEL] Usuário autenticado:", user.id);
    console.log("📧 [CANCEL] Email do usuário:", user.email);

    // Busca subscription usando Admin (bypassa RLS)
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_subscription_id, status, cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("🔍 [CANCEL] Subscription do usuário:", {
      userId: user.id,
      hasSubscription: !!subscription,
      subscriptionId: subscription?.stripe_subscription_id,
      subscriptionData: subscription,
      error: subError,
    });

    if (subError) {
      console.error("❌ [CANCEL] Erro ao buscar assinatura:", subError);
      return NextResponse.json(
        { error: "Erro ao buscar assinatura.", details: subError.message },
        { status: 500 }
      );
    }

    if (!subscription) {
      console.error("❌ [CANCEL] Nenhuma assinatura encontrada para o usuário");
      return NextResponse.json(
        { error: "Você não possui uma assinatura ativa." },
        { status: 404 }
      );
    }

    if (!subscription.stripe_subscription_id) {
      console.error("❌ [CANCEL] Subscription sem stripe_subscription_id");
      return NextResponse.json(
        { error: "Assinatura incompleta. Por favor, entre em contato com o suporte." },
        { status: 400 }
      );
    }

    console.log("✅ [CANCEL] Subscription encontrada:", subscription.stripe_subscription_id);

    // Verifica se é subscription de teste (ID fake)
    const isTestSubscription = subscription.stripe_subscription_id?.includes('teste');
    
    let canceledSubscription;
    if (isTestSubscription) {
      console.log("⚠️ [CANCEL] Subscription de TESTE detectada - pulando Stripe");
      // Para teste, cria um objeto fake
      canceledSubscription = {
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 dias
      };
    } else {
      // Cancela no Stripe de verdade
      console.log("🔵 [CANCEL] Cancelando no Stripe...");
      canceledSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      );
      console.log("✅ [CANCEL] Cancelada no Stripe. Period end:", canceledSubscription.current_period_end);
    }

    // Atualiza no banco usando Admin
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("❌ [CANCEL] Erro ao atualizar banco:", updateError);
    } else {
      console.log("✅ [CANCEL] Banco atualizado com sucesso");
    }

    return NextResponse.json({
      success: true,
      message: "Assinatura será cancelada no final do período.",
      periodEnd: new Date(canceledSubscription.current_period_end * 1000),
    });
  } catch (error) {
    console.error("❌ [CANCEL] Erro ao cancelar assinatura:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Erro ao cancelar assinatura.", details: error.message },
      { status: 500 }
    );
  }
}

