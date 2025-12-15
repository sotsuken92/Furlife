// =============================================================================
// モバイルUI拡張スクリプト
// calendar.jsの後に読み込んでください
// =============================================================================

(function() {
  'use strict';
  
  // =============================================================================
  // ユーティリティ関数
  // =============================================================================
  
  const isMobile = () => window.innerWidth <= 768;
  
  const createElement = (tag, className, content) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content) el.innerHTML = content;
    return el;
  };
  
  // =============================================================================
  // ボトムナビゲーションの生成
  // =============================================================================
  
  function createBottomNav() {
    const currentPath = window.location.pathname;
    
    const nav = createElement('nav', 'bottom-nav');
    const items = createElement('div', 'bottom-nav-items');
    
    const navItems = [
      { href: '/', icon: '📅', label: 'カレンダー', path: '/' },
      { href: '/pet', icon: '🐾', label: 'ペット', path: '/pet' },
      { href: '/shop', icon: '🛒', label: 'ショップ', path: '/shop' }
    ];
    
    navItems.forEach(item => {
      const isActive = currentPath === item.path || 
                      (item.path === '/' && currentPath.startsWith('/calendar'));
      
      const link = createElement('a', `bottom-nav-item ${isActive ? 'active' : ''}`, `
        <div class="bottom-nav-icon">${item.icon}</div>
        <div class="bottom-nav-label">${item.label}</div>
      `);
      link.href = item.href;
      items.appendChild(link);
    });
    
    nav.appendChild(items);
    document.body.appendChild(nav);
  }
  
  // =============================================================================
  // ハンバーガーメニューの生成
  // =============================================================================
  
  function createHamburgerMenu() {
    // ハンバーガーボタン
    const hamburger = createElement('button', 'mobile-hamburger', `
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    `);
    
    // オーバーレイ
    const overlay = createElement('div', 'mobile-menu-overlay');
    
    // メニュー本体
    const menu = createElement('div', 'mobile-menu');
    
    // ユーザー情報の取得
    const username = document.querySelector('.user-info')?.textContent.replace('さん', '') || 'ゲスト';
    const coins = document.querySelector('#header-coin-count')?.textContent || '0';
    
    menu.innerHTML = `
      <div class="mobile-menu-header">
        <div class="mobile-menu-user-icon">${username.charAt(0)}</div>
        <div class="mobile-menu-user-info">
          <div class="mobile-menu-username">${username}</div>
          <div class="mobile-menu-coins">
            <img src="/static/images/coin/coin.jpg" alt="コイン">
            <span>${coins}</span>
          </div>
        </div>
      </div>
      
      <div class="mobile-menu-section">
        <div class="mobile-menu-section-title">テーマ</div>
        <div class="mobile-theme-options">
          <div class="mobile-menu-item theme-option" data-theme="blue">
            <span class="mobile-menu-item-icon">🔵</span>
            <span>ライトブルー</span>
          </div>
          <div class="mobile-menu-item theme-option" data-theme="green">
            <span class="mobile-menu-item-icon">🟢</span>
            <span>ライトグリーン</span>
          </div>
          <div class="mobile-menu-item theme-option" data-theme="dark">
            <span class="mobile-menu-item-icon">🌙</span>
            <span>ダークモード</span>
          </div>
        </div>
      </div>
      
      <div class="mobile-menu-section">
        <div class="mobile-menu-section-title">その他</div>
        <a href="/" class="mobile-menu-item">
          <span class="mobile-menu-item-icon">📅</span>
          <span>カレンダー</span>
        </a>
        <a href="/pet" class="mobile-menu-item">
          <span class="mobile-menu-item-icon">🐾</span>
          <span>ペット詳細</span>
        </a>
        <a href="/shop" class="mobile-menu-item">
          <span class="mobile-menu-item-icon">🛒</span>
          <span>ショップ</span>
        </a>
      </div>
      
      <button class="mobile-logout-btn" onclick="location.href='/logout'">ログアウト</button>
    `;
    
    // イベントリスナー
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      menu.classList.toggle('active');
      overlay.classList.toggle('active');
      document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });
    
    overlay.addEventListener('click', () => {
      hamburger.classList.remove('active');
      menu.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
    
    // テーマ切り替え
    menu.querySelectorAll('.theme-option').forEach(option => {
      const savedTheme = localStorage.getItem('theme') || 'blue';
      if (option.dataset.theme === savedTheme) {
        option.style.background = 'var(--accent-primary)';
        option.style.color = 'white';
      }
      
      option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        menu.querySelectorAll('.theme-option').forEach(opt => {
          opt.style.background = '';
          opt.style.color = '';
        });
        option.style.background = 'var(--accent-primary)';
        option.style.color = 'white';
      });
    });
    
    document.body.appendChild(hamburger);
    document.body.appendChild(overlay);
    document.body.appendChild(menu);
  }
  
  // =============================================================================
  // スティッキーペットカードの生成
  // =============================================================================
  
  function createStickyPetCard() {
    const petImg = document.querySelector('#pet-img');
    const petLevel = document.querySelector('#level-label');
    const petMessage = document.querySelector('#pet-message');
    const coinCount = document.querySelector('#coin-count, #header-coin-count');
    const expDisplay = document.querySelector('#exp-display');
    const expBarFill = document.querySelector('#exp-bar-fill');
    
    if (!petImg) return;
    
    const petName = localStorage.getItem('petName') || 'ペット';
    const level = petLevel?.textContent || 'Lv.0';
    const coins = coinCount?.textContent || '0';
    const exp = expDisplay?.textContent || '0 / 0';
    const expPercentage = expBarFill?.style.width || '0%';
    
    const stickyPet = createElement('div', 'mobile-sticky-pet');
    stickyPet.innerHTML = `
      <div class="mobile-pet-compact">
        <img src="${petImg.src}" alt="ペット" class="mobile-pet-image" id="mobile-pet-img">
        <div class="mobile-pet-info">
          <div class="mobile-pet-name" id="mobile-pet-name">${petName}</div>
          <div class="mobile-pet-stats">
            <span class="mobile-pet-level" id="mobile-pet-level">${level}</span>
            <span class="mobile-pet-coins">
              <img src="/static/images/coin/coin.jpg" alt="コイン">
              <span id="mobile-coin-count">${coins}</span>
            </span>
          </div>
          <div class="mobile-exp-bar-mini">
            <div class="mobile-exp-bar-bg">
              <div class="mobile-exp-bar-fill" id="mobile-exp-bar-fill" style="width: ${expPercentage}"></div>
            </div>
          </div>
        </div>
        <button class="mobile-pet-expand-btn" id="mobile-pet-expand">⋮</button>
      </div>
    `;
    
    // カレンダータイトルの後に挿入
    const calendarTitle = document.querySelector('.calendar-title');
    if (calendarTitle) {
      calendarTitle.after(stickyPet);
    } else {
      document.querySelector('.container')?.prepend(stickyPet);
    }
    
    // ペット画像クリックで詳細へ
    stickyPet.querySelector('#mobile-pet-img')?.addEventListener('click', () => {
      window.location.href = '/pet';
    });
    
    // 展開ボタンでモーダル表示
    stickyPet.querySelector('#mobile-pet-expand')?.addEventListener('click', () => {
      showMobilePetModal();
    });
    
    // 元のペットカードの更新を監視して同期
    syncPetCardUpdates();
  }
  
  // =============================================================================
  // モバイルペット詳細モーダルの生成
  // =============================================================================
  
  function showMobilePetModal() {
    // 既存のモーダルを削除
    document.querySelector('.mobile-pet-modal')?.remove();
    document.querySelector('.mobile-pet-modal-overlay')?.remove();
    
    const modal = createElement('div', 'mobile-pet-modal');
    const overlay = createElement('div', 'mobile-menu-overlay mobile-pet-modal-overlay');
    
    // ペット情報を取得
    const petImg = document.querySelector('#pet-img, #pet-img-large');
    const petMessage = document.querySelector('#pet-message');
    const coinCount = document.querySelector('#coin-count, #header-coin-count');
    const inventory = document.querySelector('.inventory-card, .status-table');
    
    modal.innerHTML = `
      <div class="swipe-indicator"></div>
      <div class="mobile-pet-modal-header">
        <div class="mobile-pet-modal-title">🐾 ペット情報</div>
        <button class="mobile-pet-modal-close">✕</button>
      </div>
      <div class="mobile-pet-modal-content">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${petImg?.src || ''}" alt="ペット" style="max-width: 200px; width: 100%;">
        </div>
        <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <p style="font-size: 0.938rem; color: var(--text-secondary); line-height: 1.6;">
            ${petMessage?.textContent || 'ペットの情報がありません'}
          </p>
        </div>
        <div style="text-align: center;">
          <button class="btn btn-primary" onclick="location.href='/pet'" style="width: 100%; max-width: 300px;">
            詳細ページへ
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    // アニメーション開始
    setTimeout(() => {
      modal.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }, 10);
    
    // 閉じる処理
    const closeModal = () => {
      modal.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => {
        modal.remove();
        overlay.remove();
      }, 300);
    };
    
    modal.querySelector('.mobile-pet-modal-close')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // スワイプで閉じる
    let touchStartY = 0;
    modal.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });
    
    modal.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY;
      if (deltaY > 0 && modal.scrollTop === 0) {
        modal.style.transform = `translateY(${deltaY}px)`;
      }
    });
    
    modal.addEventListener('touchend', (e) => {
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      if (deltaY > 100) {
        closeModal();
      } else {
        modal.style.transform = 'translateY(0)';
      }
    });
  }
  
  // =============================================================================
  // ペットカードの更新を同期
  // =============================================================================
  
  function syncPetCardUpdates() {
    // MutationObserverでペットカードの変更を監視
    const petImg = document.querySelector('#pet-img');
    const petLevel = document.querySelector('#level-label');
    const coinCount = document.querySelector('#coin-count, #header-coin-count');
    const expBarFill = document.querySelector('#exp-bar-fill');
    
    const updateMobilePet = () => {
      const mobilePetImg = document.querySelector('#mobile-pet-img');
      const mobilePetLevel = document.querySelector('#mobile-pet-level');
      const mobileCoinCount = document.querySelector('#mobile-coin-count');
      const mobileExpBarFill = document.querySelector('#mobile-exp-bar-fill');
      const mobilePetName = document.querySelector('#mobile-pet-name');
      
      if (mobilePetImg && petImg) mobilePetImg.src = petImg.src;
      if (mobilePetLevel && petLevel) mobilePetLevel.textContent = petLevel.textContent;
      if (mobileCoinCount && coinCount) mobileCoinCount.textContent = coinCount.textContent;
      if (mobileExpBarFill && expBarFill) mobileExpBarFill.style.width = expBarFill.style.width;
      
      // ペット名の更新
      const petName = localStorage.getItem('petName') || 'ペット';
      if (mobilePetName) mobilePetName.textContent = petName;
    };
    
    // 初期同期
    updateMobilePet();
    
    // 定期的に同期（1秒ごと）
    setInterval(updateMobilePet, 1000);
    
    // LocalStorageの変更を監視（ペット名）
    window.addEventListener('storage', (e) => {
      if (e.key === 'petName') {
        updateMobilePet();
      }
    });
  }
  
  // =============================================================================
  // フォーム入力の最適化
  // =============================================================================
  
  function optimizeFormInputs() {
    if (!isMobile()) return;
    
    // 時間入力フィールドを横並びにする
    const startTimeGroup = document.querySelector('label[for="startTimeInput"]')?.parentElement;
    const endTimeGroup = document.querySelector('label[for="endTimeInput"]')?.parentElement;
    
    if (startTimeGroup && endTimeGroup) {
      // 既に処理済みかチェック
      if (startTimeGroup.parentElement?.classList.contains('time-inputs-row')) return;
      
      // ラッパーを作成
      const wrapper = createElement('div', 'time-inputs-row');
      
      // 開始時間グループをラッパーに移動
      const parent = startTimeGroup.parentElement;
      parent.insertBefore(wrapper, startTimeGroup);
      wrapper.appendChild(startTimeGroup);
      wrapper.appendChild(endTimeGroup);
      
      // ラベルを短縮
      const startLabel = startTimeGroup.querySelector('label');
      const endLabel = endTimeGroup.querySelector('label');
      if (startLabel) startLabel.textContent = '開始';
      if (endLabel) endLabel.textContent = '終了';
    }
  }
  
  function initMobileUI() {
    if (!isMobile()) return;
    
    createBottomNav();
    createHamburgerMenu();
    createStickyPetCard();
    optimizeFormInputs();
    
    // フォームが表示されたときにも最適化を実行
    const formCard = document.querySelector('.form-card');
    if (formCard) {
      const observer = new MutationObserver(() => {
        if (!formCard.classList.contains('hidden')) {
          optimizeFormInputs();
        }
      });
      observer.observe(formCard, { attributes: true, attributeFilter: ['class'] });
    }
    
    // リサイズ時の再初期化
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!isMobile()) {
          // PCサイズに戻ったらモバイルUIを削除
          document.querySelector('.bottom-nav')?.remove();
          document.querySelector('.mobile-hamburger')?.remove();
          document.querySelector('.mobile-menu')?.remove();
          document.querySelector('.mobile-menu-overlay')?.remove();
          document.querySelector('.mobile-sticky-pet')?.remove();
          document.body.style.overflow = '';
        }
      }, 250);
    });
  }
  
  // DOMContentLoaded後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileUI);
  } else {
    initMobileUI();
  }
  
})();