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
    
    // イージング関数(ease-out)
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
// 🎊 紙吹雪エフェクト
// =============================================================================

function createConfetti() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;

  const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3', '#ff1493', '#ffd700'];
  const confettiCount = 150;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // ランダムな位置と色
    const left = Math.random() * 100;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const duration = 3 + Math.random() * 4;
    const delay = Math.random() * 3;
    const size = 8 + Math.random() * 8;
    
    confetti.style.left = `${left}%`;
    confetti.style.background = color;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    confetti.style.animationDuration = `${duration}s`;
    confetti.style.animationDelay = `${delay}s`;
    
    // ランダムな形状
    if (Math.random() > 0.5) {
      confetti.style.borderRadius = '50%';
    }
    
    container.appendChild(confetti);
  }

  // 10秒後に紙吹雪を削除
  setTimeout(() => {
    container.innerHTML = '';
  }, 10000);
}

// =============================================================================
// 祝福演出の効果音
// =============================================================================

function playVictorySound() {
  // Web Audio APIで簡易的な勝利音を生成
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // ファンファーレ風の音を生成
    const notes = [
      { freq: 523.25, start: 0, duration: 0.2 },    // C5
      { freq: 659.25, start: 0.2, duration: 0.2 },  // E5
      { freq: 783.99, start: 0.4, duration: 0.2 },  // G5
      { freq: 1046.50, start: 0.6, duration: 0.4 }  // C6
    ];

    notes.forEach(note => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = note.freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.start);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + note.start + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.start + note.duration);
      
      oscillator.start(audioContext.currentTime + note.start);
      oscillator.stop(audioContext.currentTime + note.start + note.duration);
    });
  } catch (e) {
    console.log('Audio playback not supported');
  }
}

// =============================================================================
// 祝福演出の初期化
// =============================================================================

function initCelebration() {
  if (window.SHOW_CELEBRATION) {
    // 紙吹雪を生成
    setTimeout(() => {
      createConfetti();
    }, 500);

    // 3秒ごとに紙吹雪を追加
    const confettiInterval = setInterval(() => {
      createConfetti();
    }, 3000);

    // 30秒後に自動的に紙吹雪を停止
    setTimeout(() => {
      clearInterval(confettiInterval);
    }, 30000);

    // 効果音を鳴らす
    playVictorySound();
  }
}

// 祝福オーバーレイを閉じる関数（グローバル）
window.closeCelebration = function() {
  const overlay = document.getElementById('celebrationOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      document.body.classList.remove('celebration-mode');
    }, 500);
  }
};

// =============================================================================
// 初期化
// =============================================================================

function init() {
  initTheme();
  initSettingsAccordion();
  
  // 祝福演出の初期化
  initCelebration();
  
  // アニメーション初期化(少し遅延させる)
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