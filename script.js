// ──────────────────────────────────────────────────────────────────────────
// md2loop — Markdown to Microsoft Loop clipboard converter
// ──────────────────────────────────────────────────────────────────────────

const input   = document.getElementById('md-input');
const preview = document.getElementById('preview');
const copyBtn = document.getElementById('copy-btn');
const toast   = document.getElementById('toast');

const STORAGE_KEY = 'md2loop.markdown';

const DEFAULT_MARKDOWN = `# Project plan

A quick note on the **next steps** before Friday.

## Tasks
- [x] Sketch the layout
- [x] Pick the typography
- [ ] Write the post-processing
- [ ] Ship to GitHub Pages

## Notes
> Loop reads \`text/html\` from the clipboard.

| Stage  | Owner   | Status   |
| ------ | ------- | -------- |
| Design | Alex    | Done     |
| Build  | Sam     | Active   |
| Ship   | Jordan  | Queued   |

See the original [trsdn/md2loop](https://github.com/trsdn/md2loop).
`;

// ──────────── Markdown → HTML ─────────────────────────────────────────────

marked.setOptions({ gfm: true, breaks: false });

function renderMarkdown(md) {
  return marked.parse(md);
}

// ──────────── Loop-flavored HTML post-processing ──────────────────────────
//
// Loop accepts a broad subset of HTML but renders better when:
//   • class / id / style attributes are stripped
//   • language-* classes on <pre>/<code> are PRESERVED — Loop reads these to
//     pick a code-block language (csharp, mermaid, etc.). For mermaid this
//     causes Loop to render the diagram rather than show source.
//   • task-list checkboxes are real Unicode glyphs (☑ / ☐), not <input>s
//   • table markup is minimal
//
function loopify(html) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  wrapper.querySelectorAll('*').forEach(el => {
    el.removeAttribute('id');
    el.removeAttribute('style');

    const isCodeTag = el.tagName === 'PRE' || el.tagName === 'CODE';
    if (isCodeTag && el.classList.length) {
      const langClasses = [...el.classList].filter(c => c.startsWith('language-'));
      el.removeAttribute('class');
      if (langClasses.length) el.className = langClasses.join(' ');
    } else {
      el.removeAttribute('class');
    }
  });

  wrapper.querySelectorAll('input[type="checkbox"]').forEach(box => {
    const glyph = (box.hasAttribute('checked') || box.checked) ? '☑' : '☐';
    box.replaceWith(document.createTextNode(glyph + ' '));
  });

  wrapper.querySelectorAll('table, th, td, tr, thead, tbody').forEach(el => {
    el.removeAttribute('align');
  });

  return wrapper.innerHTML;
}

// ──────────── Live preview ────────────────────────────────────────────────

function update() {
  const html = loopify(renderMarkdown(input.value));
  preview.innerHTML = html;
  saveDraft(input.value);
}

// ──────────── Persistence ─────────────────────────────────────────────────

function loadDraft() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveDraft(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* quota / privacy-mode: ignore */
  }
}

// ──────────── Toast ───────────────────────────────────────────────────────

let toastTimeout;
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ──────────── Clipboard ───────────────────────────────────────────────────

async function copyAsLoop() {
  const plain = input.value;
  const html  = loopify(renderMarkdown(plain));

  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const item = new ClipboardItem({
        'text/html':  new Blob([html],  { type: 'text/html'  }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
    } else if (navigator.clipboard?.writeText) {
      // Fallback: at least put plain text on the clipboard.
      await navigator.clipboard.writeText(plain);
    } else {
      throw new Error('Clipboard API not available');
    }
    showToast('Copied · paste into Loop');
  } catch (err) {
    console.error('[md2loop] copy failed:', err);
    showToast('Copy failed — check permissions', true);
  }
}

// ──────────── Wiring ──────────────────────────────────────────────────────

input.addEventListener('input', update);
copyBtn.addEventListener('click', copyAsLoop);

// Cmd/Ctrl + Enter from anywhere triggers a copy.
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    copyAsLoop();
  }
});

// Initial state — restore draft if present, otherwise show the demo content.
const draft = loadDraft();
input.value = draft !== null ? draft : DEFAULT_MARKDOWN;
update();
