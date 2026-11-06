mod commands;
mod reframe;
mod tools;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::media::probe_media,
            commands::thumbnails::media_filmstrip,
            commands::reframe::reframe_models,
            commands::reframe::download_reframe_model,
            commands::reframe::analyze_reframe,
            commands::reframe::plan_crop,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Verso");
}
