import { onScopeDispose, ref, useId, watch } from "vue";

export const useDisclosure = () => {
  const open = ref(false);
  const id = useId();
  const toggle = () => {
    open.value = !open.value;
  };
  const close = () => {
    open.value = false;
  };
  const onKey = (event) => {
    if (event.key === "Escape") close();
  };
  watch(open, (value) => {
    if (value) window.addEventListener("keydown", onKey);
    else window.removeEventListener("keydown", onKey);
  });
  onScopeDispose(() => window.removeEventListener("keydown", onKey));
  return { open, id, toggle, close };
};
