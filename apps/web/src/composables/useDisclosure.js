import { ref, useId } from "vue";

export const useDisclosure = () => {
  const open = ref(false);
  const id = useId();
  const toggle = () => {
    open.value = !open.value;
  };
  return { open, id, toggle };
};
