"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Não está logado, vai para login
        router.push("/login");
        return;
      }

      // Verifica o perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, barbearia_id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/trial");
        return;
      }

      // Redireciona conforme tipo de conta
      if (profile.role === "owner") {
        // Verifica subscription
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("status, trial_end")
          .eq("user_id", user.id)
          .single();

        if (!subscription) {
          router.push("/trial");
          return;
        }

        router.push("/dono/[donoid]");
      } else if (profile.role === "barber") {
        if (profile.barbearia_id) {
          router.push(`/dashboard/${profile.barbearia_id}`);
        } else {
          router.push("/login");
        }
      } else {
        router.push("/trial");
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
        <p className="text-gray-400">Carregando...</p>
      </div>
    </div>
  );
}
