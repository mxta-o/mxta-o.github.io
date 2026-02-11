<script>
  export let isVisible = false;

  const handleScroll = () => {
    if (typeof window === 'undefined') return;
    isVisible = true;
  };

  if (typeof window !== 'undefined') {
    setTimeout(handleScroll, 100);
  }
</script>

<div class={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
  <slot />
</div>
