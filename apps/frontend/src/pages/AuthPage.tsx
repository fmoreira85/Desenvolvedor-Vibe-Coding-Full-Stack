import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { authApi } from "../services/api/authApi";
import { getApiErrorMessage } from "../services/api/client";
import { useSessionStore } from "../hooks/useSessionStore";

export const AuthPage = () => {
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  return (
    <main className="page-shell min-h-screen items-center justify-center py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_minmax(420px,0.9fr)]">
        <section className="panel hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-8">
          <div className="space-y-6">
            <span className="label">SDR CRM</span>
            <div>
              <h1 className="font-display text-6xl font-semibold leading-[0.92]">
                Orquestre pré-vendas com um funil vivo.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted">
                Conecte workspaces, kanban operacional, campanhas e mensagens geradas por IA em um
                fluxo pensado para SDRs.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Kanban orientado por etapas",
              "Campos obrigatórios por avanço",
              "Mensagens geradas e enviadas do lead"
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/40 bg-white/65 p-4 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </section>

        <Card className="self-center p-6 sm:p-8">
          <div className="mb-6 flex rounded-full border border-border bg-background/70 p-1">
            {[
              ["login", "Entrar"],
              ["register", "Cadastrar"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value as "login" | "register")}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
                  mode === value ? "bg-foreground text-white" : "text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div>
            <p className="label">{mode === "login" ? "Sessão" : "Novo acesso"}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              {mode === "login" ? "Acesse seu cockpit comercial" : "Crie sua operação SDR"}
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            {mode === "register" ? (
              <div>
                <label className="label">Nome</label>
                <Input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
            ) : null}

            <div>
              <label className="label">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <Input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </div>

            <Button
              className="w-full"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  const payload =
                    mode === "login"
                      ? await authApi.login({
                          email: form.email,
                          password: form.password
                        })
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
              {submitting
                ? mode === "login"
                  ? "Entrando..."
                  : "Criando conta..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
};
