// Photo slot management: holds up to MAX_IMAGES selected photos, each with an organ
// tag, and renders their thumbnails + per-slot organ selector + remove button.

export const MAX_IMAGES = 5;

const ORGANS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'flower', label: 'Flower' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'leaf', label: 'Leaf' },
  { value: 'bark', label: 'Bark' },
];

export class PhotoStore {
  constructor({ slotsEl, addBtnEl, onChange }) {
    this.slotsEl = slotsEl;
    this.addBtnEl = addBtnEl;
    this.onChange = onChange;
    this.items = []; // { id, data, previewUrl, organ }
    this._seq = 0;
  }

  get count() {
    return this.items.length;
  }

  get full() {
    return this.items.length >= MAX_IMAGES;
  }

  add({ data, previewUrl }) {
    if (this.full) return;
    this.items.push({ id: ++this._seq, data, previewUrl, organ: 'auto' });
    this._render();
  }

  remove(id) {
    this.items = this.items.filter((it) => it.id !== id);
    this._render();
  }

  clear() {
    this.items = [];
    this._render();
  }

  payload() {
    return this.items.map((it) => ({ data: it.data, organ: it.organ }));
  }

  _render() {
    this.slotsEl.innerHTML = '';
    for (const it of this.items) {
      const slot = document.createElement('div');
      slot.className = 'slot';

      const img = document.createElement('img');
      img.src = it.previewUrl;
      img.alt = 'Selected plant photo';
      slot.appendChild(img);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'slot-remove';
      remove.setAttribute('aria-label', 'Remove photo');
      remove.textContent = '×';
      remove.addEventListener('click', () => this.remove(it.id));
      slot.appendChild(remove);

      const select = document.createElement('select');
      select.className = 'slot-organ';
      select.setAttribute('aria-label', 'What does this photo show?');
      for (const o of ORGANS) {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        if (o.value === it.organ) opt.selected = true;
        select.appendChild(opt);
      }
      select.addEventListener('change', (e) => {
        it.organ = e.target.value;
      });
      slot.appendChild(select);

      this.slotsEl.appendChild(slot);
    }

    this.addBtnEl.classList.toggle('hidden', this.full);
    if (this.onChange) this.onChange();
  }
}
