'use client';

import { useEffect, useState } from 'react';
import { socket } from '../../socket';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Delivery {
  id: string;
  description: string;
  status: string;
  driver?: { name: string }; 
  vehicle?: { model: string; plate: string }; 
}

export default function DeliveriesPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado de seleção da linha
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

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

  // WebSockets para atualizar o status em tempo real
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
  // AÇÕES DOS BOTÕES SUPERIORES
  // ==========================================
  const handleEdit = () => {
    if (selectedDeliveryId) {
      router.push(`/dashboard/deliveries/${selectedDeliveryId}/edit`);
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
    <div className="w-full flex flex-col gap-6">
      
      {/* ======================================================== */}
      {/* 1. CAIXA SUPERIOR (FERRAMENTAS) */}
      {/* ======================================================== */}
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
              ${selectedDeliveryId 
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'}`}
          >
            <i className="ti ti-trash"></i>
            Excluir
          </button>

          <button 
            onClick={handleEdit}
            disabled={!selectedDeliveryId}
            className={`flex-1 sm:flex-none h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
              ${selectedDeliveryId 
                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'}`}
          >
            <i className="ti ti-edit"></i>
            Editar
          </button>

          <Link 
            href="/dashboard/deliveries/new"
            className="flex-1 sm:flex-none h-[40px] px-4 bg-[#185FA5] hover:bg-[#0C447C] text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <i className="ti ti-plus"></i>
            Nova entrega
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ÁREA DO MAPA (ESPAÇO RESERVADO) */}
      {/* ======================================================== */}
      <div className="bg-gray-100 border border-dashed border-gray-300 rounded-lg shadow-sm w-full h-[300px] flex flex-col items-center justify-center text-gray-400">
        <i className="ti ti-map-2 text-4xl mb-2"></i>
        <p className="font-medium text-sm">O Mapa Interativo (Leaflet) será renderizado aqui</p>
      </div>

      {/* ======================================================== */}
      {/* 3. CAIXA INFERIOR (TABELA) */}
      {/* ======================================================== */}
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
              
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">Carregando entregas...</td>
                </tr>
              )}

              {!loading && deliveries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">Nenhuma entrega cadastrada no sistema.</td>
                </tr>
              )}

              {!loading && deliveries.map((delivery) => (
                <tr 
                  key={delivery.id} 
                  onClick={() => toggleSelection(delivery.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedDeliveryId === delivery.id 
                      ? 'bg-blue-50/60 hover:bg-blue-50/80' 
                      : 'hover:bg-[var(--color-background-secondary)]/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <input 
                      type="radio" 
                      readOnly 
                      checked={selectedDeliveryId === delivery.id} 
                      className="w-4 h-4 text-[#185FA5] border-gray-300 focus:ring-[#185FA5] cursor-pointer"
                    />
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
    </div>
  );
}