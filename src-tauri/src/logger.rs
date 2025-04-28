use log::LevelFilter;
use log4rs::append::rolling_file::policy::compound::roll::delete::DeleteRoller;
use log4rs::append::rolling_file::policy::compound::trigger::size::SizeTrigger;
use log4rs::append::rolling_file::policy::compound::CompoundPolicy;
use log4rs::config::{Appender, Config, Root};
use log4rs::encode::pattern::PatternEncoder;

pub fn init_logger(log_path: &str, verbose: bool) {
    let filter = match verbose {
        true => LevelFilter::Trace,
        false => LevelFilter::Warn,
    };

    const TRIGGER_FILE_SIZE: u64 = 100 * 1024;

    let trigger = SizeTrigger::new(TRIGGER_FILE_SIZE);

    let roller = DeleteRoller::new();

    let policy = CompoundPolicy::new(Box::new(trigger), Box::new(roller));

    // Logging to log file. (with rolling)
    let logfile = log4rs::append::rolling_file::RollingFileAppender::builder()
        // Pattern: https://docs.rs/log4rs/*/log4rs/encode/pattern/index.html
        .encoder(Box::new(PatternEncoder::new("{d} {l} {t} - {m}{n}\n")))
        .build(log_path, Box::new(policy))
        .unwrap();

    // Log Trace level output to file where trace is the default level
    // and the programmatically specified level to stderr.
    let config = Config::builder()
        .appender(Appender::builder().build("logfile", Box::new(logfile)))
        .build(Root::builder().appender("logfile").build(filter))
        .unwrap();

    match log4rs::init_config(config) {
        Ok(_) => {
            log::info!("Logger initialized");
        }
        Err(e) => {
            println!("Failed to initialize logger: {}", e);
        }
    }
}
