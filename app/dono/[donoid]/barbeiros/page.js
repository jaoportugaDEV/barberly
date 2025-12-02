"use client";

import { useEffect, useState } from "react";

export default function BarbeirosPage() {
  const [barbearias, setBarbearias] = useState([]);
  const [selectedBarbearia, setSelectedBarbearia] = useState("");
  const [barbeiros, setBarbeiros] = useState([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [editingId, setEditingId] = useState(null);

  // 🔹 Buscar barbearias do dono
  useEffect(() => {
    const fetchBarbearias = async () => {
      try {
        const res = await fetch("/api/barbearias");
        const data = await res.json();
        setBarbearias(data.barbearias || []);
      } catch (err) {
        console.error("Erro ao buscar barbearias", err);
      }
    };
    fetchBarbearias();
  }, []);

  // 🔹 Buscar barbeiros da barbearia selecionada
  useEffect(() => {
    if (!selectedBarbearia) return;
    const fetchBarbeiros = async () => {
      try {
        const res = await fetch(`/api/barbeiros?barbearia_id=${selectedBarbearia}`);
        const data = await res.json();
        setBarbeiros(data.barbeiros || []);
      } catch (err) {
        console.error("Erro ao buscar barbeiros", err);
      }
    };
    fetchBarbeiros();
  }, [selectedBarbearia]);

  // 🔹 Criar ou editar barbeiro
  const handleSave = async () => {
    if (!selectedBarbearia) {
      alert("Selecione uma empresa.");
      return;
    }
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/barbeiros/${editingId}` : "/api/barbeiros";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          password,
          barbearia_id: selectedBarbearia,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar colaborador");

      alert(editingId ? "Colaborador atualizado com sucesso!" : "Colaborador criado com sucesso!");

      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setEditingId(null);

      // recarregar lista
      const res2 = await fetch(`/api/barbeiros?barbearia_id=${selectedBarbearia}`);
      const data2 = await res2.json();
      setBarbeiros(data2.barbeiros || []);
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  // 🔹 Excluir barbeiro
  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este colaborador?")) return;
    try {
      const res = await fetch(`/api/barbeiros/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir colaborador");

      alert("Colaborador excluído com sucesso!");
      setBarbeiros(barbeiros.filter((b) => b.id !== id));
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-10 sm:h-12 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full"></div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              Gerenciar Colaboradores
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base ml-4">
            Adicione e gerencie os colaboradores da sua equipe
          </p>
        </div>

        {/* Seleção da Empresa */}
        <div className="mb-6 sm:mb-8">
          <label className="block mb-2 font-semibold text-gray-400 text-sm sm:text-base">
            Selecione a Empresa
          </label>
          <select
            value={selectedBarbearia}
            onChange={(e) => setSelectedBarbearia(e.target.value)}
            className="p-3 sm:p-4 rounded-xl bg-gray-800/80 border border-gray-700 text-white w-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-sm sm:text-base"
          >
            <option value="">Selecione uma empresa</option>
            {barbearias.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Formulário */}
        <div className="backdrop-blur-md bg-gradient-to-br from-gray-900/80 to-gray-950/80 p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-2xl border border-yellow-600/30 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-yellow-400">
              {editingId ? "Editar Colaborador" : "Cadastrar Novo Colaborador"}
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Nome Completo</label>
              <input
                type="text"
                placeholder="Digite o nome completo"
                value={name || ""}
                onChange={(e) => setName(e.target.value)}
                className="p-3 sm:p-4 rounded-xl bg-gray-800/70 border border-gray-700 w-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-sm sm:text-base"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Telefone</label>
              <input
                type="text"
                placeholder="Digite o telefone"
                value={phone || ""}
                onChange={(e) => setPhone(e.target.value)}
                className="p-3 sm:p-4 rounded-xl bg-gray-800/70 border border-gray-700 w-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-sm sm:text-base"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">E-mail</label>
              <input
                type="email"
                placeholder="Digite o e-mail"
                value={email || ""}
                onChange={(e) => setEmail(e.target.value)}
                className="p-3 sm:p-4 rounded-xl bg-gray-800/70 border border-gray-700 w-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-sm sm:text-base"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                {editingId ? "Nova Senha (opcional)" : "Senha"}
              </label>
              <input
                type="password"
                placeholder={editingId ? "Deixe em branco para manter a senha atual" : "Digite a senha"}
                value={password || ""}
                onChange={(e) => setPassword(e.target.value)}
                className="p-3 sm:p-4 rounded-xl bg-gray-800/70 border border-gray-700 w-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-sm sm:text-base"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-5 py-3 sm:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-black text-sm sm:text-base"
              >
                {editingId ? "Salvar Alterações" : "Criar Colaborador"}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setName("");
                    setPhone("");
                    setEmail("");
                    setPassword("");
                  }}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl font-semibold bg-gray-700/80 hover:bg-gray-700 text-white transition-all duration-200 hover:scale-105 text-sm sm:text-base"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista - Mobile Cards */}
        <div className="block lg:hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full"></div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Lista de Colaboradores</h2>
          </div>
          {barbeiros.length === 0 ? (
            <div className="backdrop-blur-md bg-gradient-to-br from-gray-900/80 to-gray-950/80 p-8 sm:p-10 rounded-xl shadow-2xl border border-gray-800 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-400 text-base">Nenhum colaborador cadastrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {barbeiros.map((b) => (
                <div
                  key={b.id}
                  className="backdrop-blur-md bg-gradient-to-br from-gray-900/80 to-gray-950/80 p-5 rounded-xl shadow-2xl border border-gray-800 hover:border-yellow-600/30 transition-all duration-300"
                >
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p className="font-bold text-white text-lg break-words flex-1">{b.name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300 pl-15">
                      <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="break-all">{b.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300 pl-15">
                      <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="break-all">{b.email}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-800">
                    <button
                      onClick={() => {
                        setEditingId(b.id);
                        setName(b.name || "");
                        setPhone(b.phone || "");
                        setEmail(b.email || "");
                        setPassword("");
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-semibold transition-all duration-200 hover:scale-105 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-semibold transition-all duration-200 hover:scale-105 text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista - Desktop Table */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-white">Lista de Colaboradores</h2>
          </div>
          <div className="overflow-x-auto rounded-xl shadow-2xl border border-gray-800">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gradient-to-r from-gray-900 to-gray-950 text-yellow-500">
                  <th className="p-4 text-sm font-semibold">Nome</th>
                  <th className="p-4 text-sm font-semibold">Telefone</th>
                  <th className="p-4 text-sm font-semibold">E-mail</th>
                  <th className="p-4 text-center text-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-gradient-to-br from-gray-900/50 to-gray-950/50 divide-y divide-gray-800">
                {barbeiros.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-900/80 transition-all duration-200">
                    <td className="p-4 text-white font-medium">{b.name}</td>
                    <td className="p-4 text-gray-300">{b.phone}</td>
                    <td className="p-4 text-gray-300">{b.email}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(b.id);
                            setName(b.name || "");
                            setPhone(b.phone || "");
                            setEmail(b.email || "");
                            setPassword("");
                          }}
                          className="bg-blue-600/80 hover:bg-blue-600 px-4 py-2 rounded-lg text-white font-semibold transition-all duration-200 hover:scale-105 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="bg-red-600/80 hover:bg-red-600 px-4 py-2 rounded-lg text-white font-semibold transition-all duration-200 hover:scale-105 text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {barbeiros.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-10 text-center">
                      <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-400 text-base">Nenhum colaborador cadastrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
