use zed_extension_api as zed;

struct AyatsumugiExtension;

impl zed::Extension for AyatsumugiExtension {
    fn new() -> Self {
        Self
    }

    fn context_server_command(
        &mut self,
        _context_server_id: &zed::ContextServerId,
        project: &zed::Project,
    ) -> zed::Result<zed::Command> {
        let command = project
            .which("ayatsumugi-mcp")
            .ok_or_else(|| "ayatsumugi-mcp was not found in PATH".to_string())?;
        Ok(zed::Command {
            command,
            args: vec!["serve".to_string(), "--stdio".to_string()],
            env: Vec::new(),
        })
    }
}

zed::register_extension!(AyatsumugiExtension);

