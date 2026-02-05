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
// タブ切り替え
// =============================================================================

function initTabs() {
  qa('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      // 全てのタブボタンとコンテンツから active を削除
      qa('.tab-btn').forEach(b => b.classList.remove('active'));
      qa('.tab-content').forEach(c => c.classList.remove('active'));
      
      // クリックされたタブをアクティブに
      btn.classList.add('active');
      q(`#tab-${tabName}`).classList.add('active');
    });
  });
}

// =============================================================================
// カウントダウンタイマー
// =============================================================================

function startCountdowns() {
  const countdowns = qa('.countdown');
  
  countdowns.forEach(countdown => {
    const endSeconds = parseInt(countdown.dataset.endSeconds);
    let remaining = endSeconds;
    
    const updateCountdown = () => {
      if (remaining <= 0) {
        countdown.innerHTML = '<span class="time-expired">終了</span>';
        return;
      }
      
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      
      let html = '';
      
      if (days > 0) {
        html += `<span class="time-part"><span class="time-num">${days}</span>日</span>`;
      }
      
      html += `<span class="time-part"><span class="time-num">${hours}</span>時間</span>`;
      html += `<span class="time-part"><span class="time-num">${minutes}</span>分</span>`;
      
      // 残り1時間未満の場合は秒も表示
      if (remaining < 3600) {
        html += `<span class="time-part"><span class="time-num">${seconds}</span>秒</span>`;
      }
      
      countdown.innerHTML = html;
      remaining--;
    };
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
  });
}

// =============================================================================
// ソート・フィルター機能
// =============================================================================

function initFilters() {
  const sortSelect = q('#sort-select');
  const rarityFilter = q('#rarity-filter');
  const auctionList = q('#auction-list');
  
  if (!sortSelect || !rarityFilter || !auctionList) return;
  
  const applyFilters = () => {
    const cards = Array.from(qa('.auction-card'));
    const sortValue = sortSelect.value;
    const rarityValue = rarityFilter.value;
    
    // フィルタリング
    cards.forEach(card => {
      const rarity = parseInt(card.dataset.rarity);
      
      if (rarityValue === 'all' || rarity === parseInt(rarityValue)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
    
    // ソート
    const visibleCards = cards.filter(card => card.style.display !== 'none');
    
    visibleCards.sort((a, b) => {
      switch (sortValue) {
        case 'ending-soon':
          return parseInt(a.dataset.time) - parseInt(b.dataset.time);
        case 'price-low':
          return parseInt(a.dataset.price) - parseInt(b.dataset.price);
        case 'price-high':
          return parseInt(b.dataset.price) - parseInt(a.dataset.price);
        case 'rarity-high':
          return parseInt(b.dataset.rarity) - parseInt(a.dataset.rarity);
        default:
          return 0;
      }
    });
    
    // 並び替え後に再配置
    visibleCards.forEach(card => auctionList.appendChild(card));
  };
  
  sortSelect.addEventListener('change', applyFilters);
  rarityFilter.addEventListener('change', applyFilters);
}

// =============================================================================
// 手数料計算
// =============================================================================

function initFeeCalculator() {
  const startingPriceInput = q('#starting-price');
  const feeDisplay = q('#fee-display');
  
  if (!startingPriceInput || !feeDisplay) return;
  
  startingPriceInput.addEventListener('input', () => {
    const price = parseInt(startingPriceInput.value) || 0;
    const fee = Math.floor(price * 0.05);
    feeDisplay.textContent = fee;
  });
}

// =============================================================================
// 出品機能
// =============================================================================

function initCreateAuction() {
  const createBtn = q('#btn-create-auction');
  
  if (!createBtn) return;
  
  createBtn.addEventListener('click', async () => {
    const startingPrice = parseInt(q('#starting-price').value);
    const duration = q('input[name="duration"]:checked').value;
    
    if (!startingPrice || startingPrice < 1) {
      alert('開始価格を入力してください');
      return;
    }
    
    const fee = Math.floor(startingPrice * 0.05);
    
    if (!confirm(`${startingPrice}コインで出品しますか？\n手数料: ${fee}コイン\n\n⚠️ 現在のペットは卵に戻ります`)) {
      return;
    }
    
    try {
      createBtn.disabled = true;
      createBtn.textContent = '出品中...';
      
      const response = await fetch('/api/auction/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starting_price: startingPrice,
          duration: duration
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(data.message);
        location.reload();
      } else {
        alert(data.error || '出品に失敗しました');
        createBtn.disabled = false;
        createBtn.textContent = '出品する';
      }
    } catch (error) {
      console.error('Error:', error);
      alert('通信エラーが発生しました');
      createBtn.disabled = false;
      createBtn.textContent = '出品する';
    }
  });
}

// =============================================================================
// 入札モーダル
// =============================================================================

let currentAuctionId = null;
let currentPrice = 0;

function initBidModal() {
  const bidButtons = qa('.btn-bid');
  const modal = q('#bid-modal');
  const closeBtn = q('#close-bid-modal');
  const cancelBtn = q('#cancel-bid');
  const confirmBtn = q('#confirm-bid');
  const bidAmountInput = q('#bid-amount');
  const quickBidButtons = qa('.btn-quick-bid');
  
  if (!modal) return;
  
  // 入札ボタンクリック
  bidButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentAuctionId = btn.dataset.auctionId;
      currentPrice = parseInt(btn.dataset.currentPrice);
      
      q('#modal-current-price').textContent = currentPrice;
      bidAmountInput.value = currentPrice + 10;
      bidAmountInput.min = currentPrice + 1;
      
      modal.classList.add('active');
    });
  });
  
  // モーダルを閉じる
  const closeModal = () => {
    modal.classList.remove('active');
  };
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // モーダル外クリックで閉じる
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // クイック入札ボタン
  quickBidButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const add = parseInt(btn.dataset.add);
      const current = parseInt(bidAmountInput.value) || currentPrice;
      bidAmountInput.value = current + add;
    });
  });
  
  // 入札確定
  confirmBtn.addEventListener('click', async () => {
    const bidAmount = parseInt(bidAmountInput.value);
    
    if (bidAmount <= currentPrice) {
      alert(`入札額は${currentPrice + 1}コイン以上である必要があります`);
      return;
    }
    
    if (!confirm(`${bidAmount}コインで入札しますか？`)) {
      return;
    }
    
    try {
      confirmBtn.disabled = true;
      confirmBtn.textContent = '入札中...';
      
      const response = await fetch('/api/auction/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auction_id: currentAuctionId,
          amount: bidAmount
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(data.message);
        
        // ヘッダーのコイン表示を更新
        const headerCoinCount = q('#header-coin-count');
        if (headerCoinCount) {
          headerCoinCount.textContent = data.coins;
        }
        
        // モーダルのコイン表示を更新
        q('#modal-user-coins').textContent = data.coins;
        
        closeModal();
        location.reload();
      } else {
        alert(data.error || '入札に失敗しました');
        confirmBtn.disabled = false;
        confirmBtn.textContent = '入札';
      }
    } catch (error) {
      console.error('Error:', error);
      alert('通信エラーが発生しました');
      confirmBtn.disabled = false;
      confirmBtn.textContent = '入札';
    }
  });
}

// =============================================================================
// オークションキャンセル
// =============================================================================

function initCancelButtons() {
  qa('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', async () => {
      const auctionId = btn.dataset.auctionId;
      
      if (!confirm('オークションをキャンセルしますか？\n⚠️ 手数料は返金されません')) {
        return;
      }
      
      try {
        btn.disabled = true;
        btn.textContent = 'キャンセル中...';
        
        const response = await fetch('/api/auction/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auction_id: auctionId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert(data.message);
          location.reload();
        } else {
          alert(data.error || 'キャンセルに失敗しました');
          btn.disabled = false;
          btn.textContent = 'キャンセル';
        }
      } catch (error) {
        console.error('Error:', error);
        alert('通信エラーが発生しました');
        btn.disabled = false;
        btn.textContent = 'キャンセル';
      }
    });
  });
}

// =============================================================================
// アニメーション
// =============================================================================

function initAnimations() {
  // カードのフェードイン
  const cards = qa('.auction-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'all 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 50);
  });
}

// =============================================================================
// 定期的なオークション終了チェック
// =============================================================================

function startPeriodicCheck() {
  // 5分ごとにオークション終了処理をチェック
  setInterval(async () => {
    try {
      await fetch('/api/auction/finalize', { method: 'POST' });
    } catch (error) {
      console.error('Finalize check error:', error);
    }
  }, 5 * 60 * 1000);
}

// =============================================================================
// 初期化
// =============================================================================

function init() {
  initTheme();
  initSettingsAccordion();
  initTabs();
  startCountdowns();
  initFilters();
  initFeeCalculator();
  initCreateAuction();
  initBidModal();
  initCancelButtons();
  initAnimations();
  startPeriodicCheck();
}

// ページ読み込み時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}