"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState(""); // 🔎 estado do filtro

  // Carregar clientes
  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setClientes(data);
  };

  // Criar novo cliente
  const handleAdd = async () => {
    if (!nome || !telefone) {
      setMsg("⚠️ Nome e telefone são obrigatórios.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("clientes").insert([
      { nome, telefone, email: email || null },
    ]);

    if (error) {
      console.error("❌ Erro ao criar cliente:", error);
      setMsg("❌ Erro ao criar cliente.");
    } else {
      setMsg("✅ Cliente adicionado com sucesso!");
      setNome("");
      setTelefone("");
      setEmail("");
      fetchClientes();
    }
    setLoading(false);
  };

  // Atualizar cliente
  const handleUpdate = async (id) => {
    if (!nome || !telefone) {
      setMsg("⚠️ Nome e telefone são obrigatórios.");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("clientes")
      .update({ nome, telefone, email: email || null })
      .eq("id", id);

    if (error) {
      console.error("❌ Erro ao atualizar cliente:", error);
      setMsg("❌ Erro ao atualizar cliente.");
    } else {
      setMsg("✏️ Cliente atualizado com sucesso!");
      setNome("");
      setTelefone("");
      setEmail("");
      setEditId(null);
      fetchClientes();
    }
    setLoading(false);
  };

  // Excluir cliente
  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    const { error } = await supabase.from("clientes").delete().eq("id", id);

    if (error) {
      console.error("❌ Erro ao excluir cliente:", error);
      setMsg("❌ Erro ao excluir cliente.");
    } else {
      setMsg("🗑️ Cliente excluído com sucesso!");
      fetchClientes();
    }
  };

  // 🔎 Aplicar filtro
  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">Clientes</h1>

      {/* Formulário de criação/edição */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <input
          type="text"
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <input
          type="email"
          placeholder="Email (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />

        {editId ? (
          <button
            onClick={() => handleUpdate(editId)}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg"
          >
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>
        ) : (
          <button
            onClick={handleAdd}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg"
          >
            {loading ? "Adicionando..." : "Adicionar cliente"}
          </button>
        )}
      </div>

      {msg && <p className="mb-4 text-sm text-gray-300">{msg}</p>}

      {/* 🔎 Campo de busca */}
      <input
        type="text"
        placeholder="Pesquisar cliente por nome, telefone ou email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 mb-6 rounded-lg bg-gray-800 border border-gray-700 text-white"
      />

      {/* Lista de clientes */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="p-2">Nome</th>
            <th className="p-2">Telefone</th>
            <th className="p-2">Email</th>
            <th className="p-2">Criado em</th>
            <th className="p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredClientes.length > 0 ? (
            filteredClientes.map((c) => (
              <tr key={c.id} className="border-b border-gray-700">
                <td className="p-2">{c.nome}</td>
                <td className="p-2">{c.telefone}</td>
                <td className="p-2">{c.email || "-"}</td>
                <td className="p-2">
                  {new Date(c.created_at).toLocaleString("pt-PT")}
                </td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(c.id);
                      setNome(c.nome);
                      setTelefone(c.telefone);
                      setEmail(c.email || "");
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-400">
                Nenhum cliente encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
