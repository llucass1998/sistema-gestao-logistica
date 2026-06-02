'use client';

import { FormEventHandler, useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Vehicle {
  id: string;
  model: string;
  plate: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModel, setEditModel] = useState('');
  const [editPlate, setEditPlate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadVehicles() {
      try {
        const response = await axios.get('http://localhost:3333/vehicles');
        setVehicles(response.data);
      } catch (error) {
        console.error('Erro ao buscar veículos:', error);
      } finally {
        setLoading(false);
      }
    }
    loadVehicles();
  }, []);

  const openEditModal = () => {
    if (!selectedVehicleId) {
      alert('Selecione um veículo antes de editar.');
      return;
    }

    const vehicleToEdit = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicleToEdit) {
      console.error('Veículo selecionado não encontrado:', selectedVehicleId);
      alert('Veículo não encontrado. Atualize a página e tente novamente.');
      return;
    }

    setEditModel(vehicleToEdit.model);
    setEditPlate(vehicleToEdit.plate);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditModel('');
    setEditPlate('');
  };

  const handleSaveEdit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) return;

    setIsSaving(true);

    try {
      await axios.put(`http://localhost:3333/vehicles/${selectedVehicleId}`, {
        model: editModel,
        plate: editPlate,
      });

      setVehicles(vehicles.map(vehicle =>
        vehicle.id === selectedVehicleId
          ? { ...vehicle, model: editModel, plate: editPlate }
          : vehicle
      ));

      closeEditModal();
      alert('Veículo atualizado com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao atualizar veículo:', error);
      const msg = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      alert(msg || 'Erro ao salvar as alterações no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicleId) {
      alert('Selecione um veículo antes de tentar excluir.');
      return;
    }

    const vehicleToDelete = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicleToDelete) return;

    const confirmDelete = window.confirm(`Tem certeza que deseja excluir o veículo ${vehicleToDelete.model}?`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3333/vehicles/${selectedVehicleId}`);
      setVehicles(vehicles.filter(vehicle => vehicle.id !== selectedVehicleId));
      setSelectedVehicleId(null);
      alert('Veículo removido com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao deletar veículo:', error);
      const msg = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      alert(msg || 'Erro ao excluir. O Back-end pode não estar configurado ou o veículo está vinculado a uma entrega.');
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedVehicleId === id) {
      setSelectedVehicleId(null);
    } else {
      setSelectedVehicleId(id);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 relative">

      <div className="bg-white border border-[var(--color-border-secondary)] rounded-lg shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Frota de Veículos</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Gerencie os carros e as rotas disponíveis para você.</p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={!selectedVehicleId}
            className={`flex-1 sm:flex-none h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
              ${selectedVehicleId
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer'
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'}`}
          >
            <i className="ti ti-trash"></i>
            Excluir
          </button>

          <button
            onClick={openEditModal}
            disabled={!selectedVehicleId}
            className={`flex-1 sm:flex-none h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
              ${selectedVehicleId
                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'}`}
          >
            <i className="ti ti-edit"></i>
            Editar
          </button>

          <Link
            href="/dashboard/vehicles/new"
            className="flex-1 sm:flex-none h-[40px] px-4 bg-[#185FA5] hover:bg-[#0C447C] text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <i className="ti ti-plus"></i>
            Veículo novo
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[var(--color-border-secondary)] rounded-lg shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-secondary)]">
                <th className="w-12 px-6 py-4"></th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Modelo</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Placa</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-secondary)]">
              {loading && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">Carregando frota...</td></tr>}
              {!loading && vehicles.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">Nenhum veículo cadastrado.</td></tr>}
              {!loading && vehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  onClick={() => toggleSelection(vehicle.id)}
                  className={`cursor-pointer transition-colors ${selectedVehicleId === vehicle.id ? 'bg-blue-50/60 hover:bg-blue-50/80' : 'hover:bg-[var(--color-background-secondary)]/50'}`}
                >
                  <td className="px-6 py-4">
                    <input type="radio" readOnly checked={selectedVehicleId === vehicle.id} className="w-4 h-4 text-[#185FA5] border-gray-300 focus:ring-[#185FA5] cursor-pointer" />
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-[var(--color-text-primary)]">{vehicle.model}</td>
                  <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)] uppercase">{vehicle.plate}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium whitespace-nowrap">Ativo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-[var(--color-border-secondary)] flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Editar Veículo</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="ti ti-x text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Modelo do Veículo</label>
                  <input
                    type="text"
                    required
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Placa</label>
                  <input
                    type="text"
                    required
                    value={editPlate}
                    onChange={(e) => setEditPlate(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] uppercase"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="h-[40px] px-4 rounded-md border border-[var(--color-border-secondary)] text-[14px] font-medium text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-[40px] px-6 bg-[#185FA5] hover:bg-[#0C447C] text-white text-[14px] font-medium rounded-md shadow-sm transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-70"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}