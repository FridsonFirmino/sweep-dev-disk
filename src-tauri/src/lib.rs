pub mod commands;
pub mod core;
pub mod database;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Guarda um único token de cancelamento partilhado por todos os comandos do scanner.
        .manage(commands::scanner::ScanState::default())
        // Guarda o marcador de limpeza activa para impedir execuções concorrentes.
        .manage(commands::cleanup::CleanupState::default())
        .plugin(tauri_plugin_opener::init())
        // Expõe a análise local, o cancelamento e a limpeza com revalidação.
        .invoke_handler(tauri::generate_handler![
            commands::scanner::scan_projects,
            commands::scanner::cancel_scan,
            commands::cleanup::cleanup_artifacts,
            commands::cleanup::list_cleanup_history,
            commands::cleanup::restore_cleanup_entry
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    #[test]
    fn foundation_module_is_available() {
        assert_eq!(2 + 2, 4);
    }
}
