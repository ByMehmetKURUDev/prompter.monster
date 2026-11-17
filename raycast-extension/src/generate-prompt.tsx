import { useEffect, useState } from "react";
import { Action, ActionPanel, Detail, Form, Icon, Toast, getPreferenceValues, showToast, useNavigation } from "@raycast/api";
import { FORMATS, Format, GenerateResult, ProjectType, Preferences, generatePrompt, listProjectTypes, PromptMonsterError } from "./lib/api";

interface FormValues {
  name: string;
  pitch: string;
  description: string;
  projectType: string;
  format: string;
  lang: string;
}

export default function GeneratePromptCommand() {
  const prefs = getPreferenceValues<Preferences>();
  const { push } = useNavigation();
  const [types, setTypes] = useState<ProjectType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listProjectTypes(prefs.lang ?? "EN")
      .then(setTypes)
      // Non-fatal: the form still works fine with the project-type dropdown left on "None".
      .catch(() => setTypes([]))
      .finally(() => setTypesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(values: FormValues) {
    if (!values.name.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Project name is required" });
      return;
    }
    setSubmitting(true);
    const toast = await showToast({ style: Toast.Style.Animated, title: "Generating…" });
    try {
      const result = await generatePrompt({
        name: values.name.trim(),
        pitch: values.pitch.trim() || undefined,
        description: values.description.trim() || undefined,
        projectType: values.projectType || undefined,
        format: (values.format as Format) || undefined,
        lang: (values.lang as "EN" | "TR") || undefined,
      });
      await toast.hide();
      push(<PromptResult result={result} />);
    } catch (e) {
      toast.style = Toast.Style.Failure;
      toast.title = "Generation failed";
      toast.message = e instanceof PromptMonsterError ? e.message : "Could not reach prompter.monster.";
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form
      isLoading={typesLoading || submitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Generate Build Prompt" icon={Icon.Wand} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Turns a product idea into a master build prompt for Claude, Cursor, v0, Lovable and more — the same engine as prompter.monster/studio. Free, deterministic, no AI credits used." />
      <Form.TextField id="name" title="Project name" placeholder="StudioFlow" autoFocus />
      <Form.TextField id="pitch" title="One-line pitch" placeholder="A visual workflow builder for freelance studios" />
      <Form.TextArea id="description" title="Description" placeholder="Who it's for, the core features, anything a builder needs to know…" />
      <Form.Dropdown id="projectType" title="Project type" defaultValue="" info="Optional — fills in a recommended stack, experts and features for this kind of project.">
        <Form.Dropdown.Item value="" title="— None / custom —" />
        {types.map((t) => (
          <Form.Dropdown.Item key={t.id} value={t.id} title={t.name} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown id="format" title="Output format" defaultValue="Claude XML">
        {FORMATS.map((f) => (
          <Form.Dropdown.Item key={f} value={f} title={f} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown id="lang" title="Language" defaultValue={prefs.lang ?? "EN"}>
        <Form.Dropdown.Item value="EN" title="English" />
        <Form.Dropdown.Item value="TR" title="Türkçe" />
      </Form.Dropdown>
      <Form.Description
        text={
          prefs.apiKey?.trim()
            ? "Using your Monster Pro API key."
            : "No API key set — Free plan limits apply (3 experts, ChatGPT Markdown / Claude XML only). Add a pm_live_… key in this extension's preferences for Monster Pro."
        }
      />
    </Form>
  );
}

function PromptResult({ result }: { result: GenerateResult }) {
  const markdown = `# ${result.name}\n\n${result.header}\n\n---\n\n${result.megaPrompt ?? "_No prompt was returned._"}`;
  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Project type" text={result.projectTypeName} />
          <Detail.Metadata.Label title="Format" text={result.format} />
          <Detail.Metadata.Label title="Plan" text={result.plan === "pro" ? "Monster Pro" : "Free"} />
          <Detail.Metadata.TagList title="Experts">
            {result.experts.map((e) => (
              <Detail.Metadata.TagList.Item key={e} text={e} />
            ))}
          </Detail.Metadata.TagList>
          {result.notes.length > 0 && (
            <>
              <Detail.Metadata.Separator />
              {result.notes.map((n, i) => (
                <Detail.Metadata.Label key={i} title="Note" text={n} />
              ))}
            </>
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Prompt" content={result.megaPrompt ?? ""} icon={Icon.Clipboard} />
          <Action.Paste title="Paste Prompt" content={result.megaPrompt ?? ""} icon={Icon.Text} />
          <Action.OpenInBrowser title="Open in Studio" url={result.studioUrl} icon={Icon.Globe} />
        </ActionPanel>
      }
    />
  );
}
