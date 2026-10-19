import { ref } from "vue";
import { useCitiesStore } from "../stores/cities";
import { buildTransferLink } from "../storage/transfer";

export const useTransfer = () => {
  const cities = useCitiesStore();
  const status = ref(null);

  const copyLink = async () => {
    try {
      const link = await buildTransferLink(cities.sorted, `${location.origin}${location.pathname}`);
      await navigator.clipboard.writeText(link);
      status.value = "copied";
    } catch {
      status.value = "failed";
    }
    setTimeout(() => {
      status.value = null;
    }, 2500);
  };

  return { status, copyLink };
};
