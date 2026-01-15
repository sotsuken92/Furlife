// =============================================================================
// ユーティリティ関数
// =============================================================================

const q = (sel) => document.querySelector(sel);
const qa = (sel) => document.querySelectorAll(sel);

// =============================================================================
// テーマ管理
// =============================================================================

function initTheme() {
  let savedTheme = localStorage.getItem('theme') || 'blue-light';
  
  const themeMapping = {
    'blue': 'blue-light',
    'green': 'green-light',
    'dark': 'purple-dark'
  };
  
  if (themeMapping[savedTheme]) {
    savedTheme = themeMapping[savedTheme];
    localStorage.setItem('theme', savedTheme);
  }
  
  document.documentElement.setAttribute('data-theme', savedTheme);

  qa('.theme-color-box').forEach(box => {
    const theme = box.dataset.theme;
    
    if (theme === savedTheme) {
      box.classList.add('active');
    }
    
    box.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      qa('.theme-color-box').forEach(b => b.classList.remove('active'));
      box.classList.add('active');
    });
  });
}

// =============================================================================
// 設定メニューアコーディオン
// =============================================================================

function initSettingsAccordion() {
  qa('.settings-section-header').forEach(header => {
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      const section = header.parentElement;
      const wasActive = section.classList.contains('active');
      
      const menu = header.closest('.settings-menu');
      if (menu) {
        menu.querySelectorAll('.settings-section').forEach(s => {
          s.classList.remove('active');
        });
      }
      
      if (!wasActive) {
        section.classList.add('active');
      }
    });
  });

  const firstSection = q('.settings-section');
  if (firstSection) {
    firstSection.classList.add('active');
  }
}

// =============================================================================
// ランキング行のアニメーション
// =============================================================================

function initRankingAnimations() {
  // ランキング行を順番にフェードイン
  const rows = qa('.ranking-row');
  rows.forEach((row, index) => {
    row.style.opacity = '0';
    row.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      row.style.transition = 'all 0.5s ease';
      row.style.opacity = '1';
      row.style.transform = 'translateY(0)';
    }, index * 50);
  });
}

// =============================================================================
// 自分の順位カードのアニメーション
// =============================================================================

function initMyRankAnimation() {
  const myRankItems = qa('.my-rank-item');
  myRankItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      item.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
      item.style.opacity = '1';
      item.style.transform = 'scale(1)';
    }, index * 150);
  });
}

// =============================================================================
// 順位の数字カウントアップアニメーション
// =============================================================================

function animateRankNumber(element, targetValue) {
  const duration = 1000;
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // イージング関数（ease-out）
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(start + (targetValue - start) * easeOut);
    
    element.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = targetValue;
    }
  }
  
  requestAnimationFrame(update);
}

function initRankCountUp() {
  qa('.rank-number').forEach(rankElement => {
    const targetValue = parseInt(rankElement.textContent);
    if (!isNaN(targetValue) && targetValue > 0) {
      animateRankNumber(rankElement, targetValue);
    }
  });
}

// =============================================================================
// スクロール時の視覚効果
// =============================================================================

function initScrollEffects() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1
  });
  
  qa('.ranking-card').forEach(card => {
    observer.observe(card);
  });
}

// =============================================================================
// 初期化
// =============================================================================

function init() {
  initTheme();
  initSettingsAccordion();
  
  // アニメーション初期化（少し遅延させる）
  setTimeout(() => {
    initMyRankAnimation();
    initRankCountUp();
    initRankingAnimations();
    initScrollEffects();
  }, 100);
}

// ページ読み込み時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}