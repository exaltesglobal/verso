mod captions;
mod analysis;
mod account;
mod commands;
mod crash;
mod export;
// Colour/speed/still export helpers. Move to `pub mod color;` in export/mod.rs when wiring export.
#[allow(dead_code)]
#[path = "export/color.rs"]
mod export_color;
mod reframe;
mod tools;
mod updates;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .max_file_size(5_000_000)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepOne)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(account::AccountState::default())
        .setup(|app| {
            crash::init(app.handle());
            Ok(())
        })
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
            commands::reframe::reframe_models,
            commands::reframe::download_reframe_model,
            commands::reframe::analyze_reframe,
            commands::reframe::plan_crop,
            commands::analysis::detect_silences,
            commands::analysis::detect_emphasis,
            commands::analysis::detect_beats,
            account::start_sign_in,
            account::sign_out,
            account::get_session,
            account::fetch_entitlements,
            account::get_entitlements,
            account::list_devices,
            crash::report_frontend_error,
            crash::pending_crash_reports,
            crash::send_crash_reports,
            crash::discard_crash_reports,
            updates::check_for_update,
            updates::install_update,
            commands::enhance::enhance_audio,
            commands::color::auto_color,
            commands::color::render_still,
            commands::color::import_lut,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Verso");
}
