"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";
import { Mail, Lock, User, Store, Loader2 } from "lucide-react";

export default function SignupDonoPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 🔹 Cria o usuário dono
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { name: nome },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const user = data?.user;
      if (!user) {
        setError("Erro ao obter usuário após criação.");
        return;
      }

      // ⏳ Aguarda um pequeno delay para o trigger terminar de criar o profile
      await new Promise((r) => setTimeout(r, 1000));

      // 🔹 Força a atualização da role do profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: nome,
          email: email,
          role: "owner",
        })
        .eq("id", user.id);

      if (updateError) {
        setError("Erro ao atualizar role: " + updateError.message);
        return;
      }

      alert("✅ Conta de dono criada com sucesso!");
      router.push("/dono");
    } catch (err) {
      console.error("💥 Exceção no handleSignup:", err);
      setError("Ocorreu um erro inesperado ao criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black py-4 sm:py-8">
      {/* Background decorative elements - reduzidos no mobile */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 sm:-top-40 sm:-right-40 sm:w-80 sm:h-80 bg-yellow-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 sm:-bottom-40 sm:-left-40 sm:w-80 sm:h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-96 sm:h-96 bg-yellow-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        <div className="bg-gray-900/95 backdrop-blur-xl p-6 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl shadow-2xl border border-yellow-600/50 relative overflow-hidden">
          {/* Decorative gradient border */}
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-yellow-600/20 via-transparent to-yellow-600/20 opacity-50"></div>
          
          <div className="relative z-10">
            {/* Logo/Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg shadow-yellow-600/30 transform hover:scale-110 transition-transform duration-300">
                <Store className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 bg-clip-text text-transparent mb-1 sm:mb-2">
                Barberly
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm px-2">Gerencie seu salão com excelência</p>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-semibold text-white text-center mb-6 sm:mb-8">
              Criar Conta de Dono
            </h2>

            {/* Error message */}
            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-in fade-in slide-in-from-top-2">
                <p className="text-red-400 text-xs sm:text-sm text-center">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
              {/* Nome field */}
              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-700 rounded-lg sm:rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-200 hover:border-gray-600"
                    required
                  />
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@email.com"
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-700 rounded-lg sm:rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-200 hover:border-gray-600"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-700 rounded-lg sm:rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-200 hover:border-gray-600"
                    required
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 sm:py-3.5 text-sm sm:text-base text-black font-semibold rounded-lg sm:rounded-xl transition-all duration-300 transform touch-manipulation ${
                  loading
                    ? "bg-yellow-700/70 opacity-70 cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 hover:shadow-lg hover:shadow-yellow-600/50 active:scale-[0.98] sm:hover:scale-[1.02]"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Criando conta…
                    </>
                  ) : (
                    "Criar Conta de Dono"
                  )}
                </span>
              </button>
            </form>

            {/* Login link */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-gray-400 text-xs sm:text-sm">
                Já tem conta?{" "}
                <a
                  href="/login"
                  className="text-yellow-500 hover:text-yellow-400 font-medium transition-colors duration-200 hover:underline underline-offset-2"
                >
                  Entrar
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
