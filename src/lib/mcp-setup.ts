/**
 * Client-safe setup snippets for the MCP server and the REST API (account page + /developers).
 * `key` is the user's freshly created key, or a placeholder.
 */
export const MCP_URL = "https://prompter.monster/api/mcp";
export const API_BASE = "https://prompter.monster/api/v1";
export const OPENAPI_URL = `${API_BASE}/openapi.json`;
export const KEY_PLACEHOLDER = "pm_live_YOUR_KEY";

export interface SetupSnippet {
  id: string;
  label: string;
  /** Where the snippet goes (a file path or "terminal"). */
  where: { tr: string; en: string };
  code: string;
  note?: { tr: string; en: string };
}

export function setupSnippets(key: string = KEY_PLACEHOLDER): SetupSnippet[] {
  const auth = `Bearer ${key}`;
  return [
    {
      id: "claude-code",
      label: "Claude Code",
      where: { tr: "Terminal", en: "Terminal" },
      code: `claude mcp add --transport http prompt-monster ${MCP_URL} \\\n  --header "Authorization: ${auth}"`,
      note: {
        tr: "Tüm projelerinde kullanmak için sona --scope user ekle. Sonra Claude Code'da /mcp ile bağlantıyı gör; /mcp__prompt-monster__new_project komutu fikirden prompt üretir.",
        en: "Add --scope user to use it in every project. Check the connection with /mcp; the /mcp__prompt-monster__new_project command turns an idea into a prompt.",
      },
    },
    {
      id: "cursor",
      label: "Cursor",
      where: { tr: "~/.cursor/mcp.json (veya projede .cursor/mcp.json)", en: "~/.cursor/mcp.json (or .cursor/mcp.json in a project)" },
      code: JSON.stringify({ mcpServers: { "prompt-monster": { url: MCP_URL, headers: { Authorization: auth } } } }, null, 2),
    },
    {
      id: "vscode",
      label: "VS Code",
      where: { tr: ".vscode/mcp.json — anahtarı VS Code güvenle sorar", en: ".vscode/mcp.json — VS Code asks for the key securely" },
      code: JSON.stringify(
        {
          inputs: [{ type: "promptString", id: "pm-key", description: "Prompt.Monster API key", password: true }],
          servers: { "prompt-monster": { type: "http", url: MCP_URL, headers: { Authorization: "Bearer ${input:pm-key}" } } },
        },
        null,
        2,
      ),
    },
    {
      id: "windsurf",
      label: "Windsurf",
      where: { tr: "~/.codeium/windsurf/mcp_config.json", en: "~/.codeium/windsurf/mcp_config.json" },
      code: JSON.stringify({ mcpServers: { "prompt-monster": { serverUrl: MCP_URL, headers: { Authorization: auth } } } }, null, 2),
    },
    {
      id: "claude-desktop",
      label: "Claude Desktop",
      where: { tr: "claude_desktop_config.json (Ayarlar → Geliştirici → Yapılandırmayı düzenle)", en: "claude_desktop_config.json (Settings → Developer → Edit config)" },
      code: JSON.stringify(
        {
          mcpServers: {
            "prompt-monster": {
              command: "npx",
              args: ["-y", "mcp-remote", MCP_URL, "--header", "Authorization:${PM_AUTH}"],
              env: { PM_AUTH: auth },
            },
          },
        },
        null,
        2,
      ),
      note: {
        tr: "Anahtarsız (Free) kullanım için: Ayarlar → Connectors → Özel bağlayıcı ekle → URL olarak MCP adresini yapıştır.",
        en: "Keyless (Free) option: Settings → Connectors → Add custom connector → paste the MCP URL.",
      },
    },
    {
      id: "curl",
      label: "REST · curl",
      where: { tr: "Terminal", en: "Terminal" },
      code: [
        `curl -X POST ${API_BASE}/generate \\`,
        `  -H "Authorization: ${auth}" \\`,
        `  -H "Content-Type: application/json" \\`,
        `  -d '{"name":"InvoiceFox","pitch":"AI invoicing for freelancers","projectType":"invoice","features":["Invoice builder","Recurring invoices","Stripe payouts","Client portal","Late-payment reminders"],"lang":"EN","output":"mega"}'`,
      ].join("\n"),
    },
    {
      id: "chatgpt",
      label: "ChatGPT (GPT Actions)",
      where: { tr: "GPT oluştur → Yapılandır → Eylemler", en: "Create a GPT → Configure → Actions" },
      code: `Import from URL: ${OPENAPI_URL}\nAuthentication: API Key → Auth type: Bearer\nAPI key: ${key}`,
    },
  ];
}
