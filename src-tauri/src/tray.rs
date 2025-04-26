use std::sync::atomic::AtomicBool;

use tauri::{
    menu::{Menu, MenuEvent, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle,
};

use crate::{commands, utils::write_app_data_to_storage};

pub static EXIT_FLAG: AtomicBool = AtomicBool::new(false);

pub fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let open_i = MenuItem::with_id(app, "open", "Open PcPocket", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open_i, &quit_i])?;
    let _ = TrayIconBuilder::with_id("tray")
        .tooltip("PcPocket")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app: &AppHandle, event: MenuEvent| {
            if event.id.as_ref() == "quit" {
                write_app_data_to_storage(app).unwrap();
                EXIT_FLAG.store(true, std::sync::atomic::Ordering::Relaxed);
                app.exit(0);
            }
            if event.id.as_ref() == "open" {
                commands::open_main_window(app);
            }
        })
        .on_tray_icon_event(move |tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                // focus the main window
                commands::open_main_window(tray.app_handle());
            }
        })
        .build(app);

    Ok(())
}
