'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Driver {
  id: string;
  name: string;
  email: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDrivers() {
      try {
        const response = await axios.get('http://localhost:3333/drivers');
        setDrivers(response.data);
      } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDrivers();
  }, []);

  return (
    <div className="w-full">
      {/* Cabeçalho Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Equipe de Motoristas</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Gerencie os condutores da sua operação.</p>
        </div>
        
        <Link 
          href="/dashboard/drivers/new"
          className="w-full sm:w-auto h-[40px] px-4 bg-[#185FA5] hover:bg-[#0C447C] text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <i className="ti ti-plus"></i>
          Novo Motorista
        </Link>
      </div>

      {/* Caixa da Tabela */}
      <div className="bg-white border border-[var(--color-border-secondary)] rounded-lg shadow-sm overflow-hidden w-full">
        {/* O truque do scroll lateral no celular está nesta div abaixo: */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-secondary)]">
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Nome</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">E-mail / Contato</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-secondary)]">
              
              {loading && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">Carregando equipe...</td>
                </tr>
              )}

              {!loading && drivers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">Nenhum motorista encontrado.</td>
                </tr>
              )}

              {!loading && drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-[var(--color-background-secondary)]/50 transition-colors">
                  <td className="px-6 py-4 text-[14px] font-medium text-[var(--color-text-primary)]">{driver.name}</td>
                  <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)]">{driver.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium whitespace-nowrap">Disponível</span>
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