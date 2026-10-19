import { onScopeDispose, ref } from "vue";

export const useNavigation = () => {
  const view = ref(history.state?.view ?? "pager");

  const open = (next) => {
    if (view.value === next) return;
    history.pushState({ view: next }, "");
    view.value = next;
  };

  const back = () => {
    if (history.state?.view) history.back();
    else view.value = "pager";
  };

  const onPopState = (event) => {
    view.value = event.state?.view ?? "pager";
  };

  window.addEventListener("popstate", onPopState);
  onScopeDispose(() => window.removeEventListener("popstate", onPopState));

  return { view, open, back };
};
