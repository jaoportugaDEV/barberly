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
    console.log("🔵 [1/6] Iniciando criação de checkout session...");
    
    // Tenta pegar o token do header Authorization
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    console.log("🔵 [2/6] Token encontrado:", !!token);
    
    const supabase = await createClient();
    
    // Se tem token no header, usa ele
    if (token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      console.log("🔵 [3/6] Autenticação via token:", {
        hasUser: !!user,
        userId: user?.id,
        authError: authError?.message,
      });
      
      if (authError || !user) {
        console.error("❌ Token inválido:", authError);
        return NextResponse.json(
          { error: "Token de autenticação inválido." },
          { status: 401 }
        );
      }
      
      return await createCheckoutSession(supabase, user);
    }
    
    // Senão, tenta via cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("🔵 [3/6] Autenticação via cookies:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error("❌ Usuário não autenticado:", authError);
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }
    
    return await createCheckoutSession(supabase, user);
  } catch (error) {
    console.error("❌ ERRO COMPLETO:", {
      message: error.message,
      stack: error.stack,
      type: error.type,
      code: error.code,
    });
    return NextResponse.json(
      { 
        error: "Erro ao criar sessão de checkout.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

async function createCheckoutSession(supabase, user) {
  console.log("🔵 [4/6] Buscando subscription existente...");

  // Busca ou cria customer no Stripe
  // Usa supabaseAdmin para evitar problemas com RLS
  let stripeCustomerId;
  
  const { data: subscription, error: subError } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle(); // maybeSingle() não falha quando não existe registro

  if (subError) {
    console.error("❌ Erro ao buscar subscription:", subError);
    throw new Error(`Erro ao buscar subscription: ${subError.message}`);
  }

  console.log("🔵 [5/6] Subscription encontrada:", { 
    hasSubscription: !!subscription,
    hasCustomerId: !!subscription?.stripe_customer_id 
  });

  if (subscription?.stripe_customer_id) {
    stripeCustomerId = subscription.stripe_customer_id;
    console.log("✅ Usando customer existente:", stripeCustomerId);
  } else {
    console.log("🔵 Criando novo customer no Stripe...");
    
    // Cria novo customer no Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    });
    stripeCustomerId = customer.id;
    console.log("✅ Customer criado no Stripe:", stripeCustomerId);

      console.log("🔵 Salvando customer_id no banco...");
      
      // Salva customer_id no banco usando Admin (bypassa RLS)
      const { error: upsertError } = await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          status: "incomplete",
        });

      if (upsertError) {
        console.error("❌ Erro ao salvar customer_id:", upsertError);
        throw new Error(`Erro ao salvar customer: ${upsertError.message}`);
      }

    console.log("✅ Customer_id salvo no banco");
  }

  console.log("🔵 [6/6] Criando sessão de checkout no Stripe...");
  console.log("Dados:", {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  });

  // Cria sessão de checkout
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [
      {
        price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?canceled=true`,
    metadata: {
      supabase_user_id: user.id,
    },
  });

  console.log("✅ Sessão criada com sucesso:", session.id);

  return NextResponse.json({ sessionId: session.id, url: session.url });
}

