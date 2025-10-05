"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";

export default function BarbeariasPage() {
  const [barbearias, setBarbearias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // Form states
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [editingId, setEditingId] = useState(null);

  const params = useParams(); // 👈 capturamos o donoid da rota

  // Carregar barbearias do dono
  const fetchBarbearias = async () => {
    setLoading(true);
    setMsg("");

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setMsg("❌ Não autenticado.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("barbearias")
      .select("id, nome, endereco, telefone, cidade, slug")
      .eq("dono_id", auth.user.id);

    if (error) {
      setMsg("❌ Erro ao carregar barbearias");
    } else {
      setBarbearias(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBarbearias();
  }, []);

  // Criar/atualizar barbearia
  const handleSave = async (e) => {
    e.preventDefault();
    setMsg("");

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setMsg("❌ Não autenticado.");
      return;
    }

    if (!nome || !endereco || !telefone || !cidade) {
      setMsg("❌ Preencha todos os campos.");
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("barbearias")
        .update({ nome, endereco, telefone, cidade })
        .eq("id", editingId)
        .eq("dono_id", auth.user.id);

      if (error) {
        setMsg("❌ Erro ao atualizar barbearia.");
      } else {
        setMsg("✅ Barbearia atualizada!");
        resetForm();
        fetchBarbearias();
      }
    } else {
      // 🔹 Gerar slug único baseado no nome
      const baseSlug = nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      // Adiciona 4 caracteres aleatórios no final para garantir unicidade
      const uniqueSuffix = Math.random().toString(36).substring(2, 6);
      const slug = `${baseSlug}-${uniqueSuffix}`;

      const { error } = await supabase.from("barbearias").insert([
        {
          nome,
          endereco,
          telefone,
          cidade,
          dono_id: auth.user.id,
          slug,
        },
      ]);

      if (error) {
        console.error(error);
        setMsg("❌ Erro ao criar barbearia.");
      } else {
        setMsg("✅ Barbearia criada com sucesso!");
        resetForm();
        fetchBarbearias();
      }
    }
  };

  // Excluir barbearia
  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta barbearia?")) return;

    const { error } = await supabase.from("barbearias").delete().eq("id", id);

    if (error) {
      setMsg("❌ Erro ao excluir barbearia.");
    } else {
      setMsg("✅ Barbearia excluída!");
      fetchBarbearias();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNome("");
    setEndereco("");
    setTelefone("");
    setCidade("");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">
        Minhas Barbearias
      </h1>

      {/* Formulário */}
      <form
        onSubmit={handleSave}
        className="mb-6 grid gap-3 md:grid-cols-4 bg-gray-900 p-4 rounded-lg border border-gray-700"
      >
        <input
          type="text"
          placeholder="Nome da barbearia"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <input
          type="text"
          placeholder="Endereço"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
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
          type="text"
          placeholder="Cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
        />
        <button
          type="submit"
          className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg col-span-full"
        >
          {editingId ? "Salvar alterações" : "Adicionar barbearia"}
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

      {/* Lista */}
      {loading ? (
        <p className="text-gray-400">Carregando barbearias...</p>
      ) : barbearias.length === 0 ? (
        <p className="text-gray-400">Nenhuma barbearia cadastrada ainda.</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2">Nome</th>
              <th className="p-2">Endereço</th>
              <th className="p-2">Telefone</th>
              <th className="p-2">Cidade</th>
              <th className="p-2">Link Público</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {barbearias.map((b) => (
              <tr key={b.id} className="border-b border-gray-700">
                <td className="p-2">{b.nome}</td>
                <td className="p-2">{b.endereco}</td>
                <td className="p-2">{b.telefone}</td>
                <td className="p-2">{b.cidade}</td>
                <td className="p-2">
                  <Link
                    href={`/barbearia/${b.slug}`}
                    target="_blank"
                    className="text-blue-400 hover:underline"
                  >
                    Ver página
                  </Link>
                </td>
                <td className="p-2 space-x-2">
                  <Link
                    href={`/dono/${params.donoid}/barbearias/${b.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/dono/${params.donoid}/barbearias/${b.id}/agenda`}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                  >
                    Agendamento
                  </Link>
                  <Link
                    href={`/dono/${params.donoid}/barbearias/${b.id}/servicos`}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                  >
                    Serviços
                  </Link>
                  <button
                    onClick={() => handleDelete(b.id)}
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
