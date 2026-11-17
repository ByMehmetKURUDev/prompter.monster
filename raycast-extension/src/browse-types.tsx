import { useEffect, useState } from "react";
import { Action, ActionPanel, Icon, List, Toast, getPreferenceValues, showToast } from "@raycast/api";
import { Preferences, ProjectType, listProjectTypes } from "./lib/api";

export default function BrowseTypesCommand() {
  const prefs = getPreferenceValues<Preferences>();
  const [types, setTypes] = useState<ProjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listProjectTypes(prefs.lang ?? "EN")
      .then(setTypes)
      .catch((e) => showToast({ style: Toast.Style.Failure, title: "Couldn't load project types", message: String(e) }))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = Array.from(new Set(types.map((t) => t.category)));

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search project types…">
      {categories.map((category) => (
        <List.Section key={category} title={category}>
          {types
            .filter((t) => t.category === category)
            .map((t) => (
              <List.Item
                key={t.id}
                title={t.name}
                subtitle={t.description}
                accessories={t.badge ? [{ tag: t.badge }] : undefined}
                actions={
                  <ActionPanel>
                    <Action.CopyToClipboard title="Copy Type ID" content={t.id} icon={Icon.CopyClipboard} />
                    {t.url && <Action.OpenInBrowser title="Open Page" url={t.url} icon={Icon.Globe} />}
                  </ActionPanel>
                }
              />
            ))}
        </List.Section>
      ))}
    </List>
  );
}
