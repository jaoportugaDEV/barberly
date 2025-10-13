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

  const [isColaborador, setIsColaborador] = useState(false);
  const [userId, setUserId] = useState(null);
  const [barbeariaSelecionada, setBarbeariaSelecionada] = useState("");
  const [loadingColab, setLoadingColab] = useState(true);

  const params = useParams(); // donoid

  // 🔹 Carregar barbearias
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

    if (error) setMsg("❌ Erro ao carregar barbearias");
    else setBarbearias(data || []);
    setLoading(false);
  };

  // 🔹 Carregar status colaborador e barbearia escolhida
  const fetchColaboradorData = async () => {
    setLoadingColab(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    setUserId(auth.user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("is_colaborador, barbearia_id")
      .eq("id", auth.user.id)
      .single();

    if (!error && data) {
      setIsColaborador(data.is_colaborador);
      setBarbeariaSelecionada(data.barbearia_id || "");
    }
    setLoadingColab(false);
  };

  useEffect(() => {
    fetchBarbearias();
    fetchColaboradorData();
  }, []);

  // 🔹 Alternar colaborador
  const toggleColaborador = async () => {
    const novoValor = !isColaborador;
    setIsColaborador(novoValor);

    let updateData = { is_colaborador: novoValor };

    // se desativar o modo colaborador, limpa o barbearia_id
    if (!novoValor) {
      updateData.barbearia_id = null;
      setBarbeariaSelecionada("");
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      setMsg("❌ Erro ao atualizar status de colaborador.");
    } else {
      setMsg(
        novoValor
          ? "✅ Modo colaborador ativado. Escolha a barbearia."
          : "⚠️ Modo colaborador desativado."
      );
    }
  };

  // 🔹 Atualizar barbearia escolhida
  const handleSelecionarBarbearia = async (e) => {
    const novaBarbearia = e.target.value;
    setBarbeariaSelecionada(novaBarbearia);

    const { error } = await supabase
      .from("profiles")
      .update({ barbearia_id: novaBarbearia })
      .eq("id", userId);

    if (error) {
      setMsg("❌ Erro ao definir barbearia colaboradora.");
    } else {
      setMsg("✅ Barbearia definida como colaboradora!");
    }
  };

  // 🔹 Criar/editar barbearia
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

      if (error) setMsg("❌ Erro ao atualizar barbearia.");
      else {
        setMsg("✅ Barbearia atualizada!");
        resetForm();
        fetchBarbearias();
      }
    } else {
      const baseSlug = nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

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

  // 🔹 Excluir barbearia
  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta barbearia?")) return;

    const { error } = await supabase.from("barbearias").delete().eq("id", id);

    if (error) setMsg("❌ Erro ao excluir barbearia.");
    else {
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
      {/* Cabeçalho e switch */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <h1 className="text-3xl font-bold text-yellow-500">
          Minhas Barbearias
        </h1>

        {!loadingColab && (
          <div className="flex items-center gap-4 bg-gray-900 border border-gray-700 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-gray-300 text-sm font-medium">
                Sou também colaborador
              </span>
              <button
                onClick={toggleColaborador}
                className={`w-14 h-7 flex items-center rounded-full p-1 transition ${
                  isColaborador ? "bg-green-500" : "bg-gray-600"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition ${
                    isColaborador ? "translate-x-7" : "translate-x-0"
                  }`}
                ></div>
              </button>
            </div>

            {isColaborador && (
              <select
                value={barbeariaSelecionada}
                onChange={handleSelecionarBarbearia}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-1 rounded-lg text-sm"
              >
                <option value="">Selecionar barbearia</option>
                {barbearias.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Mensagem de status */}
      {!!msg && (
        <p
          className={`mb-4 text-sm font-semibold ${
            msg.startsWith("✅")
              ? "text-green-400"
              : msg.startsWith("⚠️")
              ? "text-yellow-400"
              : "text-red-400"
          }`}
        >
          {msg}
        </p>
      )}

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

      {/* Lista de barbearias */}
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
