<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  onMount(() => {
    // Animate elements on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          
          // Animate section headings
          if (target.classList.contains('animate-heading')) {
            gsap.fromTo(target,
              { x: -50, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.8, ease: 'expo.out' }
            );
          }
          
          // Animate skill cards with stagger
          if (target.classList.contains('animate-cards')) {
            const cards = target.querySelectorAll('.animate-card');
            gsap.fromTo(cards,
              { y: 30, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
            );
            // Make the container visible
            (target as HTMLElement).style.opacity = '1';
          }
          
          // Animate project cards
          if (target.classList.contains('animate-project')) {
            gsap.fromTo(target,
              { scale: 0.95, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.7, ease: 'power2.out' }
            );
          }
          
          // Animate timeline items
          if (target.classList.contains('animate-timeline')) {
            gsap.fromTo(target,
              { x: -30, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
            );
          }

          // Animate about section
          if (target.classList.contains('animate-about')) {
            gsap.fromTo(target,
              { y: 40, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' }
            );
          }
          
          observer.unobserve(target);
        }
      });
    }, observerOptions);

    // Observe all elements with animation classes
    const animateElements = document.querySelectorAll(
      '.animate-heading, .animate-project, .animate-timeline, .animate-about'
    );
    
    animateElements.forEach((el) => {
      (el as HTMLElement).style.opacity = '0';
      observer.observe(el);
    });

    // Observe cards container but don't hide it (we'll hide individual cards)
    const cardsContainers = document.querySelectorAll('.animate-cards');
    cardsContainers.forEach((container) => {
      observer.observe(container);
    });

    // Hide individual cards initially
    const animateCards = document.querySelectorAll('.animate-card');
    animateCards.forEach((card) => {
      (card as HTMLElement).style.opacity = '0';
    });

    // Animate hero section on load
    gsap.fromTo('.hero-title',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'expo.out', delay: 0.2 }
    );

    gsap.fromTo('.hero-subtitle',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', delay: 0.4 }
    );

    gsap.fromTo('.hero-description',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', delay: 0.6 }
    );

    gsap.fromTo('.hero-buttons',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', delay: 0.8 }
    );

    // ── Card tilt on hover ──
    const tiltCards = document.querySelectorAll<HTMLElement>('.animate-card, .animate-project');
    tiltCards.forEach((card) => {
      card.style.transformStyle = 'preserve-3d';
      card.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = ((y / rect.height) - 0.5) * -12;
        const rotateY = ((x / rect.width) - 0.5) * 12;
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        card.style.transition = 'transform 0.08s ease, box-shadow 0.08s ease';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
        card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
      });
    });

    return () => {
      observer.disconnect();
    };
  });
</script>
