<script>
  import { onMount } from 'svelte';

  export let text = '';
  export let speed = 50;

  let displayedText = '';
  let currentIndex = 0;

  onMount(() => {
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        displayedText += text[currentIndex];
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  });
</script>

<span class="typewriter">{displayedText}<span class="cursor">▶</span></span>

<style>
  .typewriter {
    display: inline-block;
  }

  .cursor {
    animation: blink 1s infinite;
    margin-left: 4px;
  }

  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
</style>
