mod captions;
mod commands;
mod export;
mod tools;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::media::probe_media,
            commands::media::dev_startup_media,
            commands::projects::autosave_project,
            commands::projects::save_project_as,
            commands::projects::open_project,
            commands::projects::open_autosaved_project,
            commands::projects::delete_autosaved_project,
            commands::projects::list_projects,
            commands::thumbnails::media_filmstrip,
            commands::waveform::media_waveform,
            commands::export::detect_encoders,
            commands::export::start_export,
            commands::export::cancel_export,
            commands::captions::caption_models,
            commands::captions::download_caption_model,
            commands::captions::cancel_caption_download,
            commands::captions::transcribe,
            commands::captions::cancel_transcription,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Verso");
}
