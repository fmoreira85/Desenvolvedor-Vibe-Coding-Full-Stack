const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const setupChecklist = [
  "Monorepo inicializado com frontend e backend em TypeScript",
  "Docker Compose com postgres, backend e frontend",
  "Variaveis de ambiente padronizadas em .env e .env.example",
  "Base pronta para iniciar migrations, auth e UI nas proximas fases"
];

export default function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">SDR CRM</p>
        <h1>Base do projeto pronta para a Fase 1.</h1>
        <p className="summary">
          Este ambiente sobe com Docker e expõe um frontend React + Vite e um
          backend Express em TypeScript.
        </p>
      </section>

      <section className="card-grid">
        <article className="card">
          <h2>Ambiente local</h2>
          <p>
            API esperada em <strong>{apiUrl}</strong>
          </p>
        </article>

        <article className="card">
          <h2>Próximos passos</h2>
          <ul>
            {setupChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
