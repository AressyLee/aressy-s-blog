document.addEventListener('DOMContentLoaded', () => {
  const carousels = document.querySelectorAll('.carousel-container');
  
  carousels.forEach(container => {
    const track = container.querySelector('.carousel-track');
    const btnPrev = container.querySelector('.carousel-btn.prev');
    const btnNext = container.querySelector('.carousel-btn.next');
    
    if (!track || !btnPrev || !btnNext) return;
    
    const scrollAmount = () => {
      const slide = track.querySelector('.carousel-slide');
      if (slide) {
        // 取單張卡片寬度加上 CSS gap 作為滑動距離
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        return slide.offsetWidth + gap;
      }
      return 300; // fallback
    };

    btnNext.addEventListener('click', () => {
      track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });

    btnPrev.addEventListener('click', () => {
      track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });
  });
});
