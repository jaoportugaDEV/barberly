"use client";

import { useState } from "react";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([
    { id: 1, nome: "João Silva", telefone: "(11) 91234-5678" },
    { id: 2, nome: "Carlos Mendes", telefone: "(11) 99876-5432" },
  ]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const add = (e) => {
    e.preventDefault();
    if (!nome || !telefone) return;
    setClientes((prev) => [...prev, { id: Date.now(), nome, telefone }]);
    setNome(""); setTelefone("");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">Clientes</h1>

      <form onSubmit={add} className="bg-gray-900 p-6 rounded-lg shadow-md mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Nome do cliente"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
        />
        <input
          type="text"
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
        />
        <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2 rounded-lg">
          Adicionar
        </button>
      </form>

      <div className="bg-gray-900 p-6 rounded-lg shadow-md">
        {clientes.length === 0 ? (
          <p className="text-gray-400">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-700">
            {clientes.map((c) => (
              <li key={c.id} className="py-3 flex justify-between">
                <span><strong>{c.nome}</strong> — {c.telefone}</span>
                <button className="text-red-500 hover:text-red-700 font-semibold">Remover</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
