use zed_extension_api as zed;

struct AyatsumugiExtension;

impl zed::Extension for AyatsumugiExtension {
    fn new() -> Self {
        Self
    }

    fn context_server_command(
        &mut self,
        _context_server_id: &zed::ContextServerId,
        _project: &zed::Project,
    ) -> zed::Result<zed::Command> {
        Ok(zed::Command {
            command: "ayatsumugi-mcp".to_string(),
            args: vec!["serve".to_string(), "--stdio".to_string()],
            env: Vec::new(),
        })
    }
}

zed::register_extension!(AyatsumugiExtension);
