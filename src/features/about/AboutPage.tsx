import { aboutConfig } from "@/features/about/aboutConfig";
import { openExternalUrl } from "@/lib/open-external-url";
import { Code2, ExternalLink, Github, Heart, Info, LockKeyhole, UserRound } from "lucide-react";

const systemInfo = [
  { label: "Versão", value: aboutConfig.version },
  { label: "Plataformas", value: "Linux | Windows" },
  { label: "Estrutura da aplicação", value: "Tauri 2 · Rust" },
  { label: "Interface", value: "React · TypeScript · Tailwind CSS 4" },
];

export function AboutPage() {
  const repositoryUrl = aboutConfig.repositoryUrl;
  const { developer } = aboutConfig;
  const initials = developer.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <header className="mb-7 border-b border-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Acerca de</h1>
        <p className="mt-1.5 text-[13px] text-secondary">
          Informações sobre o SweepDevDisk e as pessoas que o desenvolvem.
        </p>
      </header>

      <section
        aria-labelledby="product-heading"
        className="rounded-lg border border-border bg-surface p-5"
      >
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-hover">
            <img src="/icon.png" alt="" className="size-9 object-contain" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="product-heading" className="text-lg font-semibold">
              SweepDevDisk
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-5 text-secondary">
              Uma aplicação de ambiente de trabalho que identifica ficheiros de desenvolvimento que
              ocupam espaço e permite rever o que pode ser recuperado, mantendo os dados no
              dispositivo.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {repositoryUrl ? (
                <a
                  href={repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => {
                    event.preventDefault();
                    void openExternalUrl(repositoryUrl).catch(console.error);
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-[13px] font-medium text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Github className="size-4" aria-hidden="true" />
                  Ver no GitHub
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  title="O endereço do repositório ainda não foi configurado."
                  className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md bg-primary/50 px-3 text-[13px] font-medium text-white/80"
                >
                  <Github className="size-4" aria-hidden="true" />
                  Ligação para o GitHub por adicionar
                </button>
              )}
              <span className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-xs text-secondary">
                Versão {aboutConfig.version}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="system-heading" className="mt-7">
        <div className="mb-3 flex items-center gap-2">
          <Info className="size-4 text-secondary" aria-hidden="true" />
          <h2 id="system-heading" className="text-[15px] font-semibold">
            Informações do sistema
          </h2>
        </div>
        <dl className="divide-y divide-border rounded-lg border border-border bg-surface px-4">
          {systemInfo.map(({ label, value }) => (
            <div key={label} className="flex min-h-11 items-center justify-between gap-6 py-2">
              <dt className="text-[13px] text-secondary">{label}</dt>
              <dd className="text-right text-[13px] font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="developer-heading" className="mt-7">
        <div className="mb-3 flex items-center gap-2">
          <UserRound className="size-4 text-secondary" aria-hidden="true" />
          <h2 id="developer-heading" className="text-[15px] font-semibold">
            Developer
          </h2>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4">
          {developer.imageUrl ? (
            <img
              src={developer.imageUrl}
              alt={`Fotografia de perfil de ${developer.name}`}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <div
              aria-label={`Iniciais de ${developer.name}`}
              className="grid size-16 shrink-0 place-items-center rounded-full bg-hover text-lg font-semibold text-secondary"
            >
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold">{developer.name}</h3>
            <p className="mt-1 text-[13px] text-secondary">{developer.title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {developer.socialLinks.length > 0 ? (
                developer.socialLinks.map(({ label, url, icon }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => {
                      event.preventDefault();
                      void openExternalUrl(url).catch(console.error);
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-secondary hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {icon === "github" && <Github className="size-3.5" aria-hidden="true" />}
                    {label}
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                ))
              ) : (
                <span className="text-xs text-muted">
                  As ligações para redes sociais podem ser adicionadas mais tarde.
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Informações do projecto" className="mt-7 grid gap-3 sm:grid-cols-2">
        <AboutNote
          icon={<LockKeyhole className="size-4" aria-hidden="true" />}
          title="Concebido para utilização local"
          description="Os caminhos dos projectos e as operações de limpeza destinam-se a permanecer no seu dispositivo. Não está configurado nenhum serviço remoto."
        />
        <AboutNote
          icon={<Code2 className="size-4" aria-hidden="true" />}
          title="Desenvolvimento em curso"
          description="A interface está a ser desenvolvida por etapas; a análise de projectos e a limpeza ainda não estão disponíveis."
        />
      </section>

      <p className="mt-7 flex items-center justify-center gap-1.5 text-xs text-muted">
        Feito com <Heart className="size-3.5" aria-hidden="true" /> por Fridson Firmino
      </p>
    </div>
  );
}

function AboutNote({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-secondary">
        {icon}
        <h3 className="text-[13px] font-medium text-foreground">{title}</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-secondary">{description}</p>
    </div>
  );
}
