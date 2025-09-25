"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function DonoServicosPage() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [editingId, setEditingId] = useState(null);

  // carregar serviços
  const fetchServicos = async () => {
    setLoading(true);
    setMsg("");
    const { data, error } = await supabase
      .from("services")
      .select("id, name, price, duration_minutes, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar serviços:", error);
      setMsg("❌ Erro ao carregar serviços");
    } else {
      setServicos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  // salvar serviço (criar ou editar)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !price || !duration) {
      setMsg("❌ Preencha todos os campos");
      return;
    }

    if (editingId) {
      // update
      const { error } = await supabase
        .from("services")
        .update({
          name,
          price,
          duration_minutes: duration,
        })
        .eq("id", editingId);

      if (error) {
        console.error("Erro ao atualizar serviço:", error);
        setMsg("❌ Erro ao atualizar serviço");
      } else {
        setMsg("✅ Serviço atualizado com sucesso!");
        setEditingId(null);
        setName("");
        setPrice("");
        setDuration("");
        fetchServicos();
      }
    } else {
      // insert
      const { error } = await supabase.from("services").insert([
        {
          name,
          price,
          duration_minutes: duration,
        },
      ]);

      if (error) {
        console.error("Erro ao criar serviço:", error);
        setMsg("❌ Erro ao criar serviço");
      } else {
        setMsg("✅ Serviço criado com sucesso!");
        setName("");
        setPrice("");
        setDuration("");
        fetchServicos();
      }
    }
  };

  // excluir serviço
  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir serviço:", error);
      setMsg("❌ Erro ao excluir serviço");
    } else {
      setMsg("✅ Serviço excluído!");
      fetchServicos();
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">
        Gerenciar Serviços
      </h1>

      {/* Formulário */}
      <form
        onSubmit={handleSave}
        className="mb-6 grid gap-3 md:grid-cols-4 bg-gray-900 p-4 rounded-lg border border-gray-700"
      >
        <input
          type="text"
          placeholder="Nome do serviço"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <input
          type="number"
          placeholder="Preço (€)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <input
          type="number"
          placeholder="Duração (min)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <button
          type="submit"
          className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg"
        >
          {editingId ? "Salvar alterações" : "Adicionar serviço"}
        </button>
      </form>

      {!!msg && (
        <p
          className={`mb-4 text-sm font-semibold ${
            msg.startsWith("✅") ? "text-green-400" : "text-red-400"
          }`}
        >
          {msg}
        </p>
      )}

      {/* Lista de serviços */}
      {loading ? (
        <p className="text-gray-400">Carregando serviços...</p>
      ) : servicos.length === 0 ? (
        <p className="text-gray-400">Nenhum serviço cadastrado ainda.</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2">Nome</th>
              <th className="p-2">Preço (€)</th>
              <th className="p-2">Duração</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {servicos.map((s) => (
              <tr key={s.id} className="border-b border-gray-700">
                <td className="p-2">{s.name}</td>
                <td className="p-2">{Number(s.price).toFixed(2)}</td>
                <td className="p-2">{s.duration_minutes} min</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => {
                      setEditingId(s.id);
                      setName(s.name);
                      setPrice(s.price);
                      setDuration(s.duration_minutes);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
