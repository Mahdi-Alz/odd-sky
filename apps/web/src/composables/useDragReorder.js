import { nextTick, onScopeDispose, ref } from "vue";

const SETTLE_MS = 300;
const EASE = "transform var(--motion-move) ease-out";

export const useDragReorder = (onReorder) => {
  const draggingIndex = ref(-1);
  const settling = ref(false);

  let rows = /** @type {HTMLElement[]} */ ([]);
  let tops = /** @type {number[]} */ ([]);
  let from = -1;
  let to = -1;
  let startY = 0;
  let step = 0;
  let pointerId = -1;
  let settleTimer = 0;

  const rowsOf = (list) =>
    /** @type {HTMLElement[]} */ (
      Array.from(list.children).filter((el) => !el.classList.contains("list-leave-active"))
    );

  const shiftOf = (index) => {
    if (from < to && index > from && index <= to) return -step;
    if (to < from && index >= to && index < from) return step;
    return 0;
  };

  const onMove = (event) => {
    if (event.pointerId !== pointerId) return;
    const last = rows.length - 1;
    const offset = Math.min(
      Math.max(event.clientY - startY, tops[0] - tops[from]),
      tops[last] - tops[from],
    );
    rows[from].style.transform = `translateY(${offset}px)`;

    const center = tops[from] + offset + rows[from].offsetHeight / 2;
    let target = from;
    for (let i = 0; i <= last; i += 1) {
      if (i === from) continue;
      const mid = tops[i] + rows[i].offsetHeight / 2;
      if (i > from && center >= mid) target = i;
      if (i < from && center <= mid && target >= from) target = i;
    }
    if (target === to) return;
    to = target;
    rows.forEach((row, i) => {
      if (i !== from) row.style.transform = `translateY(${shiftOf(i)}px)`;
    });
  };

  const stopListening = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  };

  const onUp = async (event) => {
    if (event.pointerId !== pointerId) return;
    stopListening();
    pointerId = -1;
    const dragged = rows[from];
    const before = dragged.getBoundingClientRect().top;
    rows.forEach((row) => {
      row.style.transition = "none";
      row.style.transform = "";
    });
    if (to !== from) onReorder(from, to);
    draggingIndex.value = -1;

    await nextTick();
    const after = dragged.getBoundingClientRect().top;
    dragged.style.transform = `translateY(${before - after}px)`;
    void dragged.offsetHeight;
    dragged.style.transition = EASE;
    dragged.style.transform = "";

    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      rows.forEach((row) => {
        row.style.transition = "";
      });
      rows = [];
      settling.value = false;
    }, SETTLE_MS);
  };

  const onPointerDown = (event) => {
    const handle = /** @type {HTMLElement | null} */ (event.target.closest("[data-drag-handle]"));
    if (!handle || event.button !== 0 || pointerId !== -1 || settling.value) return;
    const row = handle.closest("li");
    rows = rowsOf(event.currentTarget);
    from = rows.indexOf(row);
    if (from === -1) return;

    event.preventDefault();
    handle.focus({ preventScroll: true });
    to = from;
    startY = event.clientY;
    pointerId = event.pointerId;
    tops = rows.map((el) => el.getBoundingClientRect().top);
    step = rows.length > 1 ? Math.abs(tops[1] - tops[0]) : 0;
    rows.forEach((el, i) => {
      el.style.transition = i === from ? "none" : EASE;
    });
    draggingIndex.value = from;
    settling.value = true;

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const onKeyDown = async (event) => {
    const handle = /** @type {HTMLElement | null} */ (event.target.closest("[data-drag-handle]"));
    if (!handle || settling.value) return;
    const delta = { ArrowUp: -1, ArrowDown: 1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    const list = rowsOf(event.currentTarget);
    const index = list.indexOf(handle.closest("li"));
    const target = index + delta;
    if (index === -1 || target < 0 || target >= list.length) return;
    onReorder(index, target);
    await nextTick();
    handle.focus({ preventScroll: true });
    handle.scrollIntoView({ block: "nearest" });
  };

  onScopeDispose(() => {
    stopListening();
    clearTimeout(settleTimer);
  });

  return { draggingIndex, settling, onPointerDown, onKeyDown };
};
