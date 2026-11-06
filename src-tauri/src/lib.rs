mod captions;
mod commands;
mod tools;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::media::probe_media,
            commands::thumbnails::media_filmstrip,
            commands::captions::caption_models,
            commands::captions::download_caption_model,
            commands::captions::cancel_caption_download,
            commands::captions::transcribe,
            commands::captions::cancel_transcription,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Verso");
}
