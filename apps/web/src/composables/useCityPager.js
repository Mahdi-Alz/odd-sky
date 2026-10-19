import { nextTick, onMounted, onScopeDispose, watch } from "vue";

export const useCityPager = (containerRef, activeIndex, count) => {
  let frame = 0;

  const currentIndex = () => {
    const el = containerRef.value;
    if (!el || !el.clientWidth) return 0;
    return Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
  };

  const goTo = (index, behavior = "smooth") => {
    const page = containerRef.value?.children[index];
    page?.scrollIntoView({ behavior, inline: "start", block: "nearest" });
  };

  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const index = Math.min(currentIndex(), Math.max(count.value - 1, 0));
      if (index !== activeIndex.value) activeIndex.value = index;
    });
  };

  watch(activeIndex, async (index) => {
    await nextTick();
    if (index !== currentIndex()) goTo(index);
  });

  watch(count, async (value) => {
    if (activeIndex.value > value - 1) activeIndex.value = Math.max(value - 1, 0);
    await nextTick();
    if (activeIndex.value !== currentIndex()) goTo(activeIndex.value, "instant");
  });

  onMounted(() => {
    containerRef.value?.addEventListener("scroll", onScroll, { passive: true });
    goTo(activeIndex.value, "instant");
  });
  onScopeDispose(() => {
    cancelAnimationFrame(frame);
    containerRef.value?.removeEventListener("scroll", onScroll);
  });

  return { goTo };
};
