"use client";

import { FormEventHandler, useState } from "react";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

// ==========================================
// 1. CRIANDO O SCHEMA DO ZOD
// ==========================================
const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, digite um e-mail válido." }),
  password: z
    .string()
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

export default function LoginPage() {
  const router = useRouter(); // <-- Ativando o roteador de navegação

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Controle do botão de carregamento

  const handleLogin: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault(); // Evita recarregar a página

    // ==========================================
    // 2. VALIDANDO OS DADOS COM O ZOD
    // ==========================================
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      setErrorMsg(result.error.issues[0]?.message || "Erro de validação");
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    try {
      // ==========================================
      // 3. INTEGRAÇÃO COM O BACK-END
      // ==========================================
      const response = await axios.post("http://localhost:3333/login", {
        email: result.data.email,
        password: result.data.password,
      });

      console.log("✅ Login bem-sucedido!", response.data);

      // Salva o Token JWT no navegador (para futuras requisições seguras)
      if (response.data.token) {
        localStorage.setItem("logitrack_token", response.data.token);
      }

      // Redireciona para o Painel de Controle!
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Erro no login:", error);

      // Tratamento de erro elegante se o usuário digitar a senha errada
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        setErrorMsg("E-mail ou senha incorretos.");
      } else {
        setErrorMsg("Erro de conexão. Verifique se o servidor está rodando.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl flex min-h-[520px] bg-white rounded-lg overflow-hidden border border-gray-200 shadow-xl">
      {/* Lado Esquerdo (Sidebar) */}
      <div className="w-[240px] shrink-0 bg-[#0C447C] p-8 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <i
              className="ti ti-truck-delivery text-[28px] text-[#85B7EB]"
              aria-hidden="true"
            ></i>
            <span className="text-[15px] font-medium text-[#E6F1FB] leading-snug">
              Sistema de Gestão Logística
            </span>
          </div>
        </div>

        <div className="text-[12px] text-[#378ADD]">© 2026 LogiTrack</div>
      </div>

      {/* Lado Direito (Formulário) */}
      <div className="flex-1 bg-[var(--color-background-primary)] p-10 flex flex-col justify-center">
        <div className="mb-7">
          <h1 className="text-xl font-medium text-[var(--color-text-primary)]">
            Bem-vindo
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Acesse sua conta
          </p>
        </div>

        {/* Caixa de Erro Dinâmica */}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-[var(--color-background-danger)] text-[var(--color-text-danger)] text-[13px] px-3 py-2 rounded-md mb-4 border border-[var(--color-border-danger)]">
            <i className="ti ti-alert-circle" aria-hidden="true"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-[13px] text-[var(--color-text-secondary)] mb-1.5"
            >
              E-mail
            </label>
            <div className="relative">
              <i
                className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[var(--color-text-secondary)] pointer-events-none"
                aria-hidden="true"
              ></i>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={isLoading}
                className="w-full h-[40px] pl-10 pr-3 border border-[var(--color-border-secondary)] rounded-md bg-[var(--color-background-primary)] text-[var(--color-text-primary)] text-sm outline-none transition-colors focus:border-[#378ADD] focus:ring-2 focus:ring-[#378ADD]/10 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Senha */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-[13px] text-[var(--color-text-secondary)] mb-1.5"
            >
              Senha
            </label>
            <div className="relative">
              <i
                className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[var(--color-text-secondary)] pointer-events-none"
                aria-hidden="true"
              ></i>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full h-[40px] pl-10 pr-10 border border-[var(--color-border-secondary)] rounded-md bg-[var(--color-background-primary)] text-[var(--color-text-primary)] text-sm outline-none transition-colors focus:border-[#378ADD] focus:ring-2 focus:ring-[#378ADD]/10 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] text-[17px]"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                <i
                  className={showPassword ? "ti ti-eye-off" : "ti ti-eye"}
                  aria-hidden="true"
                ></i>
              </button>
            </div>
          </div>

          {/* Opções */}
          <div className="flex justify-between items-center mb-5">
            <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                className="w-[15px] h-[15px] cursor-pointer accent-[#185FA5]"
              />
              Lembrar de mim
            </label>
            <a
              href="#"
              className="text-[13px] text-[#378ADD] hover:text-[#185FA5] transition-colors"
            >
              Esqueci a senha
            </a>
          </div>

          {/* Botão de Entrar */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[42px] bg-[#185FA5] hover:bg-[#0C447C] active:scale-[0.98] transition-all text-[#E6F1FB] font-medium text-[15px] rounded-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <i className="ti ti-login" aria-hidden="true"></i>
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <hr className="flex-1 border-t border-[var(--color-border-tertiary)]" />
          <span className="text-[12px] text-[var(--color-text-tertiary)] whitespace-nowrap">
            Novo por aqui?
          </span>
          <hr className="flex-1 border-t border-[var(--color-border-tertiary)]" />
        </div>

        {/* Botão de Criar Conta (Secundário) */}
        <Link
          href="/register"
          className="w-full h-[40px] bg-white hover:bg-gray-50 border border-[var(--color-border-secondary)] rounded-md flex items-center justify-center gap-2 text-[14px] text-[var(--color-text-primary)] font-medium transition-colors"
        >
          <i className="ti ti-user-plus" aria-hidden="true"></i>
          Criar nova conta
        </Link>
      </div>
    </div>
  );
}
