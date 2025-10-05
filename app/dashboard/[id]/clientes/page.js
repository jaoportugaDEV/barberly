"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Save, X, Plus } from "lucide-react";
import supabase from "@/lib/supabaseClient";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [barberId, setBarberId] = useState(null);
  const [barbeariaId, setBarbeariaId] = useState(null);

  // Pega barbeiro logado
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setBarberId(user.id);

        const { data: prof } = await supabase
          .from("profiles")
          .select("barbearia_id")
          .eq("id", user.id)
          .single();

        if (prof?.barbearia_id) {
          setBarbeariaId(prof.barbearia_id);
        }
      }
    };
    getUser();
  }, []);

  // Buscar clientes só do barbeiro logado
  useEffect(() => {
    if (!barberId) return;

    const fetchClientes = async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, telefone, email")
        .eq("barber_id", barberId); // 🔹 só os clientes cadastrados por este barbeiro

      if (error) {
        console.error("Erro ao buscar clientes:", error);
      } else {
        setClientes(data || []);
      }
    };

    fetchClientes();
  }, [barberId]);

  // Salvar cliente
  const salvarCliente = async () => {
    if (!nome || !telefone) return;

    const payload = {
      nome,
      telefone,
      email,
      barbearia_id: barbeariaId,
      barber_id: barberId, // 🔹 registra o barbeiro que cadastrou
    };

    if (editingId) {
      await supabase.from("clientes").update(payload).eq("id", editingId);
    } else {
      await supabase.from("clientes").insert([payload]);
    }

    setNome("");
    setTelefone("");
    setEmail("");
    setEditingId(null);

    // Recarregar clientes do barbeiro
    const { data } = await supabase
      .from("clientes")
      .select("id, nome, telefone, email")
      .eq("barber_id", barberId);

    setClientes(data || []);
  };

  // Editar cliente
  const editarCliente = (cliente) => {
    setNome(cliente.nome);
    setTelefone(cliente.telefone);
    setEmail(cliente.email || "");
    setEditingId(cliente.id);
  };

  // Remover cliente
  const removerCliente = async (id) => {
    if (!confirm("Deseja remover este cliente?")) return;
    await supabase.from("clientes").delete().eq("id", id);
    setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-yellow-500 mb-6">Clientes</h1>

      {/* Formulário */}
      <div className="bg-gray-800 p-4 rounded-lg shadow mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-700 text-white"
        />
        <input
          type="text"
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-700 text-white"
        />
        <input
          type="email"
          placeholder="Email (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-700 text-white"
        />
        <button
          onClick={salvarCliente}
          className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-black font-semibold flex items-center gap-2"
        >
          {editingId ? <Save size={16} /> : <Plus size={16} />}
          {editingId ? "Salvar" : "Adicionar"}
        </button>
        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              setNome("");
              setTelefone("");
              setEmail("");
            }}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white flex items-center gap-2"
          >
            <X size={16} /> Cancelar
          </button>
        )}
      </div>

      {/* Lista de clientes */}
      <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-700 text-left">
            <th className="p-2">Nome</th>
            <th className="p-2">Telefone</th>
            <th className="p-2">Email</th>
            <th className="p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {clientes.length > 0 ? (
            clientes.map((c) => (
              <tr key={c.id} className="border-b border-gray-600">
                <td className="p-2">{c.nome}</td>
                <td className="p-2">{c.telefone}</td>
                <td className="p-2">{c.email || "—"}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => editarCliente(c)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => removerCliente(c.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="p-4 text-center text-gray-400">
                Nenhum cliente encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
