import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { FolderPlus, Languages, LockKeyhole, Monitor, Moon, Sun, Trash2, X } from "lucide-react";
import type { ThemePreference } from "@/hooks/use-theme";
import {
  readSettingsPreferences,
  saveSettingsPreferences,
  type SettingsPreferences,
} from "@/features/settings/settings-preferences";

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
    label: "System",
    description: "Follow your desktop appearance.",
    Icon: Monitor,
  },
  { value: "light", label: "Light", description: "Use a light appearance.", Icon: Sun },
  { value: "dark", label: "Dark", description: "Use a dark appearance.", Icon: Moon },
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
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-[13px] text-secondary">
          Configure the interface, scanning preferences and cleanup safeguards.
        </p>
      </header>

      <SettingsSection
        icon={<Languages className="size-4" aria-hidden="true" />}
        title="Language"
        description="Choose the language used by the interface. Language switching is not available yet."
      >
        <label className="flex max-w-md flex-col gap-1.5 text-xs text-secondary">
          Interface language
          <select
            aria-label="Interface language"
            value="pt"
            disabled
            className="h-9 rounded-md border border-border bg-hover px-3 text-[13px] text-foreground opacity-80"
          >
            <option value="pt">Português (PT)</option>
            <option value="en">English (EN)</option>
            <option value="es">Español (ES)</option>
          </select>
        </label>
      </SettingsSection>

      <SettingsSection
        title="Appearance"
        description="Choose how SweepDevDisk looks on your desktop."
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
        title="Scanning"
        description="Choose where project scans look and which directories they include. These preferences are saved locally; scanner integration is not available yet."
      >
        <DirectoryEditor
          title="Project directories"
          description="Directories to search for projects. Examples: ~/Projects, ~/Documents/GitHub, ~/Work."
          placeholder="e.g. ~/Projects"
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
          title="Excluded directories"
          description="Paths to skip during scans."
          placeholder="e.g. ~/Work/archive"
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
            label="Follow symbolic links"
            description="Follow symlinks while scanning. Disabled by default to avoid leaving selected directories."
            checked={settings.followSymbolicLinks}
            onChange={(checked) => update("followSymbolicLinks", checked)}
          />
          <SwitchSetting
            label="Scan hidden directories"
            description="Include hidden directories in project scans."
            checked={settings.scanHiddenDirectories}
            onChange={(checked) => update("scanHiddenDirectories", checked)}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Cleanup"
        description="Safety settings for removing development artifacts. Cleanup is not connected to the backend yet."
      >
        <div className="divide-y divide-border rounded-md border border-border">
          <div className="flex min-h-14 items-center justify-between gap-6 px-3.5 py-2.5">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 size-4 text-secondary" aria-hidden="true" />
              <div>
                <p className="text-[13px] font-medium">Cleanup method</p>
                <p className="mt-0.5 text-xs text-muted">Send selected artifacts to the Trash.</p>
              </div>
            </div>
            <span className="rounded border border-border px-2 py-1 text-xs text-secondary">
              Move to Trash
            </span>
          </div>
          <LockedSafetySetting
            label="Confirm before cleanup"
            description="Require confirmation before removing selected artifacts."
          />
          <LockedSafetySetting
            label="Recalculate before cleanup"
            description="Revalidate selected artifacts immediately before cleanup."
          />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          Confirmation and revalidation stay enabled for safety.
        </p>
      </SettingsSection>

      <p className="mt-6 text-[11px] text-muted">
        Scanning and cleanup preferences are stored locally, but will not affect operations until
        the Rust backend integration is implemented.
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
                aria-label={`Remove ${path}`}
                title={`Remove ${path}`}
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
          No directories added.
        </p>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          placeholder={placeholder}
          aria-label={`Path for ${title.toLowerCase()}`}
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-[13px] placeholder:text-muted focus-visible:outline-2 focus-visible:outline-primary"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FolderPlus className="size-3.5" aria-hidden="true" />
          Add
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
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`}
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
        <LockKeyhole className="size-3" aria-hidden="true" /> Always on
      </span>
    </div>
  );
}

function addUnique(items: string[], item: string) {
  return items.includes(item) ? items : [...items, item];
}
