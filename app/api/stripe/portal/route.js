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
    console.log("🔵 [PORTAL] Iniciando criação de sessão do portal...");
    
    // Tenta pegar o token do header Authorization
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    console.log("🔵 [PORTAL] Token encontrado:", !!token);
    
    const supabase = await createClient();
    
    let user;
    
    // Se tem token no header, usa ele
    if (token) {
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      
      console.log("🔵 [PORTAL] Autenticação via token:", {
        hasUser: !!userData?.user,
        userId: userData?.user?.id,
        authError: authError?.message,
      });
      
      if (authError || !userData?.user) {
        console.error("❌ [PORTAL] Token inválido:", authError);
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

      console.log("🔵 [PORTAL] Autenticação via cookies:", {
        hasUser: !!cookieUser,
        userId: cookieUser?.id,
        authError: authError?.message,
      });

      if (authError || !cookieUser) {
        console.error("❌ [PORTAL] Não autenticado:", authError);
        return NextResponse.json(
          { error: "Não autenticado." },
          { status: 401 }
        );
      }
      
      user = cookieUser;
    }

    console.log("✅ [PORTAL] Usuário autenticado:", user.id);

    // Busca customer_id usando Admin (bypassa RLS)
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle(); // maybeSingle() não falha quando não há resultado

    console.log("🔍 [PORTAL] Resultado da busca:", {
      hasSubscription: !!subscription,
      customerId: subscription?.stripe_customer_id,
      error: subError,
    });

    if (subError) {
      console.error("❌ [PORTAL] Erro ao buscar subscription:", subError);
      return NextResponse.json(
        { error: "Erro ao buscar assinatura.", details: subError.message },
        { status: 500 }
      );
    }

    if (!subscription) {
      console.error("❌ [PORTAL] Nenhuma assinatura encontrada");
      return NextResponse.json(
        { error: "Você não possui uma assinatura. Por favor, assine primeiro." },
        { status: 404 }
      );
    }

    if (!subscription.stripe_customer_id) {
      console.error("❌ [PORTAL] Subscription sem stripe_customer_id");
      return NextResponse.json(
        { error: "Assinatura incompleta. Por favor, complete o processo de assinatura." },
        { status: 400 }
      );
    }

    console.log("✅ [PORTAL] Customer ID encontrado:", subscription.stripe_customer_id);

    // Verifica se é subscription de teste (ID fake)
    const isTestCustomer = subscription.stripe_customer_id?.includes('teste');
    
    if (isTestCustomer) {
      console.log("⚠️ [PORTAL] Customer de teste detectado. Redirecionando para página de assinatura.");
      
      // Para assinaturas de teste, redireciona para a página de assinatura
      // onde o usuário pode fazer uma assinatura real
      const { data: barbearia } = await supabase
        .from("barbearias")
        .select("dono_id")
        .eq("dono_id", user.id)
        .limit(1)
        .maybeSingle();

      const redirectUrl = barbearia 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/dono/${user.id}/assinatura`
        : `${process.env.NEXT_PUBLIC_APP_URL}/assinatura`;

      return NextResponse.json({ 
        url: redirectUrl,
        isTestAccount: true,
        message: "Esta é uma conta de teste. Para gerenciar uma assinatura real, você precisa assinar primeiro."
      });
    }

    // Busca o dono_id para o return_url
    const { data: barbearia } = await supabase
      .from("barbearias")
      .select("dono_id")
      .eq("dono_id", user.id)
      .limit(1)
      .maybeSingle();

    // Define o return_url com o dono_id correto
    const returnUrl = barbearia 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dono/${user.id}/assinatura`
      : `${process.env.NEXT_PUBLIC_APP_URL}/assinatura`;

    console.log("✅ [PORTAL] Return URL:", returnUrl);

    // Cria sessão do portal
    console.log("🔵 [PORTAL] Criando sessão no Stripe...");
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    });

    console.log("✅ [PORTAL] Sessão criada com sucesso:", session.id);
    console.log("✅ [PORTAL] URL do portal:", session.url);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("❌ [PORTAL] Erro ao criar sessão do portal:", {
      message: error.message,
      stack: error.stack,
      type: error.type,
      code: error.code,
    });
    return NextResponse.json(
      { error: "Erro ao acessar portal de assinatura.", details: error.message },
      { status: 500 }
    );
  }
}

