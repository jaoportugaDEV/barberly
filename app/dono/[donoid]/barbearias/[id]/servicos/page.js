"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import {
  Settings,
  Scissors,
  Euro,
  Clock,
  Plus,
  Edit,
  Trash2,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

export default function DonoServicosPage() {
  const params = useParams();
  const barbeariaId = params.id; // se tua rota for /dono/barbearias/[id]/servicos

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
      .eq("barbearia_id", barbeariaId) // <- importante
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
    if (barbeariaId) fetchServicos();
  }, [barbeariaId]);

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
        .eq("id", editingId)
        .eq("barbearia_id", barbeariaId); // <- segurança

      if (error) {
        console.error("Erro ao atualizar serviço:", error);
        setMsg("❌ Erro ao atualizar serviço");
      } else {
        setMsg("✅ Serviço atualizado com sucesso!");
        resetForm();
        fetchServicos();
      }
    } else {
      // insert
      const { error } = await supabase.from("services").insert([
        {
          name,
          price,
          duration_minutes: duration,
          barbearia_id: barbeariaId, // <- vínculo com a barbearia
        },
      ]);

      if (error) {
        console.error("Erro ao criar serviço:", error);
        setMsg("❌ Erro ao criar serviço");
      } else {
        setMsg("✅ Serviço criado com sucesso!");
        resetForm();
        fetchServicos();
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setDuration("");
  };

  // excluir serviço
  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("barbearia_id", barbeariaId);

    if (error) {
      console.error("Erro ao excluir serviço:", error);
      setMsg("❌ Erro ao excluir serviço");
    } else {
      setMsg("✅ Serviço excluído!");
      fetchServicos();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full"></div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
            Gerenciar Serviços
          </h1>
        </div>
        <p className="text-gray-400 text-sm lg:text-base ml-4">
          Adicione e gerencie os serviços oferecidos pela sua barbearia
        </p>
      </div>

      {/* Formulário */}
      <form
        onSubmit={handleSave}
        className="mb-6 lg:mb-8 bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-4 lg:p-6 rounded-xl border border-gray-800 shadow-xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Nome do serviço
            </label>
            <div className="relative">
              <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Ex: Corte de cabelo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Preço (€)
            </label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Duração (min)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="number"
                min="1"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-white placeholder-gray-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {editingId ? (
                <>
                  <Save className="w-5 h-5" />
                  Salvar alterações
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Adicionar serviço
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {!!msg && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
            msg.startsWith("✅")
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {msg.startsWith("✅") ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-semibold">{msg}</p>
        </div>
      )}

      {/* Lista de serviços */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando serviços...</p>
          </div>
        </div>
      ) : servicos.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-950/50 border border-gray-800 rounded-xl p-12 text-center">
          <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">
            Nenhum serviço cadastrado ainda.
          </p>
          <p className="text-gray-500 text-sm">
            Adicione seu primeiro serviço usando o formulário acima.
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
                    Preço
                  </th>
                  <th className="p-4 text-gray-400 font-semibold text-sm">
                    Duração
                  </th>
                  <th className="p-4 text-gray-400 font-semibold text-sm">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {servicos.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="p-4 text-white font-medium">{s.name}</td>
                    <td className="p-4 text-yellow-400 font-semibold">
                      €{Number(s.price).toFixed(2)}
                    </td>
                    <td className="p-4 text-gray-300">{s.duration_minutes} min</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(s.id);
                            setName(s.name);
                            setPrice(s.price);
                            setDuration(s.duration_minutes);
                          }}
                          className="flex items-center gap-1 bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                        >
                          <Edit className="w-3 h-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="flex items-center gap-1 bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
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
            {servicos.map((s) => (
              <div
                key={s.id}
                className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-5 rounded-xl border border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                      <Scissors className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{s.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {s.duration_minutes} minutos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold text-xl">
                      €{Number(s.price).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => {
                      setEditingId(s.id);
                      setName(s.name);
                      setPrice(s.price);
                      setDuration(s.duration_minutes);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
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
