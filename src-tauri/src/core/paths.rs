//! Utilitários de caminho partilhados pelo scanner e pela limpeza.
//! Todas as comparações usam componentes de caminho e nunca prefixos textuais.
use std::path::{Component, Path, PathBuf};

/// Expande `~` e `~/...` para o directório pessoal da conta actual.
pub(crate) fn expand_home(value: &str) -> Option<PathBuf> {
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

pub(crate) fn home_directory() -> Option<PathBuf> {
    #[cfg(windows)]
    let home = std::env::var_os("USERPROFILE");
    #[cfg(not(windows))]
    let home = std::env::var_os("HOME");
    home.map(PathBuf::from)
}

/// Remove `.` e resolve `..` sem tocar no disco.
pub(crate) fn normalize_lexically(path: &Path) -> PathBuf {
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

/// Verifica se `path` é `root` ou um descendente, comparando por componentes.
pub(crate) fn path_is_within(path: &Path, root: &Path) -> bool {
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

pub(crate) fn is_excluded(path: &Path, excluded: &[PathBuf]) -> bool {
    excluded
        .iter()
        .any(|excluded_path| path_is_within(path, excluded_path))
}

/// Igualdade de nomes de ficheiro: insensível a maiúsculas apenas em Windows.
pub(crate) fn names_equal(left: &str, right: &str) -> bool {
    #[cfg(windows)]
    {
        left.eq_ignore_ascii_case(right)
    }
    #[cfg(not(windows))]
    {
        left == right
    }
}

pub(crate) fn display_path(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}
