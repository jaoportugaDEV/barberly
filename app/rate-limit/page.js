"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";

export default function RateLimitPage() {
  const [countdown, setCountdown] = useState(120); // 2 minutos
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRetry = () => {
    router.push("/login");
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-md w-full bg-gray-900/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-yellow-600/50">
        <div className="text-center">
          {/* Ícone de aviso */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white mb-2">
            Muitas Tentativas
          </h1>
          
          {/* Descrição */}
          <p className="text-gray-400 mb-6">
            Você atingiu o limite de tentativas de login. Por favor, aguarde alguns instantes antes de tentar novamente.
          </p>

          {/* Countdown */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-400 text-sm">Tempo de espera recomendado:</span>
            </div>
            <div className="text-4xl font-bold text-yellow-500">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Dicas */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-blue-400 font-semibold mb-2 text-sm">💡 Dicas para evitar este problema:</h3>
            <ul className="text-gray-400 text-xs space-y-1">
              <li>• Certifique-se de usar as credenciais corretas</li>
              <li>• Feche outras abas da aplicação</li>
              <li>• Aguarde entre tentativas de login</li>
              <li>• Limpe o cache do navegador se necessário</li>
            </ul>
          </div>

          {/* Botão de retry */}
          <button
            onClick={handleRetry}
            disabled={countdown > 0}
            className={`w-full py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              countdown > 0
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-yellow-600 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600 hover:shadow-lg hover:shadow-yellow-600/50"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            {countdown > 0 ? "Aguarde para tentar novamente" : "Tentar Novamente"}
          </button>
        </div>
      </div>
    </div>
  );
}



