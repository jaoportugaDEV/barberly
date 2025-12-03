"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Edit,
  Settings,
  Trash2,
  ExternalLink,
  Users,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react";

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

    if (error) setMsg("❌ Erro ao carregar salões");
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
          ? "✅ Modo colaborador ativado. Escolha o salão."
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
      setMsg("❌ Erro ao definir salão colaborador.");
    } else {
      setMsg("✅ Salão definido como colaborador!");
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

      if (error) setMsg("❌ Erro ao atualizar salão.");
      else {
        setMsg("✅ Salão atualizado!");
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
        setMsg("❌ Erro ao criar salão.");
      } else {
        setMsg("✅ Salão criado com sucesso!");
        resetForm();
        fetchBarbearias();
      }
    }
  };

  // 🔹 Excluir barbearia
  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este salão?")) return;

    const { error } = await supabase.from("barbearias").delete().eq("id", id);

    if (error) setMsg("❌ Erro ao excluir salão.");
    else {
      setMsg("✅ Salão excluído!");
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-2">
              Meus Salões
            </h1>
            <p className="text-gray-400 text-sm lg:text-base">
              Gerencie todos os seus salões em um só lugar
            </p>
          </div>

          {!loadingColab && (
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm border border-gray-800 rounded-xl p-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-300 text-sm font-medium">
                    Sou também colaborador
                  </span>
                  <button
                    onClick={toggleColaborador}
                    className={`relative w-14 h-7 flex items-center rounded-full p-1 transition-all duration-200 ${
                      isColaborador ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-200 ${
                        isColaborador ? "translate-x-7" : "translate-x-0"
                      }`}
                    ></div>
                  </button>
                </div>

                {isColaborador && (
                  <select
                    value={barbeariaSelecionada}
                    onChange={handleSelecionarBarbearia}
                    className="bg-gray-800/80 border border-gray-700 text-white px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                  >
                    <option value="">Selecionar salão</option>
                    {barbearias.map((b) => (
                      <option key={b.id} value={b.id} className="bg-gray-800">
                        {b.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mensagem de status */}
      {!!msg && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
            msg.startsWith("✅")
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : msg.startsWith("⚠️")
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {msg.startsWith("✅") ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : msg.startsWith("⚠️") ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-semibold">{msg}</p>
        </div>
      )}

      {/* Formulário */}
      <form
        onSubmit={handleSave}
        className="mb-6 lg:mb-8 bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-4 lg:p-6 rounded-xl border border-gray-800 shadow-xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Nome do salão
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Digite o nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Endereço
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Digite o endereço"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Digite o telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Cidade
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Digite a cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
        >
          {editingId ? (
            <>
              <Settings className="w-5 h-5" />
              Salvar alterações
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Adicionar salão
            </>
          )}
        </button>
      </form>

      {/* Lista de barbearias */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando salões...</p>
          </div>
        </div>
      ) : barbearias.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-950/50 border border-gray-800 rounded-xl p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">
            Nenhum salão cadastrado ainda.
          </p>
          <p className="text-gray-500 text-sm">
            Adicione seu primeiro salão usando o formulário acima.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="p-4 text-gray-400 font-semibold text-sm">
                    Nome
                  </th>
                  <th className="p-4 text-gray-400 font-semibold text-sm">
                    Endereço
                  </th>
                  <th className="p-4 text-gray-400 font-semibold text-sm">
                    Telefone
                  </th>
                  <th className="p-4 text-gray-400 font-semibold text-sm">
                    Cidade
                  </th>
                  <th className="p-4 text-gray-400 font-semibold text-sm">
                    Link Público
                  </th>
                  <th className="p-4 text-gray-400 font-semibold text-sm">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {barbearias.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="p-4 text-white font-medium">{b.nome}</td>
                    <td className="p-4 text-gray-300">{b.endereco}</td>
                    <td className="p-4 text-gray-300">{b.telefone}</td>
                    <td className="p-4 text-gray-300">{b.cidade}</td>
                    <td className="p-4">
                      <Link
                        href={`/barbearia/${b.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Ver página</span>
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dono/${params.donoid}/barbearias/${b.id}`}
                          className="flex items-center gap-1 bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Editar</span>
                        </Link>
                        <Link
                          href={`/dono/${params.donoid}/barbearias/${b.id}/servicos`}
                          className="flex items-center gap-1 bg-green-600/80 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                        >
                          <Settings className="w-3 h-3" />
                          <span>Serviços</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="flex items-center gap-1 bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {barbearias.map((b) => (
              <div
                key={b.id}
                className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-5 rounded-xl border border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{b.nome}</h3>
                      <p className="text-gray-400 text-sm">{b.cidade}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm flex-1">{b.endereco}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">{b.telefone}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-gray-800">
                  <Link
                    href={`/barbearia/${b.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver página pública
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/dono/${params.donoid}/barbearias/${b.id}`}
                      className="flex items-center justify-center gap-2 bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Link>
                    <Link
                      href={`/dono/${params.donoid}/barbearias/${b.id}/servicos`}
                      className="flex items-center justify-center gap-2 bg-green-600/80 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    >
                      <Settings className="w-4 h-4" />
                      Serviços
                    </Link>
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="flex items-center justify-center gap-2 w-full bg-red-600/80 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
