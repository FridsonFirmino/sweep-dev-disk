pub mod commands;
pub mod core;
pub mod database;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Guarda um único token de cancelamento partilhado por todos os comandos do scanner.
        .manage(commands::scanner::ScanState::default())
        .plugin(tauri_plugin_opener::init())
        // Só expõe a análise local e o cancelamento; a limpeza permanece indisponível.
        .invoke_handler(tauri::generate_handler![
            commands::scanner::scan_projects,
            commands::scanner::cancel_scan
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
