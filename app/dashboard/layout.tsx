'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import 'leaflet/dist/leaflet.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    // 1. O SEGREDO ESTÁ AQUI: h-screen (trava na altura do monitor) e overflow-hidden (corta rolagem da página toda)
    <div className="flex h-screen w-full bg-[var(--color-background-primary)] font-sans text-[var(--color-text-primary)] overflow-hidden">
      
      {/* 2. SIDEBAR AZUL: h-full garante que ela vai de ponta a ponta na vertical */}
      <aside className="w-[240px] shrink-0 bg-[#0C447C] flex flex-col h-full z-10 transition-transform">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <i className="ti ti-truck-delivery text-[28px] text-[#85B7EB]"></i>
            <div>
              <div className="text-[15px] font-bold text-[#E6F1FB] leading-snug tracking-wide">LogiTrack</div>
              <div className="text-[11px] text-[#85B7EB] uppercase tracking-wider">PAINEL OPERACIONAL</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-6">
          <ul className="space-y-1">
            <li>
              <Link 
                href="/dashboard"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-[14px] font-medium transition-colors ${
                  pathname === '/dashboard' 
                    ? 'bg-[#185FA5] text-white shadow-md' 
                    : 'text-[#E6F1FB] hover:bg-[#185FA5]/50'
                }`}
              >
                <i className="ti ti-package text-lg"></i>
                Entregas
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/drivers"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-[14px] font-medium transition-colors ${
                  pathname.includes('/dashboard/drivers') 
                    ? 'bg-[#185FA5] text-white shadow-md' 
                    : 'text-[#E6F1FB] hover:bg-[#185FA5]/50'
                }`}
              >
                <i className="ti ti-steering-wheel text-lg"></i>
                Motociclistas
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/vehicles"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-[14px] font-medium transition-colors ${
                  pathname.includes('/dashboard/vehicles') 
                    ? 'bg-[#185FA5] text-white shadow-md' 
                    : 'text-[#E6F1FB] hover:bg-[#185FA5]/50'
                }`}
              >
                <i className="ti ti-car text-lg"></i>
                Veículos
              </Link>
            </li>
          </ul>
        </nav>

        {/* Esse mt-auto joga o botão de sair lá pro final da barra */}
        <div className="p-4 mt-auto">
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-[#85B7EB] hover:text-[#E6F1FB] hover:bg-white/10 transition-colors text-[13px] font-medium">
            <i className="ti ti-logout text-lg"></i>
            Sistema de saída
          </Link>
        </div>
      </aside>

      {/* 3. ÁREA CENTRAL: O overflow-y-auto entra aqui. Se a tabela crescer, só essa parte branca tem scroll! */}
      <main className="flex-1 h-full overflow-y-auto p-6 md:p-10 lg:p-12 relative">
        <div className="w-full max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}