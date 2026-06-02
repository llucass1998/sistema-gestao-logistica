'use client';

import dynamic from 'next/dynamic';
import { FormEventHandler, useEffect, useState } from 'react';
import { socket } from '../../socket';
import axios from 'axios';

// Carrega o mapa desativando o SSR
const Map = dynamic(() => import('../../components/Map'), { 
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center bg-gray-100">Carregando Mapa...</div>
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

// Interfaces auxiliares para os selects do Modal
interface Driver { id: string; name: string; }
interface Vehicle { id: string; model: string; plate: string; }

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  // ==========================================
  // ESTADOS DO MODAL DE EDIÇÃO
  // ==========================================
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDriverId, setEditDriverId] = useState('');
  const [editVehicleId, setEditVehicleId] = useState('');

  // Listas para popular os selects no momento da edição
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [newDriverId, setNewDriverId] = useState('');
  const [newVehicleId, setNewVehicleId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // ==========================================
  // BUSCANDO AS ENTREGAS REAIS
  // ==========================================
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

  // ==========================================
  // WEBSOCKETS (Status em tempo real)
  // ==========================================
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

  // ==========================================
  // FUNÇÕES DO MODAL DE EDIÇÃO
  // ==========================================
  const openEditModal = async () => {
    if (!selectedDeliveryId) return;
    
    const deliveryToEdit = deliveries.find(d => d.id === selectedDeliveryId);
    if (deliveryToEdit) {
      setEditDescription(deliveryToEdit.description);
      setEditStatus(deliveryToEdit.status);
      setEditDriverId(deliveryToEdit.driverId || '');
      setEditVehicleId(deliveryToEdit.vehicleId || '');
      
      // Busca a lista de motoristas e veículos disponíveis para popular o formulário
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

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

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

  const closeEditModal = () => {
    setIsEditModalOpen(false);
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

      // Atualiza a tabela na tela de forma inteligente (recuperando os nomes pro layout)
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

  // ==========================================
  // FUNÇÃO DE DELETAR
  // ==========================================
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
    if (selectedDeliveryId === id) {
      setSelectedDeliveryId(null);
    } else {
      setSelectedDeliveryId(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium whitespace-nowrap">Pendente</span>;
      case 'IN_TRANSIT': return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium whitespace-nowrap">Em Trânsito</span>;
      case 'DELIVERED': return <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium whitespace-nowrap">Entregue</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 relative">
      
      {/* 1. CAIXA SUPERIOR */}
      <div className="bg-white border border-[var(--color-border-secondary)] rounded-lg shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Gestão de Entregas</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Acompanhe as rotas em tempo real via WebSockets e Mapa.</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <button 
            onClick={handleDelete}
            disabled={!selectedDeliveryId}
            className={`flex-1 sm:flex-none h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
              ${selectedDeliveryId ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer' : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'}`}
          >
            <i className="ti ti-trash"></i> Excluir
          </button>

          <button 
            onClick={openEditModal}
            disabled={!selectedDeliveryId}
            className={`flex-1 sm:flex-none h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
              ${selectedDeliveryId ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer' : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'}`}
          >
            <i className="ti ti-edit"></i> Editar
          </button>

          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-none h-[40px] px-4 bg-[#185FA5] hover:bg-[#0C447C] text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <i className="ti ti-plus"></i> Nova entrega
          </button>
        </div>
      </div>

      {/* 2. ÁREA DO MAPA */}
      <div className="rounded-lg shadow-sm w-full h-[300px] overflow-hidden border border-[var(--color-border-secondary)]">
        <Map />
      </div>

      {/* 3. CAIXA INFERIOR (TABELA) */}
      <div className="bg-white border border-[var(--color-border-secondary)] rounded-lg shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-secondary)]">
                <th className="w-12 px-6 py-4"></th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">ID / Descrição</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Motociclista</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Veículo</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-secondary)]">
              {loading && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">Carregando entregas...</td></tr>}
              {!loading && deliveries.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">Nenhuma entrega cadastrada no sistema.</td></tr>}
              {!loading && deliveries.map((delivery) => (
                <tr 
                  key={delivery.id} 
                  onClick={() => toggleSelection(delivery.id)}
                  className={`cursor-pointer transition-colors ${selectedDeliveryId === delivery.id ? 'bg-blue-50/60 hover:bg-blue-50/80' : 'hover:bg-[var(--color-background-secondary)]/50'}`}
                >
                  <td className="px-6 py-4">
                    <input type="radio" readOnly checked={selectedDeliveryId === delivery.id} className="w-4 h-4 text-[#185FA5] border-gray-300 focus:ring-[#185FA5] cursor-pointer"/>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[14px] font-medium text-[var(--color-text-primary)] whitespace-nowrap">{delivery.description}</div>
                    <div className="text-[12px] text-[var(--color-text-tertiary)]">#{delivery.id.substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)] whitespace-nowrap">
                    {delivery.driver?.name || 'Não atribuído'}
                  </td>
                  <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)] whitespace-nowrap">
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

      {/* ======================================================== */}
      {/* 4. MODAL DE EDIÇÃO AVANÇADO (Com Status e Relacionamentos) */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-[var(--color-border-secondary)] flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Nova Entrega</h3>
              <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="ti ti-x text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Descrição</label>
                  <input
                    type="text"
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                    placeholder="Descrição da entrega"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Motociclista</label>
                    <select
                      value={newDriverId}
                      onChange={(e) => setNewDriverId(e.target.value)}
                      className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] bg-white"
                      required
                    >
                      <option value="">Selecione um motorista</option>
                      {driversList.map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Veículo</label>
                    <select
                      value={newVehicleId}
                      onChange={(e) => setNewVehicleId(e.target.value)}
                      className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] bg-white"
                      required
                    >
                      <option value="">Selecione um veículo</option>
                      {vehiclesList.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>{vehicle.model} ({vehicle.plate})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="h-[40px] px-4 rounded-md border border-[var(--color-border-secondary)] text-[14px] font-medium text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="h-[40px] px-6 bg-[#185FA5] hover:bg-[#0C447C] text-white text-[14px] font-medium rounded-md shadow-sm transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-70"
                >
                  {isCreating ? 'Criando...' : 'Criar Entrega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-[var(--color-border-secondary)] flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Editar Entrega</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="ti ti-x text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Descrição do Pacote</label>
                  <input
                    type="text"
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Status da Entrega</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] bg-white"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="IN_TRANSIT">Em Trânsito</option>
                    <option value="DELIVERED">Entregue</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Motociclista</label>
                    <select
                      value={editDriverId}
                      onChange={(e) => setEditDriverId(e.target.value)}
                      className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] bg-white"
                    >
                      <option value="">Não atribuído</option>
                      {driversList.map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Veículo</label>
                    <select
                      value={editVehicleId}
                      onChange={(e) => setEditVehicleId(e.target.value)}
                      className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] bg-white"
                    >
                      <option value="">Não atribuído</option>
                      {vehiclesList.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>{vehicle.model} ({vehicle.plate})</option>
                      ))}
                    </select>
                  </div>
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