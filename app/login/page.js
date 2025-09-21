"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Login com:\nEmail: ${email}\nSenha: ${senha}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Card estilo vidro fosco rústico */}
      <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-black/40 backdrop-blur border border-yellow-600/30">
        
        {/* Logo */}
        <h1 className="text-4xl font-bold text-center text-yellow-500 mb-8 tracking-wider">
          Barberly
        </h1>

        <h2 className="text-xl font-semibold text-center text-gray-100 mb-6">
          Entrar
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              className="w-full px-4 py-2 rounded-lg bg-gray-900/50 border border-yellow-600/30 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg bg-gray-900/50 border border-yellow-600/30 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-black font-semibold shadow-md transition"
          >
            Entrar
          </button>
        </form>

        <p className="text-center text-sm text-gray-300 mt-6">
          Não tem conta?{" "}
          <a href="/signup" className="text-yellow-400 hover:underline">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}
