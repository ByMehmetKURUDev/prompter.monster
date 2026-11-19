// Prompter.Monster — Tek Tık Aktar: popup logic.
// Reads the clipboard (filled by the "Copy" buttons on prompter.monster) and
// pastes it into whatever AI chat box is active in the current tab.

const LANG = (navigator.language || "tr").toLowerCase().startsWith("en") ? "en" : "tr";

const COPY = {
  tr: {
    paste: "Panodakini Yapıştır",
    pasting: "Yapıştırılıyor…",
    toggle: "Yapıştırdıktan sonra otomatik gönder",
    hint: "İncelemeden gönderir — dikkatli kullan.",
    footer: "Prompter.Monster'da yeni prompt oluştur →",
    okPasted: "Yapıştırıldı ✅",
    okSent: "Yapıştırıldı ve gönderildi ✅",
    errEmpty: "Pano boş görünüyor. Önce Prompter.Monster'da bir bölümü kopyala.",
    errClipboard: "Pano okunamadı. Chrome'un pano iznini kontrol et.",
    errNoTarget: "Bu sayfada bir sohbet kutusu bulunamadı.",
    errRestricted: "Bu sayfada çalışmaz — bir AI sohbet sekmesine geç.",
    detected: (name) => `Algılanan: ${name}`,
    detectedGeneric: "Herhangi bir sayfa — metin kutusu aranacak",
  },
  en: {
    paste: "Paste from Clipboard",
    pasting: "Pasting…",
    toggle: "Auto-send after pasting",
    hint: "Sends without review — use with care.",
    footer: "Create a new prompt on Prompter.Monster →",
    okPasted: "Pasted ✅",
    okSent: "Pasted and sent ✅",
    errEmpty: "Clipboard looks empty. Copy a section on Prompter.Monster first.",
    errClipboard: "Couldn't read the clipboard. Check Chrome's clipboard permission.",
    errNoTarget: "No chat box found on this page.",
    errRestricted: "Doesn't work on this page — switch to an AI chat tab.",
    detected: (name) => `Detected: ${name}`,
    detectedGeneric: "Unrecognized page — will search for a text box",
  },
}[LANG];

const SITES = [
  { match: /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/, name: "ChatGPT" },
  { match: /(^|\.)claude\.ai$/, name: "Claude" },
  { match: /(^|\.)gemini\.google\.com$/, name: "Gemini" },
  { match: /(^|\.)copilot\.microsoft\.com$|(^|\.)copilot\.cloud\.microsoft$/, name: "Copilot" },
  { match: /(^|\.)perplexity\.ai$/, name: "Perplexity" },
  { match: /(^|\.)chat\.mistral\.ai$/, name: "Le Chat" },
  { match: /(^|\.)grok\.com$/, name: "Grok" },
  { match: /(^|\.)chat\.deepseek\.com$/, name: "DeepSeek" },
  { match: /(^|\.)poe\.com$/, name: "Poe" },
];

const RESTRICTED = /^(chrome|chrome-extension|edge|about|devtools):/;

const pasteBtn = document.getElementById("pasteBtn");
const btnLabel = document.getElementById("btnLabel");
const statusEl = document.getElementById("status");
const siteLabel = document.getElementById("siteLabel");
const siteDot = document.getElementById("siteDot");
const autoSubmitEl = document.getElementById("autoSubmit");
const toggleLabel = document.getElementById("toggleLabel");
const toggleHint = document.getElementById("toggleHint");
const footerLink = document.getElementById("footerLink");

btnLabel.textContent = COPY.paste;
toggleLabel.textContent = COPY.toggle;
toggleHint.textContent = COPY.hint;
footerLink.textContent = COPY.footer;

let activeTab = null;

function showStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.hidden = false;
  statusEl.className = "status" + (kind ? ` ${kind}` : "");
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab || null;
  const url = activeTab?.url || "";

  if (!url || RESTRICTED.test(url)) {
    siteLabel.textContent = COPY.errRestricted;
    siteDot.className = "dot warn";
    pasteBtn.disabled = true;
    return;
  }

  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    /* non-http(s) tab */
  }
  const site = SITES.find((s) => s.match.test(hostname));
  if (site) {
    siteLabel.textContent = COPY.detected(site.name);
    siteDot.className = "dot ok";
  } else {
    siteLabel.textContent = COPY.detectedGeneric;
    siteDot.className = "dot";
  }

  chrome.storage.sync.get(["autoSubmit"], (res) => {
    autoSubmitEl.checked = Boolean(res.autoSubmit);
  });
}

autoSubmitEl.addEventListener("change", () => {
  chrome.storage.sync.set({ autoSubmit: autoSubmitEl.checked });
});

// Injected verbatim into the page via chrome.scripting.executeScript — must be fully
// self-contained (no references to anything outside this function).
function injectPromptIntoPage(text, autoSubmit) {
  function isVisible(el) {
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 16) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none" && !el.disabled;
  }
  function area(el) {
    const r = el.getBoundingClientRect();
    return r.width * r.height;
  }
  function findTarget() {
    const hints = [
      "#prompt-textarea",
      'div[id^="prompt-textarea"]',
      "div.ProseMirror[contenteditable='true']",
      "rich-textarea .ql-editor",
      ".ql-editor[contenteditable='true']",
      'textarea[placeholder]',
    ];
    for (const sel of hints) {
      const el = document.querySelector(sel);
      if (el && isVisible(el)) return el;
    }
    const candidates = [...document.querySelectorAll('textarea, [contenteditable="true"], [contenteditable=""]')].filter(isVisible);
    if (!candidates.length) return null;
    candidates.sort((a, b) => area(b) - area(a));
    return candidates[0];
  }

  const el = findTarget();
  if (!el) return { ok: false, reason: "no-target" };

  el.focus();
  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, text);
    else el.value = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
    const inserted = document.execCommand("insertText", false, text);
    if (!inserted) {
      el.textContent = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  if (autoSubmit) {
    setTimeout(() => {
      const form = el.closest("form");
      const candidates = form ? [...form.querySelectorAll("button")] : [...document.querySelectorAll("button")];
      const btn = candidates.find((b) => {
        if (b.disabled) return false;
        const label = `${b.getAttribute("aria-label") || ""} ${b.getAttribute("data-testid") || ""} ${b.textContent || ""}`.toLowerCase();
        return /gönder|send|submit/.test(label);
      });
      if (btn) btn.click();
      else el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
    }, 120);
  }

  return { ok: true };
}

pasteBtn.addEventListener("click", async () => {
  if (!activeTab?.id) return;
  pasteBtn.disabled = true;
  btnLabel.textContent = COPY.pasting;
  statusEl.hidden = true;

  try {
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      showStatus(COPY.errClipboard, "err");
      return;
    }
    if (!text || !text.trim()) {
      showStatus(COPY.errEmpty, "err");
      return;
    }

    const autoSubmit = autoSubmitEl.checked;
    const [{ result } = {}] = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: injectPromptIntoPage,
      args: [text, autoSubmit],
    });

    if (result?.ok) showStatus(autoSubmit ? COPY.okSent : COPY.okPasted, "ok");
    else showStatus(COPY.errNoTarget, "err");
  } catch {
    showStatus(COPY.errNoTarget, "err");
  } finally {
    pasteBtn.disabled = false;
    btnLabel.textContent = COPY.paste;
  }
});

init();
