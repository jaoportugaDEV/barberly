"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("➡️ Iniciando login…", { email });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      console.log("🔎 Resposta do Supabase:", { data, error });

      if (error) {
        console.error("❌ Erro no login:", error);
        setError(error.message || "Falha ao entrar.");
        return;
      }

      if (!data?.user) {
        console.error("⚠️ Login sem user retornado:", data);
        setError("Erro inesperado: usuário não retornado.");
        return;
      }

      // (opcional) conferir sessão imediatamente
      const { data: sess } = await supabase.auth.getSession();
      console.log("🟢 Sessão atual:", sess);

      // força re-render pra middleware/SSR capturar os cookies da sessão
      router.refresh();

      // pequena folga pra cookie aplicar (evita “refresh e nada acontece”)
      await new Promise((r) => setTimeout(r, 150));

      console.log("➡️ Redirecionando para /dashboard…");
      router.replace("/dashboard");
    } catch (err) {
      console.error("💥 Exceção no handleLogin:", err);
      setError("Ocorreu um erro inesperado ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="bg-gray-900 p-10 rounded-xl shadow-2xl border border-yellow-600 w-full max-w-md">
        <h1 className="text-3xl font-bold text-yellow-500 text-center mb-6">
          Barberly
        </h1>
        <h2 className="text-xl font-semibold text-white text-center mb-6">
          Entrar
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              className="w-full px-4 py-2 mt-1 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="********"
              className="w-full px-4 py-2 mt-1 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 text-black font-semibold rounded-lg transition duration-200 ${
              loading
                ? "bg-yellow-700 opacity-70 cursor-not-allowed"
                : "bg-yellow-600 hover:bg-yellow-700"
            }`}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Não tem conta?{" "}
          <a href="/signup" className="text-yellow-500 hover:underline">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}
