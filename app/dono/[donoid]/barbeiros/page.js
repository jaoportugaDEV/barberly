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
    <div className="p-4 sm:p-6 text-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 sm:mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          Gerenciar Colaboradores
        </h1>

        {/* Seleção da Empresa */}
        <div className="mb-4 sm:mb-6">
          <label className="block mb-2 font-medium text-sm sm:text-base">Selecione a Empresa</label>
          <select
            value={selectedBarbearia}
            onChange={(e) => setSelectedBarbearia(e.target.value)}
            className="p-3 sm:p-4 rounded-lg bg-gray-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
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
        <div className="backdrop-blur-md bg-gray-800/60 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-700/50 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-yellow-400">
            {editingId ? "Editar Colaborador" : "Cadastrar Novo Colaborador"}
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nome"
              value={name || ""}
              onChange={(e) => setName(e.target.value)}
              className="p-3 sm:p-4 rounded-lg bg-gray-700 w-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
            />
            <input
              type="text"
              placeholder="Telefone"
              value={phone || ""}
              onChange={(e) => setPhone(e.target.value)}
              className="p-3 sm:p-4 rounded-lg bg-gray-700 w-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={email || ""}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 sm:p-4 rounded-lg bg-gray-700 w-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
            />
            <input
              type="password"
              placeholder={editingId ? "Nova senha (opcional)" : "Senha"}
              value={password || ""}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 sm:p-4 rounded-lg bg-gray-700 w-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
            />
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-4 py-3 sm:py-4 rounded-lg w-full font-semibold shadow-md hover:scale-[1.02] transition text-sm sm:text-base"
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
                className="px-4 py-3 rounded-lg w-full font-semibold bg-gray-700 hover:bg-gray-600 text-white transition text-sm sm:text-base"
              >
                Cancelar Edição
              </button>
            )}
          </div>
        </div>

        {/* Lista - Mobile Cards */}
        <div className="block md:hidden">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Lista de Colaboradores</h2>
          {barbeiros.length === 0 ? (
            <div className="backdrop-blur-md bg-gray-800/60 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-700/50 text-center">
              <p className="text-gray-400 text-sm sm:text-base">Nenhum colaborador cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {barbeiros.map((b) => (
                <div
                  key={b.id}
                  className="backdrop-blur-md bg-gray-800/60 p-4 sm:p-5 rounded-xl shadow-lg border border-gray-700/50"
                >
                  <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p className="font-bold text-white text-base sm:text-lg break-words">{b.name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="break-all">{b.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="break-all">{b.email}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 sm:pt-4 border-t border-gray-700">
                    <button
                      onClick={() => {
                        setEditingId(b.id);
                        setName(b.name || "");
                        setPhone(b.phone || "");
                        setEmail(b.email || "");
                        setPassword("");
                      }}
                      className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition text-xs sm:text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition text-xs sm:text-sm"
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
        <div className="hidden md:block">
          <h2 className="text-xl font-semibold mb-3 sm:mb-4">Lista de Colaboradores</h2>
          <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-700/50">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gradient-to-r from-gray-700 to-gray-800 text-yellow-400">
                  <th className="p-3 sm:p-4 text-sm sm:text-base">Nome</th>
                  <th className="p-3 sm:p-4 text-sm sm:text-base">Telefone</th>
                  <th className="p-3 sm:p-4 text-sm sm:text-base">E-mail</th>
                  <th className="p-3 sm:p-4 text-center text-sm sm:text-base">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {barbeiros.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-800/50 transition">
                    <td className="p-3 sm:p-4 text-sm sm:text-base">{b.name}</td>
                    <td className="p-3 sm:p-4 text-sm sm:text-base text-gray-300">{b.phone}</td>
                    <td className="p-3 sm:p-4 text-sm sm:text-base text-gray-300">{b.email}</td>
                    <td className="p-3 sm:p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(b.id);
                            setName(b.name || "");
                            setPhone(b.phone || "");
                            setEmail(b.email || "");
                            setPassword("");
                          }}
                          className="bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-1 sm:py-2 rounded text-white transition text-xs sm:text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-1 sm:py-2 rounded text-white transition text-xs sm:text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {barbeiros.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-4 sm:p-8 text-center text-gray-400 text-sm sm:text-base">
                      Nenhum colaborador cadastrado
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
