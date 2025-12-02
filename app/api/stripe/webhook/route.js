import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Supabase admin client para bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Erro ao verificar webhook:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook." },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session) {
  console.log("🔔 Checkout completado:", session.id);

  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error("User ID não encontrado no metadata");
    return;
  }

  const subscriptionId = session.subscription;
  const customerId = session.customer;

  // Atualiza registro de subscription
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status: "active",
      trial_start: null,
      trial_end: null,
    });

  if (error) {
    console.error("Erro ao atualizar subscription:", error);
  }
}

async function handleSubscriptionUpdate(subscription) {
  console.log("🔔 Subscription atualizada:", subscription.id);

  const customerId = subscription.customer;

  // Busca user_id pelo customer_id
  const { data: subData } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!subData) {
    console.error("Subscription não encontrada para customer:", customerId);
    return;
  }

  let status = subscription.status;
  
  // Mapeia status do Stripe para nosso sistema
  if (status === "trialing") status = "trial";
  if (status === "active") status = "active";
  if (status === "canceled" || status === "unpaid") status = "canceled";
  if (status === "past_due") status = "past_due";
  if (status === "incomplete") status = "incomplete";

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id,
      status: status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("user_id", subData.user_id);

  if (error) {
    console.error("Erro ao atualizar subscription:", error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log("🔔 Subscription deletada:", subscription.id);

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Erro ao atualizar subscription deletada:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log("🔔 Pagamento bem-sucedido:", invoice.id);

  if (!invoice.subscription) return;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
    })
    .eq("stripe_subscription_id", invoice.subscription);

  if (error) {
    console.error("Erro ao atualizar status após pagamento:", error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log("🔔 Falha no pagamento:", invoice.id);

  if (!invoice.subscription) return;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "past_due",
    })
    .eq("stripe_subscription_id", invoice.subscription);

  if (error) {
    console.error("Erro ao atualizar status após falha de pagamento:", error);
  }
}

