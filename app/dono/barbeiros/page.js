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
      alert("Selecione uma barbearia.");
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
      if (!res.ok) throw new Error(data.error || "Erro ao salvar barbeiro");

      alert(editingId ? "Barbeiro atualizado com sucesso!" : "Barbeiro criado com sucesso!");

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
    if (!confirm("Tem certeza que deseja excluir este barbeiro?")) return;
    try {
      const res = await fetch(`/api/barbeiros/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir barbeiro");

      alert("Barbeiro excluído com sucesso!");
      setBarbeiros(barbeiros.filter((b) => b.id !== id));
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Gerenciar Barbeiros</h1>

      {/* Seleção da Barbearia */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">Selecione a Barbearia</label>
        <select
          value={selectedBarbearia}
          onChange={(e) => setSelectedBarbearia(e.target.value)}
          className="p-3 rounded-lg bg-gray-800 text-white w-full focus:ring-2 focus:ring-yellow-500"
        >
          <option value="">Selecione uma barbearia</option>
          {barbearias.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Formulário */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Editar Barbeiro" : "Cadastrar Novo Barbeiro"}
        </h2>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nome"
            value={name || ""}
            onChange={(e) => setName(e.target.value)}
            className="p-3 rounded-lg bg-gray-700 w-full text-white focus:ring-2 focus:ring-yellow-500"
          />
          <input
            type="text"
            placeholder="Telefone"
            value={phone || ""}
            onChange={(e) => setPhone(e.target.value)}
            className="p-3 rounded-lg bg-gray-700 w-full text-white focus:ring-2 focus:ring-yellow-500"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email || ""}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg bg-gray-700 w-full text-white focus:ring-2 focus:ring-yellow-500"
          />
          <input
            type="password"
            placeholder={editingId ? "Nova senha (opcional)" : "Senha"}
            value={password || ""}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg bg-gray-700 w-full text-white focus:ring-2 focus:ring-yellow-500"
          />
          <button
            onClick={handleSave}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-3 rounded-lg w-full font-semibold transition"
          >
            {editingId ? "Salvar Alterações" : "Criar Barbeiro"}
          </button>
        </div>
      </div>

      {/* Lista */}
      <h2 className="text-xl font-semibold mb-3">Lista de Barbeiros</h2>
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-700 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-700 text-left">
              <th className="p-3">Nome</th>
              <th className="p-3">Telefone</th>
              <th className="p-3">E-mail</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {barbeiros.map((b) => (
              <tr key={b.id} className="border-t border-gray-600 hover:bg-gray-800">
                <td className="p-3">{b.name}</td>
                <td className="p-3">{b.phone}</td>
                <td className="p-3">{b.email}</td>
                <td className="p-3 flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setEditingId(b.id);
                      setName(b.name || "");
                      setPhone(b.phone || "");
                      setEmail(b.email || "");
                      setPassword("");
                    }}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white transition"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {barbeiros.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-400">
                  Nenhum barbeiro cadastrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
