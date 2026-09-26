"use client";

import { Eye, EyeOff, Pencil, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CatalogKind, CatalogRow } from "@/lib/catalog";
import { cx } from "@/lib/cx";
import type { TypePreset } from "@/lib/type-presets";
import type { Expert, ProjectType } from "@/lib/types";

type TypeInfo = { type: ProjectType; category: string; preset?: TypePreset; stack?: string[] };
type Options = { categories: string[]; payments: { id: string; name: string }[]; monetization: string[]; compliance: string[]; features: string[]; stack: string[] };

type ExpertDraft = { id: string; emoji: string; role: string; org: string; spec: string; years: number; color: string; task: string; taskEn: string; sort: number };
type TypeDraft = {
  id: string;
  name: string;
  icon: string;
  badge: "" | "NEW" | "HOT";
  category: string;
  descTr: string;
  descEn: string;
  experts: string[];
  features: string[];
  stack: string[];
  payments: string[];
  monetization: string[];
  compliance: string[];
  sort: number;
};
type Editing = { kind: "expert"; isNew: boolean; builtin: boolean; draft: ExpertDraft } | { kind: "project_type"; isNew: boolean; builtin: boolean; draft: TypeDraft };

const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const arr = (v: unknown, d: string[] = []) => (Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : d);
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export function CatalogAdmin({ rows, builtinExperts, builtinTypes, options }: { rows: CatalogRow[]; builtinExperts: Expert[]; builtinTypes: TypeInfo[]; options: Options }) {
  const router = useRouter();
  const [tab, setTab] = useState<CatalogKind>("expert");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const rowOf = (kind: CatalogKind, id: string) => rows.find((r) => r.kind === kind && r.id === id);

  /* ───── merged views ───── */
  const experts = useMemo(() => {
    const list = builtinExperts.map((b) => {
      const r = rows.find((x) => x.kind === "expert" && x.id === b.id);
      const d = (r?.data ?? {}) as Record<string, unknown>;
      return {
        id: b.id,
        builtin: true,
        row: r,
        enabled: r ? r.enabled : true,
        view: {
          ...b,
          emoji: str(d.emoji, b.emoji),
          role: str(d.role, b.role),
          org: str(d.org, b.org),
          spec: str(d.spec, b.spec),
          years: typeof d.years === "number" ? d.years : b.years,
          color: str(d.color, b.color),
          task: str(d.task, b.task),
          taskEn: str(d.taskEn, b.taskEn ?? ""),
        },
      };
    });
    for (const r of rows.filter((x) => x.kind === "expert" && !builtinExperts.some((b) => b.id === x.id))) {
      const d = r.data as Record<string, unknown>;
      list.push({
        id: r.id,
        builtin: false,
        row: r,
        enabled: r.enabled,
        view: { id: r.id, emoji: str(d.emoji, "🧠"), role: str(d.role, r.id), org: str(d.org), spec: str(d.spec), years: typeof d.years === "number" ? d.years : 8, color: str(d.color, "#A3FF12"), task: str(d.task), taskEn: str(d.taskEn) },
      });
    }
    return list;
  }, [rows, builtinExperts]);

  const types = useMemo(() => {
    const list = builtinTypes.map((b) => {
      const r = rows.find((x) => x.kind === "project_type" && x.id === b.type.id);
      const d = (r?.data ?? {}) as Record<string, unknown>;
      const desc = (d.description ?? {}) as { tr?: string; en?: string };
      return {
        id: b.type.id,
        builtin: true,
        row: r,
        enabled: r ? r.enabled : true,
        view: {
          name: str(d.name, b.type.name),
          icon: str(d.icon, b.type.icon),
          badge: (str(d.badge, b.type.badge) || "") as TypeDraft["badge"],
          category: str(d.category, b.category),
          descTr: desc.tr ?? "",
          descEn: desc.en ?? "",
          experts: arr(d.experts, b.preset?.experts ?? []),
          features: arr(d.features, b.preset?.features ?? []),
          stack: arr(d.stack, b.stack ?? []),
          payments: arr(d.payments, b.preset?.payments ?? []),
          monetization: arr(d.monetization, b.preset?.monetization ?? []),
          compliance: arr(d.compliance, b.preset?.compliance ?? []),
        },
      };
    });
    for (const r of rows.filter((x) => x.kind === "project_type" && !builtinTypes.some((b) => b.type.id === x.id))) {
      const d = r.data as Record<string, unknown>;
      const desc = (d.description ?? {}) as { tr?: string; en?: string };
      list.push({
        id: r.id,
        builtin: false,
        row: r,
        enabled: r.enabled,
        view: {
          name: str(d.name, r.id),
          icon: str(d.icon, "✨"),
          badge: (str(d.badge, "NEW") || "") as TypeDraft["badge"],
          category: str(d.category, "✨ CUSTOM"),
          descTr: desc.tr ?? "",
          descEn: desc.en ?? "",
          experts: arr(d.experts),
          features: arr(d.features),
          stack: arr(d.stack),
          payments: arr(d.payments),
          monetization: arr(d.monetization),
          compliance: arr(d.compliance),
        },
      });
    }
    return list;
  }, [rows, builtinTypes]);

  const categories = useMemo(() => [...new Set([...options.categories, ...types.map((t) => t.view.category)])], [options.categories, types]);
  const expertChoices = experts.filter((e) => e.enabled).map((e) => ({ id: e.id, label: `${e.view.emoji} ${e.view.role}` }));

  /* ───── API calls ───── */
  async function put(kind: CatalogKind, id: string, data: Record<string, unknown>, enabled: boolean, sort = 0, okText = "Kaydedildi.") {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/catalog", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, id, data, enabled, sort }) });
      const j = (await r.json().catch(() => ({}))) as { message?: string };
      if (!r.ok) throw new Error(j.message || `HTTP ${r.status}`);
      setMsg({ ok: true, text: okText });
      setEditing(null);
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Kaydedilemedi" });
    } finally {
      setBusy(false);
    }
  }

  async function del(kind: CatalogKind, id: string, okText: string) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/catalog?kind=${kind}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const j = (await r.json().catch(() => ({}))) as { message?: string };
      if (!r.ok) throw new Error(j.message || `HTTP ${r.status}`);
      setMsg({ ok: true, text: okText });
      setConfirmDelete(null);
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  }

  /* ───── editor open / save ───── */
  function editExpert(id: string | null) {
    const e = id ? experts.find((x) => x.id === id) : null;
    const v = e?.view;
    setEditing({
      kind: "expert",
      isNew: !e,
      builtin: Boolean(e?.builtin),
      draft: {
        id: e?.id ?? "",
        emoji: v?.emoji ?? "🧠",
        role: v?.role ?? "",
        org: v?.org ?? "",
        spec: v?.spec ?? "",
        years: v?.years ?? 8,
        color: v?.color ?? "#A3FF12",
        task: v?.task ?? "",
        taskEn: v?.taskEn ?? "",
        sort: e?.row?.sort ?? 0,
      },
    });
    setMsg(null);
  }

  function editType(id: string | null) {
    const t = id ? types.find((x) => x.id === id) : null;
    const v = t?.view;
    setEditing({
      kind: "project_type",
      isNew: !t,
      builtin: Boolean(t?.builtin),
      draft: {
        id: t?.id ?? "",
        name: v?.name ?? "",
        icon: v?.icon ?? "✨",
        badge: v?.badge ?? "NEW",
        category: v?.category ?? options.categories[0] ?? "🚀 STARTUP",
        descTr: v?.descTr ?? "",
        descEn: v?.descEn ?? "",
        experts: v?.experts ?? ["cto", "pm", "design"],
        features: v?.features ?? [],
        stack: v?.stack ?? [],
        payments: v?.payments ?? [],
        monetization: v?.monetization ?? [],
        compliance: v?.compliance ?? [],
        sort: t?.row?.sort ?? 0,
      },
    });
    setMsg(null);
  }

  function saveEditing() {
    if (!editing) return;
    if (editing.kind === "expert") {
      const d = editing.draft;
      const all: Record<string, unknown> = { emoji: d.emoji, role: d.role, org: d.org, spec: d.spec, years: Number(d.years) || 8, color: d.color, task: d.task, taskEn: d.taskEn };
      let data = all;
      if (editing.builtin) {
        const b = builtinExperts.find((x) => x.id === d.id)!;
        data = Object.fromEntries(Object.entries(all).filter(([k, v]) => v !== (b as unknown as Record<string, unknown>)[k] && !(k === "taskEn" && v === (b.taskEn ?? ""))));
      }
      const row = rowOf("expert", d.id);
      return put("expert", d.id.trim(), data, row ? row.enabled : true, Number(d.sort) || 0, editing.isNew ? "Uzman eklendi." : "Uzman güncellendi.");
    }
    const d = editing.draft;
    const all: Record<string, unknown> = {
      name: d.name,
      icon: d.icon,
      badge: d.badge,
      category: d.category,
      ...(d.descTr || d.descEn ? { description: { ...(d.descTr ? { tr: d.descTr } : {}), ...(d.descEn ? { en: d.descEn } : {}) } } : {}),
      experts: d.experts,
      features: d.features,
      stack: d.stack,
      payments: d.payments,
      monetization: d.monetization,
      compliance: d.compliance,
    };
    let data = all;
    if (editing.builtin) {
      const b = builtinTypes.find((x) => x.type.id === d.id)!;
      const base: Record<string, unknown> = {
        name: b.type.name,
        icon: b.type.icon,
        badge: b.type.badge,
        category: b.category,
        experts: b.preset?.experts ?? [],
        features: b.preset?.features ?? [],
        stack: b.stack ?? [],
        payments: b.preset?.payments ?? [],
        monetization: b.preset?.monetization ?? [],
        compliance: b.preset?.compliance ?? [],
      };
      data = Object.fromEntries(
        Object.entries(all).filter(([k, v]) => {
          if (k === "description") return true;
          const bv = base[k];
          return Array.isArray(v) && Array.isArray(bv) ? !sameList(v as string[], bv as string[]) : v !== bv;
        }),
      );
    }
    const row = rowOf("project_type", d.id);
    return put("project_type", d.id.trim(), data, row ? row.enabled : true, Number(d.sort) || 0, editing.isNew ? "Proje tipi eklendi." : "Proje tipi güncellendi.");
  }

  const list = tab === "expert" ? experts : types;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-ink-900 border border-ink-600">
          {(
            [
              ["expert", `Uzmanlar (${experts.filter((e) => e.enabled).length})`],
              ["project_type", `Proje tipleri (${types.filter((t) => t.enabled).length})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setTab(k);
                setEditing(null);
              }}
              className={cx("h-8 px-3 rounded-lg text-[12.5px] font-semibold", tab === k ? "bg-ink-700 text-white" : "text-zinc-500 hover:text-zinc-200")}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => (tab === "expert" ? editExpert(null) : editType(null))}
          className="h-9 px-3 rounded-lg bg-lime text-black text-[12.5px] font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" aria-hidden /> {tab === "expert" ? "Yeni uzman" : "Yeni proje tipi"}
        </button>
      </div>

      {msg && <div className={cx("rounded-xl border p-3 text-[13px]", msg.ok ? "border-lime/30 bg-lime/10 text-lime" : "border-red-500/30 bg-red-500/10 text-red-300")}>{msg.text}</div>}

      {editing && (
        <section className="rounded-2xl bg-ink-900 border border-lime/30 p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[14px] font-bold">
              {editing.isNew ? (editing.kind === "expert" ? "Yeni uzman" : "Yeni proje tipi") : `Düzenle: ${editing.draft.id}`}
              {editing.builtin && <span className="ml-2 text-[11px] font-normal text-zinc-500">yerleşik — yalnız değiştirdiğin alanlar kaydedilir</span>}
            </h2>
            <button type="button" onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-600 grid place-items-center" aria-label="Kapat">
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
          {editing.kind === "expert" ? (
            <ExpertForm draft={editing.draft} isNew={editing.isNew} onChange={(draft) => setEditing({ ...editing, draft })} />
          ) : (
            <TypeForm
              draft={editing.draft}
              isNew={editing.isNew}
              categories={categories}
              experts={expertChoices}
              options={options}
              onChange={(draft) => setEditing({ ...editing, draft })}
            />
          )}
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setEditing(null)} className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[12.5px]">
              Vazgeç
            </button>
            <button type="button" disabled={busy} onClick={saveEditing} className="h-9 px-4 rounded-lg bg-lime text-black text-[12.5px] font-bold flex items-center gap-1.5 disabled:opacity-60">
              <Save className="w-4 h-4" aria-hidden /> Kaydet
            </button>
          </div>
        </section>
      )}

      <div className="rounded-2xl bg-ink-900 border border-ink-600 divide-y divide-ink-600">
        {list.map((item) => {
          const isExpert = tab === "expert";
          const v = item.view as Record<string, unknown>;
          const title = isExpert ? `${str(v.emoji)} ${str(v.role)}` : `${str(v.icon)} ${str(v.name)}`;
          const sub = isExpert ? `${str(v.spec)}${str(v.org) ? ` · ${str(v.org)}` : ""}` : `${str(v.category)} · ${arr(v.experts).length} uzman · ${arr(v.features).length} özellik`;
          const edited = item.builtin && item.row && Object.keys(item.row.data ?? {}).length > 0;
          const key = `${tab}:${item.id}`;
          return (
            <div key={key} className={cx("flex flex-col md:flex-row md:items-center gap-3 px-4 py-3", !item.enabled && "opacity-50")}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[13.5px]">{title}</span>
                  <code className="text-[11px] text-zinc-500">{item.id}</code>
                  <span className={cx("text-[10.5px] px-1.5 py-0.5 rounded border", item.builtin ? "border-ink-500 text-zinc-400" : "border-lime/40 text-lime")}>{item.builtin ? "yerleşik" : "özel"}</span>
                  {edited && <span className="text-[10.5px] px-1.5 py-0.5 rounded border border-violet/40 text-violet">düzenlendi</span>}
                  {!item.enabled && <span className="text-[10.5px] px-1.5 py-0.5 rounded border border-red-500/40 text-red-300">gizli</span>}
                </div>
                <p className="mt-0.5 text-[12px] text-zinc-500 truncate">{sub}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <IconBtn label="Düzenle" onClick={() => (isExpert ? editExpert(item.id) : editType(item.id))} icon={<Pencil className="w-3.5 h-3.5" aria-hidden />} />
                <IconBtn
                  label={item.enabled ? "Gizle" : "Göster"}
                  disabled={busy}
                  onClick={() => put(tab, item.id, (item.row?.data ?? {}) as Record<string, unknown>, !item.enabled, item.row?.sort ?? 0, item.enabled ? "Gizlendi." : "Tekrar gösteriliyor.")}
                  icon={item.enabled ? <EyeOff className="w-3.5 h-3.5" aria-hidden /> : <Eye className="w-3.5 h-3.5" aria-hidden />}
                />
                {item.builtin && item.row && (
                  <IconBtn label="Varsayılana dön" disabled={busy} onClick={() => del(tab, item.id, "Varsayılana döndürüldü.")} icon={<RotateCcw className="w-3.5 h-3.5" aria-hidden />} />
                )}
                {!item.builtin &&
                  (confirmDelete === key ? (
                    <>
                      <IconBtn label="Vazgeç" onClick={() => setConfirmDelete(null)} icon={<X className="w-3.5 h-3.5" aria-hidden />} />
                      <IconBtn danger label="Evet, sil" disabled={busy} onClick={() => del(tab, item.id, "Silindi.")} icon={<Trash2 className="w-3.5 h-3.5" aria-hidden />} />
                    </>
                  ) : (
                    <IconBtn danger label="Sil" onClick={() => setConfirmDelete(key)} icon={<Trash2 className="w-3.5 h-3.5" aria-hidden />} />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11.5px] text-zinc-500">
        Gizlenen bir uzman kayıtlı projelerde ve API çıktısında atlanır; gizlenen proje tipinin /prompt sayfası 404 döner. Yerleşik öğeler silinemez, yalnız gizlenir veya varsayılana döner.
      </p>
    </div>
  );
}

function IconBtn({ label, icon, onClick, disabled, danger }: { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "h-8 px-2.5 rounded-lg border text-[12px] flex items-center gap-1.5 disabled:opacity-50",
        danger ? "border-red-500/40 text-red-300 hover:bg-red-500/10" : "border-ink-600 bg-ink-800 text-zinc-300 hover:border-ink-400",
      )}
    >
      {icon} {label}
    </button>
  );
}

const inputCls = "w-full h-9 px-3 rounded-lg bg-ink-950 border border-ink-600 focus:border-ink-400 focus:outline-none text-[13px]";
const areaCls = "w-full px-3 py-2 rounded-lg bg-ink-950 border border-ink-600 focus:border-ink-400 focus:outline-none text-[12.5px] leading-relaxed";

function Field({ label, children, hint, wide }: { label: string; children: React.ReactNode; hint?: string; wide?: boolean }) {
  return (
    <label className={cx("block min-w-0", wide && "md:col-span-2")}>
      <span className="block text-[11px] font-semibold tracking-wide text-zinc-400 mb-1">{label}</span>
      {children}
      {hint && <span className="block mt-1 text-[11px] text-zinc-600">{hint}</span>}
    </label>
  );
}

function ExpertForm({ draft, isNew, onChange }: { draft: ExpertDraft; isNew: boolean; onChange: (d: ExpertDraft) => void }) {
  const set = <K extends keyof ExpertDraft>(k: K, v: ExpertDraft[K]) => onChange({ ...draft, [k]: v });
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Field label="ID" hint="küçük harf, rakam, tire — sonradan değişmez">
        <input className={inputCls} value={draft.id} disabled={!isNew} onChange={(e) => set("id", e.target.value.toLowerCase())} placeholder="ör. legal" />
      </Field>
      <div className="grid grid-cols-[80px_1fr_110px] gap-2">
        <Field label="Emoji">
          <input className={inputCls} value={draft.emoji} onChange={(e) => set("emoji", e.target.value)} />
        </Field>
        <Field label="Deneyim (yıl)">
          <input className={inputCls} type="number" min={1} max={40} value={draft.years} onChange={(e) => set("years", Number(e.target.value))} />
        </Field>
        <Field label="Renk">
          <input className={cx(inputCls, "p-1")} type="color" value={draft.color} onChange={(e) => set("color", e.target.value)} />
        </Field>
      </div>
      <Field label="Rol (ör. Legal Counsel)">
        <input className={inputCls} value={draft.role} onChange={(e) => set("role", e.target.value)} />
      </Field>
      <Field label="Uzmanlık (kısa)">
        <input className={inputCls} value={draft.spec} onChange={(e) => set("spec", e.target.value)} />
      </Field>
      <Field label="Geçmiş / etiket (ör. ex-Stripe)">
        <input className={inputCls} value={draft.org} onChange={(e) => set("org", e.target.value)} />
      </Field>
      <Field label="Sıra">
        <input className={inputCls} type="number" value={draft.sort} onChange={(e) => set("sort", Number(e.target.value))} />
      </Field>
      <Field label="Görev (Türkçe prompt metni)" wide>
        <textarea className={areaCls} rows={4} value={draft.task} onChange={(e) => set("task", e.target.value)} />
      </Field>
      <Field label="Task (English prompt text)" wide hint="Boş kalırsa İngilizce çıktıda Türkçe görev kullanılır — İngilizcesini yazmanı öneririz.">
        <textarea className={areaCls} rows={4} value={draft.taskEn} onChange={(e) => set("taskEn", e.target.value)} />
      </Field>
    </div>
  );
}

function Chips({ all, selected, onChange, render }: { all: string[]; selected: string[]; onChange: (v: string[]) => void; render?: (v: string) => string }) {
  const extra = selected.filter((x) => !all.includes(x));
  return (
    <div className="flex flex-wrap gap-1.5">
      {[...all, ...extra].map((v) => {
        const on = selected.includes(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(on ? selected.filter((x) => x !== v) : [...selected, v])}
            className={cx("h-7 px-2.5 rounded-full border text-[11.5px]", on ? "bg-lime/15 border-lime/50 text-lime" : "bg-ink-950 border-ink-600 text-zinc-400 hover:border-ink-400")}
          >
            {render ? render(v) : v}
          </button>
        );
      })}
    </div>
  );
}

function AddLine({ onAdd, placeholder }: { onAdd: (v: string) => void; placeholder: string }) {
  const [v, setV] = useState("");
  return (
    <div className="mt-2 flex gap-2">
      <input
        className={inputCls}
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) {
            e.preventDefault();
            onAdd(v.trim());
            setV("");
          }
        }}
      />
      <button
        type="button"
        onClick={() => {
          if (v.trim()) onAdd(v.trim());
          setV("");
        }}
        className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[12px] shrink-0"
      >
        Ekle
      </button>
    </div>
  );
}

function TypeForm({
  draft,
  isNew,
  categories,
  experts,
  options,
  onChange,
}: {
  draft: TypeDraft;
  isNew: boolean;
  categories: string[];
  experts: { id: string; label: string }[];
  options: Options;
  onChange: (d: TypeDraft) => void;
}) {
  const set = <K extends keyof TypeDraft>(k: K, v: TypeDraft[K]) => onChange({ ...draft, [k]: v });
  const [newCat, setNewCat] = useState(!categories.includes(draft.category));
  const expertLabel = (id: string) => experts.find((e) => e.id === id)?.label ?? id;
  const payName = (id: string) => options.payments.find((p) => p.id === id)?.name ?? id;
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Field label="ID" hint="küçük harf, rakam, tire — Studio'da ?type=<id>">
        <input className={inputCls} value={draft.id} disabled={!isNew} onChange={(e) => set("id", e.target.value.toLowerCase())} placeholder="ör. restaurant-app" />
      </Field>
      <div className="grid grid-cols-[80px_1fr_110px] gap-2">
        <Field label="İkon">
          <input className={inputCls} value={draft.icon} onChange={(e) => set("icon", e.target.value)} />
        </Field>
        <Field label="Ad">
          <input className={inputCls} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Restaurant Ordering App" />
        </Field>
        <Field label="Rozet">
          <select className={inputCls} value={draft.badge} onChange={(e) => set("badge", e.target.value as TypeDraft["badge"])}>
            <option value="">—</option>
            <option value="NEW">NEW</option>
            <option value="HOT">HOT</option>
          </select>
        </Field>
      </div>
      <Field label="Kategori">
        {newCat ? (
          <div className="flex gap-2">
            <input className={inputCls} value={draft.category} onChange={(e) => set("category", e.target.value)} placeholder="🍽️ FOOD" />
            <button type="button" onClick={() => setNewCat(false)} className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[12px] shrink-0">
              Listeden
            </button>
          </div>
        ) : (
          <select
            className={inputCls}
            value={draft.category}
            onChange={(e) => {
              if (e.target.value === "__new") {
                setNewCat(true);
                set("category", "");
              } else set("category", e.target.value);
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__new">+ Yeni kategori…</option>
          </select>
        )}
      </Field>
      <Field label="Sıra">
        <input className={inputCls} type="number" value={draft.sort} onChange={(e) => set("sort", Number(e.target.value))} />
      </Field>
      <Field label="Açıklama (TR, API/MCP listesinde)">
        <input className={inputCls} value={draft.descTr} onChange={(e) => set("descTr", e.target.value)} maxLength={300} />
      </Field>
      <Field label="Description (EN)">
        <input className={inputCls} value={draft.descEn} onChange={(e) => set("descEn", e.target.value)} maxLength={300} />
      </Field>
      <Field label="Önerilen uzmanlar" wide>
        <Chips all={experts.map((e) => e.id)} selected={draft.experts} onChange={(v) => set("experts", v)} render={expertLabel} />
      </Field>
      <Field label="v1 özellikleri" wide>
        <Chips all={options.features} selected={draft.features} onChange={(v) => set("features", v)} />
        <AddLine placeholder="Listede olmayan bir özellik ekle ve Enter'a bas" onAdd={(v) => !draft.features.includes(v) && set("features", [...draft.features, v])} />
      </Field>
      <Field label="Önerilen stack" wide>
        <Chips all={options.stack} selected={draft.stack} onChange={(v) => set("stack", v)} />
        <AddLine placeholder="Listede olmayan bir teknoloji ekle" onAdd={(v) => !draft.stack.includes(v) && set("stack", [...draft.stack, v])} />
      </Field>
      <Field label="Ödeme sağlayıcıları">
        <Chips all={options.payments.map((p) => p.id)} selected={draft.payments} onChange={(v) => set("payments", v)} render={payName} />
      </Field>
      <Field label="Gelir modeli">
        <Chips all={options.monetization} selected={draft.monetization} onChange={(v) => set("monetization", v)} />
      </Field>
      <Field label="Uyumluluk" wide>
        <Chips all={options.compliance} selected={draft.compliance} onChange={(v) => set("compliance", v)} />
      </Field>
    </div>
  );
}
