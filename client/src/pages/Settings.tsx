import { useEffect, useState } from "react";
import { api, type Settings as SettingsType } from "../api/client";
import { formatDateTime } from "../utils/dates";

export function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        setSettings(s);
        setPrompt(s.system_prompt);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await api.updateSettings(prompt);
      setSettings(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (error && !settings) return <p className="error">Failed to load settings: {error}</p>;
  if (!settings) return <p>Loading settings...</p>;

  const dirty = prompt !== settings.system_prompt;

  return (
    <div>
      <h1>Settings</h1>
      <p className="settings-hint">
        This is the advisor's system prompt — its instructions for how to behave. Changes take effect on the very
        next message, in every conversation, with no restart needed.
      </p>

      <textarea
        className="settings-prompt"
        rows={16}
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
          setSaved(false);
        }}
      />

      <div className="settings-actions">
        <button onClick={handleSave} disabled={saving || !prompt.trim() || !dirty}>
          {saving ? "Saving..." : "Save"}
        </button>
        {dirty && !saving && <span className="settings-status">Unsaved changes</span>}
        {saved && !dirty && <span className="settings-status settings-saved">Saved</span>}
      </div>

      {error && <p className="error">{error}</p>}

      <p className="settings-meta">Last updated {formatDateTime(settings.updated_at)}</p>
    </div>
  );
}
