"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

export default function ConfiguracoesPage() {
  const [perfil, setPerfil] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    logo: "",
  });

  const [preferencias, setPreferencias] = useState({
    moeda: "EUR",
    idioma: "pt-PT",
    horarioAbertura: "09:00",
    horarioFecho: "19:00",
  });

  const [conta, setConta] = useState({
    responsavel: "",
    senha: "",
  });

  // carregar do localStorage
  useEffect(() => {
    const savedPerfil = localStorage.getItem("barberly_perfil");
    const savedPref = localStorage.getItem("barberly_preferencias");
    const savedConta = localStorage.getItem("barberly_conta");

    if (savedPerfil) setPerfil(JSON.parse(savedPerfil));
    if (savedPref) setPreferencias(JSON.parse(savedPref));
    if (savedConta) setConta(JSON.parse(savedConta));
  }, []);

  // salvar no localStorage
  const salvarTudo = () => {
    localStorage.setItem("barberly_perfil", JSON.stringify(perfil));
    localStorage.setItem("barberly_preferencias", JSON.stringify(preferencias));
    localStorage.setItem("barberly_conta", JSON.stringify(conta));
    alert("Configurações salvas com sucesso!");
  };

  // upload de logo (converte para Base64 por enquanto)
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPerfil({ ...perfil, logo: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">Configurações</h1>

      {/* Perfil da Barbearia */}
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Perfil da Barbearia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome da Barbearia"
            value={perfil.nome}
            onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
          <input
            type="text"
            placeholder="Telefone / WhatsApp"
            value={perfil.telefone}
            onChange={(e) => setPerfil({ ...perfil, telefone: e.target.value })}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
          <input
            type="email"
            placeholder="Email"
            value={perfil.email}
            onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
          <input
            type="text"
            placeholder="Endereço"
            value={perfil.endereco}
            onChange={(e) => setPerfil({ ...perfil, endereco: e.target.value })}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
          <div className="col-span-2">
            <label className="block text-gray-300 mb-2">Logotipo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="text-gray-300"
            />
            {perfil.logo && (
              <img
                src={perfil.logo}
                alt="Logo da Barbearia"
                className="mt-2 h-20 object-contain"
              />
            )}
          </div>
        </div>
      </div>

      {/* Preferências */}
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Preferências</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={preferencias.moeda}
            onChange={(e) =>
              setPreferencias({ ...preferencias, moeda: e.target.value })
            }
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            <option value="EUR">Euro (€)</option>
            <option value="BRL">Real (R$)</option>
            <option value="USD">Dólar ($)</option>
          </select>
          <select
            value={preferencias.idioma}
            onChange={(e) =>
              setPreferencias({ ...preferencias, idioma: e.target.value })
            }
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            <option value="pt-PT">Português (Portugal)</option>
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en">Inglês</option>
          </select>
          <input
            type="time"
            value={preferencias.horarioAbertura}
            onChange={(e) =>
              setPreferencias({ ...preferencias, horarioAbertura: e.target.value })
            }
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
          <input
            type="time"
            value={preferencias.horarioFecho}
            onChange={(e) =>
              setPreferencias({ ...preferencias, horarioFecho: e.target.value })
            }
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
        </div>
      </div>

      {/* Conta */}
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Conta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome do Responsável"
            value={conta.responsavel}
            onChange={(e) => setConta({ ...conta, responsavel: e.target.value })}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
          <input
            type="password"
            placeholder="Nova Senha"
            value={conta.senha}
            onChange={(e) => setConta({ ...conta, senha: e.target.value })}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
        </div>
      </div>

      {/* Botão salvar */}
      <button
        onClick={salvarTudo}
        className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-6 py-3 rounded-lg"
      >
        <Save size={18} /> Salvar Alterações
      </button>
    </div>
  );
}
