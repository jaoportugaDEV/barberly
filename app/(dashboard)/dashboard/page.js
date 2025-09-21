"use client";

import { useState } from "react";

export default function DashboardPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [data, setData] = useState("");

  const handleSalvar = () => {
    if (!nome || !telefone || !data) return;
    const novo = { id: Date.now(), nome, telefone, data };
    setAgendamentos((prev) => [...prev, novo]);
    setNome(""); setTelefone(""); setData("");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">Agenda</h1>

      <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Criar Agendamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Nome do cliente"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <input
            type="text"
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <input
            type="datetime-local"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            onClick={handleSalvar}
            className="bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Meus Agendamentos</h2>
        {agendamentos.length === 0 ? (
          <p className="text-gray-400">Nenhum agendamento ainda.</p>
        ) : (
          <ul className="space-y-3">
            {agendamentos.map((ag) => (
              <li key={ag.id} className="flex justify-between items-center bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                <div>
                  <p className="text-white font-medium">{ag.nome}</p>
                  <p className="text-gray-400 text-sm">{ag.telefone}</p>
                  <p className="text-yellow-500 text-xs">{ag.data}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
