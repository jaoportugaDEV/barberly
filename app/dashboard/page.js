"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

const gerarHorarios = () => {
  const horarios = [];
  for (let h = 9; h <= 19; h++) {
    horarios.push(`${h.toString().padStart(2, "0")}:00`);
  }
  return horarios;
};

const diasSemana = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

export default function DashboardPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [clienteId, setClienteId] = useState("");
  const [clienteNomeManual, setClienteNomeManual] = useState("");
  const [servico, setServico] = useState("");
  const [hora, setHora] = useState("09:00");
  const [dia, setDia] = useState("Segunda");
  const [status, setStatus] = useState("confirmado");

  // carregar agendamentos e clientes
  useEffect(() => {
    const savedAgenda = localStorage.getItem("barberly_agenda_semanal");
    if (savedAgenda) setAgendamentos(JSON.parse(savedAgenda));

    const savedClientes = localStorage.getItem("barberly_clientes");
    if (savedClientes) setClientes(JSON.parse(savedClientes));
  }, []);

  // salvar agendamentos
  useEffect(() => {
    localStorage.setItem("barberly_agenda_semanal", JSON.stringify(agendamentos));
  }, [agendamentos]);

  // abrir modal
  const novoAgendamento = () => {
    setEditingId(null);
    setClienteId("");
    setClienteNomeManual("");
    setServico("");
    setHora("09:00");
    setDia("Segunda");
    setStatus("confirmado");
    setShowModal(true);
  };

  // salvar
  const salvarAgendamento = (e) => {
    e.preventDefault();
    if (!servico || !hora || !dia) return;

    let agendamentoData = {
      id: editingId || crypto.randomUUID(),
      clienteId: clienteId || null,
      clienteNomeManual: clienteId ? "" : clienteNomeManual,
      servico,
      hora,
      dia,
      status,
    };

    if (editingId) {
      setAgendamentos((prev) =>
        prev.map((a) => (a.id === editingId ? agendamentoData : a))
      );
    } else {
      setAgendamentos((prev) => [...prev, agendamentoData]);
    }

    setShowModal(false);
  };

  // editar
  const editarAgendamento = (a) => {
    setEditingId(a.id);
    setClienteId(a.clienteId || "");
    setClienteNomeManual(a.clienteNomeManual || "");
    setServico(a.servico);
    setHora(a.hora);
    setDia(a.dia);
    setStatus(a.status);
    setShowModal(true);
  };

  // remover
  const removerAgendamento = (id) => {
    if (!confirm("Deseja remover este agendamento?")) return;
    setAgendamentos((prev) => prev.filter((a) => a.id !== id));
  };

  // obter info do cliente
  const getClienteInfo = (a) => {
    if (a.clienteId) {
      const cliente = clientes.find((c) => c.id === a.clienteId);
      if (cliente) {
        return {
          nome: cliente.nome,
          telefone: cliente.telefone,
          email: cliente.email,
        };
      }
    }
    return { nome: a.clienteNomeManual || "Cliente não identificado" };
  };

  const statusColors = {
    confirmado: "bg-green-600",
    pendente: "bg-yellow-600",
    cancelado: "bg-red-600",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">
        Agenda Semanal
      </h1>

      {/* Botão Novo */}
      <button
        onClick={novoAgendamento}
        className="mb-6 flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg"
      >
        <Plus size={18} /> Novo Agendamento
      </button>

      {/* Grade semanal */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-800">
          <thead>
            <tr className="bg-gray-900">
              <th className="border border-gray-800 p-2 text-gray-300 w-24">
                Hora
              </th>
              {diasSemana.map((d) => (
                <th
                  key={d}
                  className="border border-gray-800 p-2 text-gray-300"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gerarHorarios().map((h) => (
              <tr key={h}>
                <td className="border border-gray-800 p-2 text-gray-400 text-center">
                  {h}
                </td>
                {diasSemana.map((d) => (
                  <td
                    key={d}
                    className="border border-gray-800 p-2 align-top min-h-[60px]"
                  >
                    <div className="space-y-2">
                      {agendamentos
                        .filter((a) => a.hora === h && a.dia === d)
                        .map((a) => {
                          const info = getClienteInfo(a);
                          return (
                            <div
                              key={a.id}
                              className={`p-2 rounded-lg text-white ${statusColors[a.status]} flex justify-between items-center`}
                            >
                              <div>
                                <p className="font-bold text-sm">{info.nome}</p>
                                {info.telefone && (
                                  <p className="text-xs">{info.telefone}</p>
                                )}
                                {info.email && (
                                  <p className="text-[11px] opacity-80">
                                    {info.email}
                                  </p>
                                )}
                                <p className="text-[10px] opacity-80">
                                  {a.servico} - {a.status}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => editarAgendamento(a)}
                                  className="bg-gray-800 hover:bg-gray-700 p-1 rounded"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => removerAgendamento(a.id)}
                                  className="bg-gray-800 hover:bg-gray-700 p-1 rounded"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingId ? "Editar Agendamento" : "Novo Agendamento"}
            </h2>
            <form onSubmit={salvarAgendamento} className="space-y-4">
              {/* Selecionar cliente */}
              <div>
                <label className="block text-gray-300 mb-1">Cliente</label>
                <select
                  value={clienteId}
                  onChange={(e) => {
                    setClienteId(e.target.value);
                    setClienteNomeManual("");
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white mb-2"
                >
                  <option value="">-- Selecione um cliente --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.telefone})
                    </option>
                  ))}
                </select>
                {/* Campo livre para cliente novo */}
                {!clienteId && (
                  <input
                    type="text"
                    placeholder="Ou digite o nome do cliente"
                    value={clienteNomeManual}
                    onChange={(e) => setClienteNomeManual(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                  />
                )}
              </div>

              <input
                type="text"
                placeholder="Serviço (ex: Corte, Barba)"
                value={servico}
                onChange={(e) => setServico(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              />

              <select
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              >
                {gerarHorarios().map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>

              <select
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              >
                {diasSemana.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              >
                <option value="confirmado">Confirmado</option>
                <option value="pendente">Pendente</option>
                <option value="cancelado">Cancelado</option>
              </select>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  <X size={16} /> Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-lg"
                >
                  <Save size={16} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
