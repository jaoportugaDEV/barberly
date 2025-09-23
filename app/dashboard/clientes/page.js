"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Pencil, Trash2, X } from "lucide-react";
import supabase from "@/lib/supabaseClient";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // carregar clientes do barbeiro logado
  useEffect(() => {
    const fetchClientes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("user_id", user.id) // 🔥 pega só clientes do barbeiro logado
        .order("created_at", { ascending: false });

      if (error) console.error("Erro ao buscar clientes:", error);
      else setClientes(data);

      setLoading(false);
    };

    fetchClientes();
  }, []);

  // salvar ou atualizar cliente
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !telefone) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Você precisa estar logado para adicionar clientes.");
      return;
    }

    if (editingId) {
      // atualizar cliente existente
      const { error } = await supabase
        .from("clientes")
        .update({ nome, telefone, email })
        .eq("id", editingId)
        .eq("user_id", user.id); // 🔥 garante que só atualiza os do barbeiro logado

      if (error) console.error("Erro ao atualizar cliente:", error);
      else {
        setClientes((prev) =>
          prev.map((c) =>
            c.id === editingId ? { ...c, nome, telefone, email } : c
          )
        );
        setEditingId(null);
      }
    } else {
      // inserir novo cliente
      const { data, error } = await supabase
        .from("clientes")
        .insert([{ nome, telefone, email, user_id: user.id }])
        .select();

      if (error) console.error("Erro ao adicionar cliente:", error);
      else setClientes((prev) => [...data, ...prev]);
    }

    setNome("");
    setTelefone("");
    setEmail("");
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setNome(c.nome);
    setTelefone(c.telefone);
    setEmail(c.email || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNome("");
    setTelefone("");
    setEmail("");
  };

  const removeCliente = async (id) => {
    if (!confirm("Deseja remover este cliente?")) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // 🔥 só deleta se for dono

    if (error) console.error("Erro ao remover cliente:", error);
    else setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">Clientes</h1>

      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-4 rounded-lg mb-6 flex gap-4 items-end"
      >
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <input
          type="text"
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <input
          type="email"
          placeholder="Email (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg"
        >
          {editingId ? <Save size={16} /> : <Plus size={16} />}
          {editingId ? "Salvar" : "Adicionar"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            <X size={16} /> Cancelar
          </button>
        )}
      </form>

      {/* Lista de clientes */}
      <div className="bg-gray-900 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Lista de Clientes</h2>

        {loading ? (
          <p className="text-gray-400">Carregando clientes...</p>
        ) : clientes.length === 0 ? (
          <p className="text-gray-400">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-2">Nome</th>
                <th className="p-2">Telefone</th>
                <th className="p-2">Email</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-gray-700">
                  <td className="p-2">{c.nome}</td>
                  <td className="p-2">{c.telefone}</td>
                  <td className="p-2">{c.email}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => startEdit(c)}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => removeCliente(c.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
