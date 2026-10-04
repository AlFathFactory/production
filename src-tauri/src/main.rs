#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    production_control_lib::run();
}
