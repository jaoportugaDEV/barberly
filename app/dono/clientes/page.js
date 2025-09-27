"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [busca, setBusca] = useState("");
  const [meusClientes, setMeusClientes] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) fetchClientes();
  }, [userId, meusClientes]);

  async function fetchClientes() {
    let query = supabase.from("clientes").select("id, nome, telefone, email, created_at, user_id");

    if (meusClientes) query = query.eq("user_id", userId);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (!error) setClientes(data || []);
  }

  async function adicionarCliente() {
    if (!nome || !telefone) return alert("Preencha nome e telefone!");
    await supabase.from("clientes").insert([{ nome, telefone, email: email || null, user_id: userId }]);
    setNome(""); setTelefone(""); setEmail("");
    fetchClientes();
  }

  async function excluirCliente(id) {
    if (!confirm("Deseja excluir este cliente?")) return;
    await supabase.from("clientes").delete().eq("id", id);
    fetchClientes();
  }

  const clientesFiltrados = clientes.filter((c) =>
    [c.nome, c.telefone, c.email].filter(Boolean).some((campo) =>
      campo.toLowerCase().includes(busca.toLowerCase())
    )
  );

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <h1 className="text-3xl font-extrabold text-yellow-400 mb-8 drop-shadow-lg">
        Clientes
      </h1>

      {/* Form + Switch */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white/5 backdrop-blur-md border border-gray-700 p-4 rounded-2xl shadow-lg">
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <input
          type="text"
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <input
          type="text"
          placeholder="Email (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <button
          onClick={adicionarCliente}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold px-5 py-2 rounded-lg shadow-md transition-all"
        >
          Adicionar cliente
        </button>

        {/* Switch estilizado */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm text-gray-300">{meusClientes ? "Meus clientes" : "Todos os clientes"}</span>
          <button
            onClick={() => setMeusClientes(!meusClientes)}
            className={`relative w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${
              meusClientes ? "bg-gradient-to-r from-yellow-400 to-yellow-600" : "bg-gray-600"
            }`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                meusClientes ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Barra de busca */}
      <input
        type="text"
        placeholder="Buscar cliente por nome, telefone ou email..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full mb-6 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />

      {/* Lista */}
      <div className="overflow-hidden rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md bg-white/5">
        <table className="w-full text-white">
          <thead>
            <tr className="bg-gray-900/70 text-yellow-400 text-left">
              <th className="p-3">Nome</th>
              <th className="p-3">Telefone</th>
              <th className="p-3">Email</th>
              <th className="p-3">Criado em</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.length > 0 ? (
              clientesFiltrados.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-700 hover:bg-gray-800/70 transition-colors"
                >
                  <td className="p-3">{c.nome}</td>
                  <td className="p-3">{c.telefone}</td>
                  <td className="p-3">{c.email || "—"}</td>
                  <td className="p-3">{new Date(c.created_at).toLocaleString("pt-PT")}</td>
                  <td className="p-3 flex gap-2">
                    <button className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg text-sm transition-all">
                      Editar
                    </button>
                    <button
                      onClick={() => excluirCliente(c.id)}
                      className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg text-sm transition-all"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-400">
                  Nenhum cliente encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
