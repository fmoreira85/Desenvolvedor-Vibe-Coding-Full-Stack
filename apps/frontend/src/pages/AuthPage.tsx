import { Eye, EyeOff, KanbanSquare, Megaphone, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { authApi } from "../services/api/authApi";
import { getApiErrorMessage } from "../services/api/client";
import { useSessionStore } from "../hooks/useSessionStore";

export const AuthPage = () => {
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="hidden bg-sidebar p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]">
              SDR CRM
            </div>
            <h1 className="mt-8 max-w-xl font-display text-6xl font-bold leading-[0.95]">
              Prospeccao inteligente com funil, contexto e IA.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Organize o pipeline da equipe, padronize abordagens e acompanhe cada lead em um fluxo operacional mais claro.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: KanbanSquare, title: "Kanban vivo", copy: "Leads movidos por etapa com regras claras." },
              { icon: Megaphone, title: "Campanhas", copy: "Copys guiadas por contexto e gatilhos." },
              { icon: ShieldCheck, title: "Governanca", copy: "Workspace isolado e trilha de atividade." }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Icon className="h-5 w-5 text-slate-200" />
                  <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.copy}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex items-center justify-center p-8">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-ambient">
            <div className="mb-6 flex rounded-full border border-border bg-muted p-1">
              {[
                ["login", "Entrar"],
                ["register", "Cadastrar"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value as "login" | "register")}
                  className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
                    mode === value ? "bg-primary text-white" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="label">{mode === "login" ? "Bem-vindo de volta" : "Novo workspace comercial"}</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              {mode === "login" ? "Entre na sua conta" : "Crie sua conta SDR"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "login" ? "Acesse o sistema para continuar a operacao." : "Cadastre-se para iniciar um novo workspace."}
            </p>

            <div className="mt-6 space-y-4">
              {mode === "register" ? (
                <div>
                  <label className="label">Nome</label>
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </div>
              ) : null}

              <div>
                <label className="label">Email</label>
                <Input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>

              <div>
                <label className="label">Senha</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-[1.05rem] text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    const payload =
                      mode === "login"
                        ? await authApi.login({ email: form.email, password: form.password })
                        : await authApi.register({
                            name: form.name,
                            email: form.email,
                            password: form.password
                          });

                    setSession(payload);
                    toast.success(mode === "login" ? "Login realizado." : "Conta criada com sucesso.");
                    navigate(payload.workspaces.length > 0 ? "/dashboard" : "/workspaces");
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {submitting ? (mode === "login" ? "Entrando..." : "Criando conta...") : mode === "login" ? "Entrar" : "Criar conta"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
