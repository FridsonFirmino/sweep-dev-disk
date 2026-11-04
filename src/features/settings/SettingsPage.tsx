import {
  readSettingsPreferences,
  saveSettingsPreferences,
  type SettingsPreferences,
} from "@/features/settings/settings-preferences";
import type { ThemePreference } from "@/hooks/use-theme";
import { FolderPlus, Languages, LockKeyhole, Monitor, Moon, Sun, Trash2, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

interface SettingsPageProps {
  preference: ThemePreference;
  onPreferenceChange: (preference: ThemePreference) => void;
}

const themeChoices: Array<{
  value: ThemePreference;
  label: string;
  description: string;
  Icon: typeof Sun;
}> = [
  {
    value: "system",
    label: "Sistema",
    description: "Seguir a aparência do ambiente de trabalho.",
    Icon: Monitor,
  },
  { value: "light", label: "Claro", description: "Utilizar uma aparência clara.", Icon: Sun },
  { value: "dark", label: "Escuro", description: "Utilizar uma aparência escura.", Icon: Moon },
];

export function SettingsPage({ preference, onPreferenceChange }: SettingsPageProps) {
  const [settings, setSettings] = useState<SettingsPreferences>(readSettingsPreferences);

  useEffect(() => {
    saveSettingsPreferences(settings);
  }, [settings]);

  function update<K extends keyof SettingsPreferences>(key: K, value: SettingsPreferences[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <header className="mb-7 border-b border-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Definições</h1>
        <p className="mt-1.5 text-[13px] text-secondary">
          Configure a interface, as preferências de verificação e as de limpezas
        </p>
      </header>

      <SettingsSection
        icon={<Languages className="size-4" aria-hidden="true" />}
        title="Idioma"
        description="Escolha o idioma da interface. A alteração do idioma ainda não está disponível."
      >
        <label className="flex max-w-md flex-col gap-1.5 text-xs text-secondary">
          Interface language
          <select
            aria-label="Idioma da interface"
            value="pt"
            disabled
            className="h-9 rounded-md border border-border bg-hover px-3 text-[13px] text-foreground opacity-80"
          >
            <option value="pt">Português (PT)</option>
            <option value="en">Inglês (EN)</option>
            <option value="es">Espanhol (ES)</option>
          </select>
        </label>
      </SettingsSection>

      <SettingsSection
        title="Aparência"
        description="Escolha o aspecto do SweepDevDisk no seu ambiente de trabalho."
      >
        <div className="divide-y divide-border rounded-md border border-border">
          {themeChoices.map(({ value, label, description, Icon }) => (
            <label
              key={value}
              className="flex min-h-14 cursor-pointer items-center gap-3 px-3.5 py-2.5"
            >
              <Icon className="size-4 text-secondary" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium">{label}</span>
                <span className="mt-0.5 block text-xs text-muted">{description}</span>
              </span>
              <input
                type="radio"
                name="theme"
                value={value}
                checked={preference === value}
                onChange={() => onPreferenceChange(value)}
                className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </label>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Análise"
        description="Escolha os directórios que o scanner pode percorrer. Ubuntu: /home/utilizador/Projectos ou ~/Projectos. Windows: C:\\Users\\Utilizador\\Projects ou ~/Projects."
      >
        <DirectoryEditor
          title="Directórios dos projectos"
          description="Ubuntu: ~/Documentos/Projectos, ~/Documentos/GitHub. Windows: ~/Documents/Projects ou C:\\Users\\Utilizador\\Documents\\Projects."
          placeholder="ex.: ~/Documentos/Projectos"
          directories={settings.projectDirectories}
          onAdd={(path) =>
            update("projectDirectories", addUnique(settings.projectDirectories, path))
          }
          onRemove={(path) =>
            update(
              "projectDirectories",
              settings.projectDirectories.filter((item) => item !== path),
            )
          }
        />
        <DirectoryEditor
          title="Directórios excluídos"
          description="Caminhos a ignorar durante as análises."
          placeholder="ex.: ~/Work/archive"
          directories={settings.excludedDirectories}
          onAdd={(path) =>
            update("excludedDirectories", addUnique(settings.excludedDirectories, path))
          }
          onRemove={(path) =>
            update(
              "excludedDirectories",
              settings.excludedDirectories.filter((item) => item !== path),
            )
          }
        />
        <div className="divide-y divide-border rounded-md border border-border">
          <SwitchSetting
            label="Seguir ligações simbólicas"
            description="Seguir ligações simbólicas durante a análise. Desactivado por predefinição para evitar sair dos directórios seleccionados."
            checked={settings.followSymbolicLinks}
            onChange={(checked) => update("followSymbolicLinks", checked)}
          />
          <SwitchSetting
            label="Analisar directórios ocultos"
            description="Incluir directórios ocultos na análise de projectos. Activado por predefinição."
            checked={settings.scanHiddenDirectories}
            onChange={(checked) => update("scanHiddenDirectories", checked)}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Limpeza"
        description="Definições de segurança para remover artefactos de desenvolvimento. A limpeza ainda não está ligada ao serviço de sistema."
      >
        <div className="divide-y divide-border rounded-md border border-border">
          <div className="flex min-h-14 items-center justify-between gap-6 px-3.5 py-2.5">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 size-4 text-secondary" aria-hidden="true" />
              <div>
                <p className="text-[13px] font-medium">Método de limpeza</p>
                <p className="mt-0.5 text-xs text-muted">
                  Mover os artefactos seleccionados para o Lixo.
                </p>
              </div>
            </div>
            <span className="rounded border border-border px-2 py-1 text-xs text-secondary">
              Mover para o Lixo
            </span>
          </div>
          <LockedSafetySetting
            label="Confirmar antes da limpeza"
            description="Exigir confirmação antes de remover os artefactos seleccionados."
          />
          <LockedSafetySetting
            label="Recalcular antes da limpeza"
            description="Validar novamente os artefactos seleccionados imediatamente antes da limpeza."
          />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
          <LockKeyhole className="size-3.5" aria-hidden="true" />A confirmação e a validação
          mantêm-se activas por segurança.
        </p>
      </SettingsSection>

      <p className="mt-6 text-[11px] text-muted">
        Os directórios de análise são utilizados pelo scanner. As opções de limpeza ainda não estão
        ligadas ao serviço do sistema.
      </p>
    </div>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="mb-7">
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          {icon && <span className="text-secondary">{icon}</span>}
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-secondary">{description}</p>
      </div>
      {children}
    </section>
  );
}

function DirectoryEditor({
  title,
  description,
  placeholder,
  directories,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  placeholder: string;
  directories: string[];
  onAdd: (path: string) => void;
  onRemove: (path: string) => void;
}) {
  const [value, setValue] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const path = value.trim();
    if (!path) return;
    onAdd(path);
    setValue("");
  }

  return (
    <div className="mb-4 rounded-md border border-border bg-surface p-3.5">
      <div className="mb-3">
        <h3 className="text-[13px] font-medium">{title}</h3>
        <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p>
      </div>
      {directories.length > 0 ? (
        <ul className="mb-3 divide-y divide-border rounded-md border border-border">
          {directories.map((path) => (
            <li key={path} className="flex min-h-9 items-center gap-3 px-3">
              <code className="min-w-0 flex-1 truncate text-xs text-foreground">{path}</code>
              <button
                type="button"
                aria-label={`Remover ${path}`}
                title={`Remover ${path}`}
                onClick={() => onRemove(path)}
                className="rounded p-1 text-muted hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 rounded-md bg-hover px-3 py-2.5 text-xs text-muted">
          Ainda não foram adicionados directórios.
        </p>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          placeholder={placeholder}
          aria-label={`Caminho para ${title.toLowerCase()}`}
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-[13px] placeholder:text-muted focus-visible:outline-2 focus-visible:outline-primary"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FolderPlus className="size-3.5" aria-hidden="true" />
          Adicionar
        </button>
      </form>
    </div>
  );
}

function SwitchSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-[60px] items-center justify-between gap-6 px-3.5 py-2.5">
      <div>
        <p className="text-[13px] font-medium">{label}</p>
        <p className="mt-0.5 max-w-2xl text-xs leading-5 text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${checked ? "bg-primary" : "bg-hover ring-1 ring-border"}`}
      >
        <span
          aria-hidden="true"
          className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${checked ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function LockedSafetySetting({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex min-h-[60px] items-center justify-between gap-6 px-3.5 py-2.5">
      <div>
        <p className="text-[13px] font-medium">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-hover px-2 py-1 text-[11px] font-medium text-secondary">
        <LockKeyhole className="size-3" aria-hidden="true" /> Sempre activo
      </span>
    </div>
  );
}

function addUnique(items: string[], item: string) {
  return items.includes(item) ? items : [...items, item];
}
