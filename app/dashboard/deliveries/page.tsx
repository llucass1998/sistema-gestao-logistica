'use client';

import dynamic from 'next/dynamic';
import { FormEventHandler, useEffect, useState } from 'react';
import { socket } from '../../../socket';
import axios from 'axios';

const Map = dynamic(() => import('../../../components/Map'), { 
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 dark:text-gray-400">Carregando Mapa...</div>
});

interface Delivery {
  id: string;
  description: string;
  status: string;
  driverId?: string | null;
  vehicleId?: string | null;
  driver?: { name: string }; 
  vehicle?: { model: string; plate: string }; 
}

interface Driver { id: string; name: string; }
interface Vehicle { id: string; model: string; plate: string; }

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDriverId, setEditDriverId] = useState('');
  const [editVehicleId, setEditVehicleId] = useState('');

  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [newDriverId, setNewDriverId] = useState('');
  const [newVehicleId, setNewVehicleId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadDeliveries() {
      try {
        const response = await axios.get('http://localhost:3333/deliveries');
        setDeliveries(response.data);
      } catch (error) {
        console.error('Erro ao buscar entregas:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDeliveries();
  }, []);

  useEffect(() => {
    socket.on('deliveryStatusUpdate', (updatedDelivery: { id: string, status: string }) => {
      setDeliveries((prevDeliveries) =>
        prevDeliveries.map((delivery) =>
          delivery.id === updatedDelivery.id ? { ...delivery, status: updatedDelivery.status } : delivery
        )
      );
    });
    return () => {
      socket.off('deliveryStatusUpdate');
    };
  }, []);

  const openEditModal = async () => {
    if (!selectedDeliveryId) return;
    
    const deliveryToEdit = deliveries.find(d => d.id === selectedDeliveryId);
    if (deliveryToEdit) {
      setEditDescription(deliveryToEdit.description);
      setEditStatus(deliveryToEdit.status);
      setEditDriverId(deliveryToEdit.driverId || '');
      setEditVehicleId(deliveryToEdit.vehicleId || '');
      
      try {
        const [driversRes, vehiclesRes] = await Promise.all([
          axios.get('http://localhost:3333/drivers'),
          axios.get('http://localhost:3333/vehicles')
        ]);
        setDriversList(driversRes.data);
        setVehiclesList(vehiclesRes.data);
      } catch (error) {
        console.error('Erro ao carregar selects do modal:', error);
      }

      setIsEditModalOpen(true);
    }
  };

  const openCreateModal = async () => {
    setNewDescription('');
    setNewDriverId('');
    setNewVehicleId('');

    try {
      if (driversList.length === 0 || vehiclesList.length === 0) {
        const [driversRes, vehiclesRes] = await Promise.all([
          axios.get('http://localhost:3333/drivers'),
          axios.get('http://localhost:3333/vehicles')
        ]);
        setDriversList(driversRes.data);
        setVehiclesList(vehiclesRes.data);
      }
    } catch (error) {
      console.error('Erro ao carregar selects do modal de criação:', error);
    }

    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);
  const closeEditModal = () => setIsEditModalOpen(false);

  const handleCreateDelivery: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    if (!newDriverId || !newVehicleId) {
      alert('Selecione um motorista e um veículo para criar a entrega.');
      setIsCreating(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3333/deliveries', {
        description: newDescription || 'Nova entrega',
        driverId: newDriverId,
        vehicleId: newVehicleId,
      });

      setDeliveries((prev) => [...prev, response.data]);
      setIsCreateModalOpen(false);
      alert('Entrega criada com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao criar entrega:', error);
      alert('Erro ao cadastrar entrega. Verifique se motoristas e veículos estão corretos.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeliveryId) return;

    setIsSaving(true);

    try {
      await axios.put(`http://localhost:3333/deliveries/${selectedDeliveryId}`, {
        description: editDescription,
        status: editStatus,
        driverId: editDriverId || null,
        vehicleId: editVehicleId || null,
      });

      const updatedDriver = driversList.find(d => d.id === editDriverId);
      const updatedVehicle = vehiclesList.find(v => v.id === editVehicleId);

      setDeliveries(deliveries.map(del => 
        del.id === selectedDeliveryId 
          ? { 
              ...del, 
              description: editDescription, 
              status: editStatus,
              driverId: editDriverId,
              vehicleId: editVehicleId,
              driver: updatedDriver ? { name: updatedDriver.name } : undefined,
              vehicle: updatedVehicle ? { model: updatedVehicle.model, plate: updatedVehicle.plate } : undefined
            } 
          : del
      ));
      
      closeEditModal();
      alert('Entrega atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar entrega:', error);
      alert('Erro ao salvar as alterações. Verifique a API.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDeliveryId) return;

    const deliveryToDelete = deliveries.find(d => d.id === selectedDeliveryId);
    if (!deliveryToDelete) return;

    const confirmDelete = window.confirm(`Tem certeza que deseja excluir a entrega "${deliveryToDelete.description}"?`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3333/deliveries/${selectedDeliveryId}`);
      setDeliveries(deliveries.filter(delivery => delivery.id !== selectedDeliveryId));
      setSelectedDeliveryId(null);
      alert('Entrega removida com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar entrega:', error);
      alert('Erro ao excluir a entrega.');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedDeliveryId(selectedDeliveryId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 rounded-full text-xs font-medium whitespace-nowrap">Pendente</span>;
      case 'IN_TRANSIT': return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 rounded-full text-xs font-medium whitespace-nowrap">Em Trânsito</span>;
      case 'DELIVERED': return <span className="px-2.5 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 rounded-full text-xs font-medium whitespace-nowrap">Entregue</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs font-medium whitespace-nowrap">{status}</span>;
    }
  };

  const inputClass = "w-full h-[40px] px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#185FA5] dark:focus:ring-blue-500 focus:border-transparent transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="w-full flex flex-col gap-6 relative">
      
      {/* 1. CAIXA SUPERIOR */}
      <div className="bg-white dark:bg-gray-800 border border-[var(--color-border-secondary)] dark:border-gray-700 rounded-lg shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] dark:text-white">Gestão de Entregas</h1>
          <p className="text-sm text-[var(--color-text-secondary)] dark:text-gray-400 mt-1">Acompanhe as rotas em tempo real via WebSockets e Mapa.</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <button 
            onClick={handleDelete}
            disabled={!selectedDeliveryId}
            className={`flex-1 sm:flex-none h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
              ${selectedDeliveryId 
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 cursor-pointer' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-600'}`}
          >
            <i className="ti ti-trash"></i> Excluir
          </button>

          <button 
            onClick={openEditModal}
            disabled={!selectedDeliveryId}
            className={`flex-1 sm:flex-none h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
              ${selectedDeliveryId 
                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-600'}`}
          >
            <i className="ti ti-edit"></i> Editar
          </button>

          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-none h-[40px] px-4 bg-[#185FA5] hover:bg-[#0C447C] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <i className="ti ti-plus"></i> Nova entrega
          </button>
        </div>
      </div>

      {/* 2. ÁREA DO MAPA */}
      <div className="rounded-lg shadow-sm w-full h-[300px] overflow-hidden border border-[var(--color-border-secondary)] dark:border-gray-700">
        <Map />
      </div>

      {/* 3. CAIXA INFERIOR (TABELA) */}
      <div className="bg-white dark:bg-gray-800 border border-[var(--color-border-secondary)] dark:border-gray-700 rounded-lg shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--color-background-secondary)] dark:bg-gray-900/50 border-b border-[var(--color-border-secondary)] dark:border-gray-700">
                <th className="w-12 px-6 py-4"></th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">ID / Descrição</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">Motociclista</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">Veículo</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-secondary)] dark:divide-gray-700">
              {loading && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">Carregando entregas...</td></tr>}
              {!loading && deliveries.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">Nenhuma entrega cadastrada no sistema.</td></tr>}
              {!loading && deliveries.map((delivery) => (
                <tr 
                  key={delivery.id} 
                  onClick={() => toggleSelection(delivery.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedDeliveryId === delivery.id 
                      ? 'bg-blue-50/60 hover:bg-blue-50/80 dark:bg-blue-900/30 dark:hover:bg-blue-900/50' 
                      : 'hover:bg-[var(--color-background-secondary)]/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <input type="radio" readOnly checked={selectedDeliveryId === delivery.id} className="w-4 h-4 cursor-pointer accent-[#185FA5]"/>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[14px] font-medium text-[var(--color-text-primary)] dark:text-gray-200 whitespace-nowrap">{delivery.description}</div>
                    <div className="text-[12px] text-[var(--color-text-tertiary)] dark:text-gray-500">#{delivery.id.substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">
                    {delivery.driver?.name || 'Não atribuído'}
                  </td>
                  <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">
                    {delivery.vehicle ? `${delivery.vehicle.model} (${delivery.vehicle.plate})` : 'Não atribuído'}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(delivery.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 4. MODAL DE EDIÇÃO */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Editar Entrega</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className={labelClass}>Descrição</label>
                  <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputClass}>
                    <option value="PENDING">Pendente</option>
                    <option value="IN_TRANSIT">Em Trânsito</option>
                    <option value="DELIVERED">Entregue</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={closeEditModal} className="h-[38px] px-4 text-sm border rounded-md">Cancelar</button>
                <button type="submit" disabled={isSaving} className="h-[38px] px-5 text-sm bg-[#185FA5] text-white rounded-md">{isSaving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL DE CRIAÇÃO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Nova Entrega</h3>
              <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreateDelivery}>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className={labelClass}>Descrição</label>
                  <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className={inputClass} required />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={closeCreateModal} className="h-[38px] px-4 text-sm border rounded-md">Cancelar</button>
                <button type="submit" className="h-[38px] px-5 text-sm bg-[#185FA5] text-white rounded-md">Criar</button>
              </div>
            </form>
           </div>
        </div>
      )}
    </div>
  );
}