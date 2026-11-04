//! Analisa apenas as raízes configuradas e nunca modifica ficheiros.
//! Aplica exclusões, opções de ocultos e a política de ligações simbólicas definida em SCANNER.md.
//! Os limites de profundidade, entradas e avisos protegem o tempo e a memória da aplicação.
use std::collections::HashSet;
use std::fs::{self, DirEntry, Metadata};
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::models::{
    Artifact, ArtifactRisk, Project, ScanOptions, ScanProgress, ScanResult, ScanWarning,
};

// Limites globais da primeira versão; resultados parciais incluem avisos quando são atingidos.
const MAX_DEPTH: usize = 64;
const MAX_ENTRIES: usize = 250_000;
const PROGRESS_INTERVAL: usize = 128;
const MAX_SAFE_INTEGER: u64 = 9_007_199_254_740_991;
const MAX_WARNINGS: usize = 100;

// Marcadores e artefactos suportados são mantidos em sincronia com docs/SCANNER.md.
const PROJECT_MARKERS: &[(&str, &str)] = &[
    ("package.json", "Node.js"),
    ("Cargo.toml", "Rust"),
    ("pyproject.toml", "Python"),
    ("requirements.txt", "Python"),
    ("go.mod", "Go"),
    ("composer.json", "PHP"),
    ("Gemfile", "Ruby"),
    ("pom.xml", "Java (Maven)"),
    ("build.gradle", "Java/Kotlin (Gradle)"),
    ("build.gradle.kts", "Kotlin (Gradle)"),
    ("mix.exs", "Elixir"),
    ("pubspec.yaml", "Dart/Flutter"),
    ("CMakeLists.txt", "C/C++ (CMake)"),
];

#[derive(Clone, Copy)]
struct ArtifactPattern {
    name: &'static str,
    risk: ArtifactRiskKind,
}

#[derive(Clone, Copy)]
enum ArtifactRiskKind {
    Low,
    Medium,
}

const ARTIFACT_PATTERNS: &[ArtifactPattern] = &[
    ArtifactPattern {
        name: "node_modules",
        risk: ArtifactRiskKind::Low,
    },
    ArtifactPattern {
        name: ".next",
        risk: ArtifactRiskKind::Low,
    },
    ArtifactPattern {
        name: "__pycache__",
        risk: ArtifactRiskKind::Low,
    },
    ArtifactPattern {
        name: ".venv",
        risk: ArtifactRiskKind::Low,
    },
    ArtifactPattern {
        name: "venv",
        risk: ArtifactRiskKind::Low,
    },
    ArtifactPattern {
        name: "coverage",
        risk: ArtifactRiskKind::Low,
    },
    ArtifactPattern {
        name: ".gradle",
        risk: ArtifactRiskKind::Low,
    },
    ArtifactPattern {
        name: "Pods",
        risk: ArtifactRiskKind::Low,
    },
    ArtifactPattern {
        name: "DerivedData",
        risk: ArtifactRiskKind::Low,
    },
    ArtifactPattern {
        name: "target",
        risk: ArtifactRiskKind::Medium,
    },
    ArtifactPattern {
        name: "dist",
        risk: ArtifactRiskKind::Medium,
    },
    ArtifactPattern {
        name: "build",
        risk: ArtifactRiskKind::Medium,
    },
    ArtifactPattern {
        name: "vendor",
        risk: ArtifactRiskKind::Medium,
    },
];

struct ScanContext<'a, F>
where
    F: FnMut(ScanProgress),
{
    roots: &'a [PathBuf],
    excluded: &'a [PathBuf],
    options: &'a ScanOptions,
    cancelled: &'a AtomicBool,
    emit_progress: &'a mut F,
    warnings: Vec<ScanWarning>,
    visited_directories: HashSet<PathBuf>,
    entries_seen: usize,
    limit_reached: bool,
    projects: Vec<Project>,
    completed_roots: usize,
    total_roots: usize,
}

pub fn scan<F>(
    options: ScanOptions,
    cancelled: &AtomicBool,
    mut emit_progress: F,
) -> Result<ScanResult, String>
where
    F: FnMut(ScanProgress),
{
    let mut warnings = Vec::new();
    let mut roots = normalize_roots(&options.project_directories, &mut warnings);
    let excluded = normalize_exclusions(&options.excluded_directories, &mut warnings);

    let configured_root_count = roots.len();
    roots.retain(|root| !is_excluded(root, &excluded));
    if options.project_directories.is_empty() {
        push_warning(&mut warnings, "no_scan_directories", None);
    } else if configured_root_count > 0 && roots.is_empty() {
        push_warning(&mut warnings, "all_scan_directories_excluded", None);
    }

    let mut context = ScanContext {
        roots: &roots,
        excluded: &excluded,
        options: &options,
        cancelled,
        emit_progress: &mut emit_progress,
        warnings,
        visited_directories: HashSet::new(),
        entries_seen: 0,
        limit_reached: false,
        projects: Vec::new(),
        completed_roots: 0,
        total_roots: roots.len(),
    };

    for root in &roots {
        context.check_cancelled()?;
        context.send_progress(root);
        context.walk_directory(root, 0, None)?;
        context.completed_roots += 1;
        context.send_progress(root);
        if context.limit_reached {
            break;
        }
    }

    context.check_cancelled()?;
    context
        .projects
        .sort_by(|left, right| left.path.cmp(&right.path));
    for project in &mut context.projects {
        project
            .artifacts
            .sort_by(|left, right| left.path.cmp(&right.path));
    }

    Ok(ScanResult {
        projects: context.projects,
        completed_at: format_timestamp(SystemTime::now()),
        warnings: context.warnings,
    })
}

impl<F> ScanContext<'_, F>
where
    F: FnMut(ScanProgress),
{
    fn check_cancelled(&self) -> Result<(), String> {
        if self.cancelled.load(Ordering::Relaxed) {
            Err("scan_cancelled".to_owned())
        } else {
            Ok(())
        }
    }

    fn send_progress(&mut self, path: &Path) {
        let artifact_count = self
            .projects
            .iter()
            .map(|project| project.artifacts.len())
            .sum();
        (self.emit_progress)(ScanProgress {
            current_path: display_path(path),
            projects_found: self.projects.len(),
            artifacts_found: artifact_count,
            completed: self.completed_roots,
            total: self.total_roots,
        });
    }

    fn warn(&mut self, code: &str, path: Option<&Path>) {
        push_warning(&mut self.warnings, code, path.map(display_path));
    }

    fn take_entry(&mut self, path: &Path) -> bool {
        if self.entries_seen >= MAX_ENTRIES {
            if !self.limit_reached {
                self.warn("scan_limit_reached", Some(path));
            }
            self.limit_reached = true;
            return false;
        }
        self.entries_seen += 1;
        if self.entries_seen.is_multiple_of(PROGRESS_INTERVAL) {
            self.send_progress(path);
        }
        true
    }

    fn walk_directory(
        &mut self,
        directory: &Path,
        depth: usize,
        parent_project: Option<usize>,
    ) -> Result<(), String> {
        self.check_cancelled()?;
        if depth > MAX_DEPTH {
            self.warn("max_depth_reached", Some(directory));
            return Ok(());
        }

        let canonical = match fs::canonicalize(directory) {
            Ok(path) => path,
            Err(_) => {
                self.warn("directory_unavailable", Some(directory));
                return Ok(());
            }
        };
        if is_excluded(&canonical, self.excluded)
            || !self.visited_directories.insert(canonical.clone())
        {
            return Ok(());
        }

        let remaining_entries = MAX_ENTRIES.saturating_sub(self.entries_seen);
        let (mut entries, directory_was_truncated) =
            match read_entries(&canonical, remaining_entries) {
                Ok(entries) => entries,
                Err(()) => {
                    self.warn("directory_unavailable", Some(&canonical));
                    return Ok(());
                }
            };
        entries.sort_by_key(|entry| entry.file_name());

        let technologies = detect_technologies(&entries);
        let current_project = if technologies.is_empty() {
            parent_project
        } else {
            let metadata = match fs::metadata(&canonical) {
                Ok(metadata) => metadata,
                Err(_) => {
                    self.warn("directory_unavailable", Some(&canonical));
                    return Ok(());
                }
            };
            let name = canonical
                .file_name()
                .map(|name| name.to_string_lossy().into_owned())
                .unwrap_or_else(|| display_path(&canonical));
            let path = display_path(&canonical);
            let project_id = path.clone();
            self.projects.push(Project {
                id: project_id,
                name,
                path,
                technology: technologies.join(" · "),
                last_activity: format_timestamp(metadata.modified().unwrap_or(UNIX_EPOCH)),
                artifacts: Vec::new(),
            });
            Some(self.projects.len() - 1)
        };

        for entry in entries {
            self.check_cancelled()?;
            let entry_path = entry.path();
            if !self.take_entry(&entry_path) {
                break;
            }
            let file_type = match entry.file_type() {
                Ok(file_type) => file_type,
                Err(_) => {
                    self.warn("directory_unavailable", Some(&entry_path));
                    continue;
                }
            };

            let (resolved_path, metadata) = if file_type.is_symlink() {
                if !self.options.follow_symbolic_links {
                    continue;
                }
                let resolved_path = match fs::canonicalize(&entry_path) {
                    Ok(path) => path,
                    Err(_) => {
                        self.warn("directory_unavailable", Some(&entry_path));
                        continue;
                    }
                };
                if !self.is_inside_scan_roots(&resolved_path) {
                    self.warn("symlink_outside_scan_roots", Some(&entry_path));
                    continue;
                }
                if is_excluded(&resolved_path, self.excluded) {
                    continue;
                }
                let metadata = match fs::metadata(&resolved_path) {
                    Ok(metadata) => metadata,
                    Err(_) => {
                        self.warn("directory_unavailable", Some(&entry_path));
                        continue;
                    }
                };
                (resolved_path, metadata)
            } else {
                let metadata = match entry.metadata() {
                    Ok(metadata) => metadata,
                    Err(_) => {
                        self.warn("directory_unavailable", Some(&entry_path));
                        continue;
                    }
                };
                (entry_path.clone(), metadata)
            };

            if !metadata.is_dir()
                || is_hidden_directory(&entry, &metadata, self.options.scan_hidden_directories)
            {
                continue;
            }

            let canonical_child = match fs::canonicalize(&resolved_path) {
                Ok(path) => path,
                Err(_) => {
                    self.warn("directory_unavailable", Some(&resolved_path));
                    continue;
                }
            };
            if !self.is_inside_scan_roots(&canonical_child)
                || is_excluded(&canonical_child, self.excluded)
            {
                continue;
            }

            if let Some(pattern) = artifact_pattern(entry.file_name().to_string_lossy().as_ref()) {
                if let Some(project_index) = current_project {
                    let bytes = self.measure_artifact(&canonical_child)?;
                    if bytes > MAX_SAFE_INTEGER {
                        self.warn("size_overflow", Some(&canonical_child));
                    }
                    let size_bytes = bytes.min(MAX_SAFE_INTEGER);
                    self.projects[project_index].artifacts.push(Artifact {
                        id: display_path(&canonical_child),
                        name: entry.file_name().to_string_lossy().into_owned(),
                        path: display_path(&canonical_child),
                        size_bytes,
                        reclaimable_bytes: size_bytes,
                        risk: match pattern.risk {
                            ArtifactRiskKind::Low => ArtifactRisk::Low,
                            ArtifactRiskKind::Medium => ArtifactRisk::Medium,
                        },
                    });
                }
                continue;
            }

            self.walk_directory(&canonical_child, depth + 1, current_project)?;
            if self.limit_reached {
                break;
            }
        }
        if directory_was_truncated {
            self.mark_scan_limit(&canonical);
        }
        Ok(())
    }

    fn measure_artifact(&mut self, root: &Path) -> Result<u64, String> {
        let mut pending = vec![(root.to_path_buf(), 0usize)];
        let mut visited = HashSet::new();
        let mut total = 0u64;

        while let Some((directory, depth)) = pending.pop() {
            self.check_cancelled()?;
            if depth > MAX_DEPTH {
                self.warn("max_depth_reached", Some(&directory));
                continue;
            }
            let canonical = match fs::canonicalize(&directory) {
                Ok(path) => path,
                Err(_) => {
                    self.warn("directory_unavailable", Some(&directory));
                    continue;
                }
            };
            if !self.is_inside_scan_roots(&canonical)
                || is_excluded(&canonical, self.excluded)
                || !visited.insert(canonical.clone())
            {
                continue;
            }
            let remaining_entries = MAX_ENTRIES.saturating_sub(self.entries_seen);
            let (entries, directory_was_truncated) =
                match read_entries(&canonical, remaining_entries) {
                    Ok(entries) => entries,
                    Err(()) => {
                        self.warn("directory_unavailable", Some(&canonical));
                        continue;
                    }
                };
            for entry in entries {
                self.check_cancelled()?;
                let path = entry.path();
                if !self.take_entry(&path) {
                    break;
                }
                let file_type = match entry.file_type() {
                    Ok(file_type) => file_type,
                    Err(_) => {
                        self.warn("directory_unavailable", Some(&path));
                        continue;
                    }
                };
                let (resolved_path, metadata) = if file_type.is_symlink() {
                    if !self.options.follow_symbolic_links {
                        continue;
                    }
                    let resolved_path = match fs::canonicalize(&path) {
                        Ok(path) => path,
                        Err(_) => {
                            self.warn("directory_unavailable", Some(&path));
                            continue;
                        }
                    };
                    if !self.is_inside_scan_roots(&resolved_path) {
                        self.warn("symlink_outside_scan_roots", Some(&path));
                        continue;
                    }
                    if is_excluded(&resolved_path, self.excluded) {
                        continue;
                    }
                    let metadata = match fs::metadata(&resolved_path) {
                        Ok(metadata) => metadata,
                        Err(_) => {
                            self.warn("directory_unavailable", Some(&path));
                            continue;
                        }
                    };
                    (resolved_path, metadata)
                } else {
                    let metadata = match entry.metadata() {
                        Ok(metadata) => metadata,
                        Err(_) => {
                            self.warn("directory_unavailable", Some(&path));
                            continue;
                        }
                    };
                    (path, metadata)
                };

                if metadata.is_dir() {
                    if is_hidden_directory(&entry, &metadata, self.options.scan_hidden_directories)
                    {
                        continue;
                    }
                    pending.push((resolved_path, depth + 1));
                } else if metadata.is_file() {
                    total = total.saturating_add(metadata.len());
                }
            }
            if directory_was_truncated {
                self.mark_scan_limit(&canonical);
            }
            if self.limit_reached {
                break;
            }
        }
        Ok(total)
    }

    fn is_inside_scan_roots(&self, path: &Path) -> bool {
        self.roots.iter().any(|root| path_is_within(path, root))
    }

    fn mark_scan_limit(&mut self, path: &Path) {
        if !self.limit_reached {
            self.warn("scan_limit_reached", Some(path));
        }
        self.limit_reached = true;
    }
}

fn normalize_roots(input: &[String], warnings: &mut Vec<ScanWarning>) -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = Vec::new();
    for value in input {
        let Some(path) = expand_home(value) else {
            push_warning(warnings, "invalid_scan_directory", Some(value.clone()));
            continue;
        };
        if !path.is_absolute() {
            push_warning(warnings, "invalid_scan_directory", Some(value.clone()));
            continue;
        }
        let canonical = match fs::canonicalize(&path) {
            Ok(path) if path.is_dir() => path,
            _ => {
                push_warning(warnings, "invalid_scan_directory", Some(value.clone()));
                continue;
            }
        };
        if !roots.iter().any(|root| path_is_within(&canonical, root)) {
            roots.push(canonical);
        }
    }
    roots
}

fn normalize_exclusions(input: &[String], warnings: &mut Vec<ScanWarning>) -> Vec<PathBuf> {
    let mut excluded: Vec<PathBuf> = Vec::new();
    for value in input {
        let Some(path) = expand_home(value) else {
            push_warning(warnings, "invalid_excluded_directory", Some(value.clone()));
            continue;
        };
        if !path.is_absolute() {
            push_warning(warnings, "invalid_excluded_directory", Some(value.clone()));
            continue;
        }
        let normalized = fs::canonicalize(&path).unwrap_or_else(|_| normalize_lexically(&path));
        if !excluded
            .iter()
            .any(|existing| path_is_within(&normalized, existing))
        {
            excluded.push(normalized);
        }
    }
    excluded
}

fn expand_home(value: &str) -> Option<PathBuf> {
    let value = value.trim();
    if value == "~" || value.starts_with("~/") || value.starts_with("~\\") {
        let home = home_directory()?;
        if value == "~" {
            return Some(home);
        }
        return Some(home.join(&value[2..]));
    }
    if value.starts_with('~') {
        return None;
    }
    Some(PathBuf::from(value))
}

fn home_directory() -> Option<PathBuf> {
    #[cfg(windows)]
    let home = std::env::var_os("USERPROFILE");
    #[cfg(not(windows))]
    let home = std::env::var_os("HOME");
    home.map(PathBuf::from)
}

fn normalize_lexically(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            Component::Prefix(prefix) => normalized.push(prefix.as_os_str()),
            Component::RootDir => normalized.push(component.as_os_str()),
            Component::CurDir => {}
            Component::ParentDir => {
                normalized.pop();
            }
            Component::Normal(part) => normalized.push(part),
        }
    }
    normalized
}

fn is_excluded(path: &Path, excluded: &[PathBuf]) -> bool {
    excluded
        .iter()
        .any(|excluded_path| path_is_within(path, excluded_path))
}

fn path_is_within(path: &Path, root: &Path) -> bool {
    #[cfg(windows)]
    {
        let path = path.to_string_lossy().replace('/', "\\").to_lowercase();
        let root = root.to_string_lossy().replace('/', "\\").to_lowercase();
        path == root
            || path
                .strip_prefix(&root)
                .is_some_and(|remainder| remainder.starts_with('\\'))
    }
    #[cfg(not(windows))]
    {
        path == root || path.starts_with(root)
    }
}

fn read_entries(path: &Path, limit: usize) -> Result<(Vec<DirEntry>, bool), ()> {
    let mut entries = Vec::new();
    let mut iterator = fs::read_dir(path).map_err(|_| ())?;
    loop {
        let Some(entry) = iterator.next() else {
            return Ok((entries, false));
        };
        if entries.len() == limit {
            return Ok((entries, true));
        }
        entries.push(entry.map_err(|_| ())?);
    }
}

fn detect_technologies(entries: &[DirEntry]) -> Vec<String> {
    let mut technologies: Vec<String> = Vec::new();
    for entry in entries {
        if !entry.file_type().is_ok_and(|file_type| file_type.is_file()) {
            continue;
        }
        let name = entry.file_name().to_string_lossy().into_owned();
        let technology = PROJECT_MARKERS
            .iter()
            .find(|(marker, _)| names_equal(&name, marker))
            .map(|(_, technology)| *technology)
            .or_else(|| {
                let lower = name.to_lowercase();
                if lower.ends_with(".csproj") || lower.ends_with(".sln") {
                    Some("C#/.NET")
                } else {
                    None
                }
            });
        if let Some(technology) = technology
            && !technologies.iter().any(|item| item == technology)
        {
            technologies.push(technology.to_owned());
        }
    }
    technologies.sort_unstable();
    technologies
}

fn artifact_pattern(name: &str) -> Option<ArtifactPattern> {
    ARTIFACT_PATTERNS
        .iter()
        .find(|pattern| names_equal(name, pattern.name))
        .copied()
}

fn names_equal(left: &str, right: &str) -> bool {
    #[cfg(windows)]
    {
        left.eq_ignore_ascii_case(right)
    }
    #[cfg(not(windows))]
    {
        left == right
    }
}

fn is_hidden_directory(entry: &DirEntry, metadata: &Metadata, include_hidden: bool) -> bool {
    if include_hidden {
        return false;
    }
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;
        let _ = entry;
        metadata.file_attributes() & FILE_ATTRIBUTE_HIDDEN != 0
    }
    #[cfg(not(windows))]
    {
        let _ = metadata;
        entry.file_name().to_string_lossy().starts_with('.')
    }
}

fn push_warning(warnings: &mut Vec<ScanWarning>, code: &str, path: Option<String>) {
    if warnings
        .iter()
        .any(|warning| warning.code == code && warning.path == path)
    {
        return;
    }
    if warnings.len() >= MAX_WARNINGS {
        if !warnings
            .iter()
            .any(|warning| warning.code == "warnings_truncated")
        {
            warnings.push(ScanWarning {
                code: "warnings_truncated".to_owned(),
                path: None,
            });
        }
        return;
    }
    warnings.push(ScanWarning {
        code: code.to_owned(),
        path,
    });
}

fn display_path(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn format_timestamp(time: SystemTime) -> String {
    let seconds = time
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    let days = seconds.div_euclid(86_400);
    let day_seconds = seconds.rem_euclid(86_400);
    let shifted_days = days + 719_468;
    let era = if shifted_days >= 0 {
        shifted_days
    } else {
        shifted_days - 146_096
    } / 146_097;
    let day_of_era = shifted_days - era * 146_097;
    let year_of_era =
        (day_of_era - day_of_era / 1_460 + day_of_era / 36_524 - day_of_era / 146_096) / 365;
    let mut year = year_of_era + era * 400;
    let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let month_prime = (5 * day_of_year + 2) / 153;
    let day = day_of_year - (153 * month_prime + 2) / 5 + 1;
    let month = month_prime + if month_prime < 10 { 3 } else { -9 };
    year += if month <= 2 { 1 } else { 0 };
    let hour = day_seconds / 3_600;
    let minute = day_seconds % 3_600 / 60;
    let second = day_seconds % 60;
    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}Z")
}
