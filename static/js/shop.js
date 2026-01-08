// =============================================================================
// ユーティリティ関数
// =============================================================================

const q = (sel) => document.querySelector(sel);
const qa = (sel) => document.querySelectorAll(sel);

// =============================================================================
// テーマ管理
// =============================================================================

function initTheme() {
  // デフォルトテーマの設定（既存テーマからの移行対応）
  let savedTheme = localStorage.getItem('theme') || 'blue-light';
  
  // 既存テーマ名からの変換
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

  // すべてのテーマボックスにイベントリスナーを追加
  qa('.theme-color-box').forEach(box => {
    const theme = box.dataset.theme;
    
    // 現在のテーマに active クラスを追加
    if (theme === savedTheme) {
      box.classList.add('active');
    }
    
    // クリックイベント
    box.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // テーマを適用
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      // すべてのボックスから active を削除
      qa('.theme-color-box').forEach(b => b.classList.remove('active'));
      
      // クリックされたボックスに active を追加
      box.classList.add('active');
    });
  });
}

// =============================================================================
// ペット名管理
// =============================================================================

function initPetName() {
  const petName = localStorage.getItem('petName') || '';
  if (petName) q('#pet-name-input').value = petName;
  
  q('#pet-name-input').addEventListener('input', (e) => {
    localStorage.setItem('petName', e.target.value);
  });
}

// =============================================================================
// 経験値バー更新
// =============================================================================

function updateExpBar(currentExp, requiredExp) {
  const expDisplay = q('#exp-display');
  const expBarFill = q('#exp-bar-fill');
  
  if (expDisplay && expBarFill) {
    expDisplay.textContent = `${currentExp} / ${requiredExp}`;
    const percentage = requiredExp > 0 ? (currentExp / requiredExp * 100) : 0;
    expBarFill.style.width = `${Math.min(percentage, 100)}%`;
  }
}

// =============================================================================
// UI更新関数
// =============================================================================

function updateUI(data) {
  if (data.message) {
    q('#pet-message').textContent = data.message;
  }
  
  if (data.coins !== undefined) {
    const coinCount = q('#coin-count');
    if (coinCount) coinCount.textContent = data.coins;
    
    const headerCoinCount = q('#header-coin-count');
    if (headerCoinCount) headerCoinCount.textContent = data.coins;
  }
  
  if (data.inventory) {
    Object.entries(data.inventory).forEach(([foodName, count]) => {
      const countEl = document.querySelector(`.food-count[data-food="${foodName}"]`);
      if (countEl) countEl.textContent = count;
    });
  }
  
  if (data.image) {
    // ★重要: 画像URLにタイムスタンプを追加してキャッシュを回避
    const timestamp = Date.now();
    q('#pet-img').src = `/static/images/${data.image}?t=${timestamp}`;
  }
  
  if (data.level !== undefined) {
    q('#level-label').textContent = `Lv.${data.level}`;
  }
  
  if (data.exp !== undefined && data.next_exp !== undefined) {
    updateExpBar(data.exp, data.next_exp);
  }
  
  if (data.coins !== undefined) {
    qa('.buy-btn').forEach(btn => {
      const price = parseInt(btn.dataset.price);
      btn.disabled = data.coins < price;
    });
  }
}

// =============================================================================
// レベルアップモーダル制御
// =============================================================================

const EVOLUTION_WEIGHTS = {
  1: { 1: 18, 2: 13, 3: 13, 4: 13, 5: 8, 6: 8, 7: 8, 8: 8, 9: 8, 10: 3 },
  2: { 1: 30, 2: 25, 3: 20, 4: 8, 5: 4 },
  3: { 1: 30, 2: 15, 3: 10, 4: 7, 5: 5 },
  4: { 1: 30, 2: 15, 3: 10, 4: 7, 5: 5 },
  5: { 1: 30, 2: 25, 3: 15, 4: 7, 5: 5 },
  6: { 1: 30, 2: 25, 3: 10, 4: 7, 5: 3 }
};

function calculateRarity(petType, evolutionType) {
  const weights = EVOLUTION_WEIGHTS[petType];
  if (!weights) return null;
  
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const probability = (weights[evolutionType] / totalWeight) * 100;
  
  if (probability <= 5) return 5;
  if (probability <= 10) return 4;
  if (probability <= 15) return 3;
  if (probability <= 25) return 2;
  return 1;
}

function showLevelUpModal({ oldLevel, newLevel, petImage, petType, evolution, levelsGained = 1 }) {
  const modal = q('#levelupModal');
  const content = q('#levelupContent');
  const levelFrom = q('#levelupLevelFrom');
  const levelTo = q('#levelupLevelTo');
  const petImg = q('#levelupPetImage');
  const message = q('#levelupMessage');
  const evolutionTypeDiv = q('#levelupEvolutionType');
  const rarityDiv = q('#levelupRarity');
  const sparklesContainer = q('#levelupSparkles');
  
  if (!modal) return;
  
  levelFrom.textContent = `Lv.${oldLevel}`;
  levelTo.textContent = `Lv.${newLevel}`;
  petImg.src = `/static/images/${petImage}`;
  
  const isFinalEvolution = (petType === 1 && newLevel === 10) || (petType !== 1 && newLevel === 5);
  
  if (isFinalEvolution) {
    content.classList.add('final-evolution');
    evolutionTypeDiv.style.display = 'block';
    evolutionTypeDiv.textContent = `タイプ${evolution}に進化!`;
    
    const rarity = calculateRarity(petType, evolution);
    if (rarity) {
      rarityDiv.style.display = 'flex';
      rarityDiv.setAttribute('data-rarity', rarity);
      rarityDiv.innerHTML = '';
      for (let i = 0; i < rarity; i++) {
        const star = document.createElement('span');
        star.className = 'rarity-star';
        star.textContent = '★';
        rarityDiv.appendChild(star);
      }
    }
    
    if (levelsGained > 1) {
      message.innerHTML = `<strong>最終進化!</strong><br>${levelsGained}レベルアップ!おめでとう!`;
    } else {
      message.innerHTML = `<strong>最終進化!</strong><br>おめでとう!`;
    }
  } else {
    content.classList.remove('final-evolution');
    evolutionTypeDiv.style.display = 'none';
    rarityDiv.style.display = 'none';
    
    if (levelsGained > 1) {
      message.textContent = `すごい!${levelsGained}レベルアップしたよ!`;
    } else {
      message.textContent = 'おめでとう!レベルアップしたよ!';
    }
  }
  
  sparklesContainer.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.animationDelay = `${Math.random() * 2}s`;
    sparkle.style.animationDuration = `${2 + Math.random() * 2}s`;
    sparklesContainer.appendChild(sparkle);
  }
  
  if (isFinalEvolution) {
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.animationDelay = `${Math.random() * 3}s`;
      confetti.style.animationDuration = `${3 + Math.random() * 2}s`;
      confetti.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
      sparklesContainer.appendChild(confetti);
    }
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLevelUpModal() {
  const modal = q('#levelupModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function initLevelUpModal() {
  const closeBtn = q('#levelupCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', async () => {
      closeLevelUpModal();
      
      // ★重要: モーダルを閉じた後、少し待機してからリロード
      await new Promise(resolve => setTimeout(resolve, 100));
      location.reload();
    });
  }
  
  const backdrop = q('.levelup-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', async () => {
      closeLevelUpModal();
      
      // ★重要: モーダルを閉じた後、少し待機してからリロード
      await new Promise(resolve => setTimeout(resolve, 100));
      location.reload();
    });
  }
  
  document.addEventListener('keydown', (e) => {
    const modal = q('#levelupModal');
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeLevelUpModal();
      
      // ★重要: モーダルを閉じた後、少し待機してからリロード
      setTimeout(() => {
        location.reload();
      }, 100);
    }
  });
}

// 個数選択の初期化
function initQuantitySelectors() {
  // プラスボタン
  qa('.quantity-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const foodName = btn.dataset.food;
      const input = document.querySelector(`.quantity-input[data-food="${foodName}"]`);
      const currentValue = parseInt(input.value) || 1;
      const newValue = Math.min(currentValue + 1, 999);
      input.value = newValue;
      updateTotalPrice(foodName);
    });
  });
  
  // マイナスボタン
  qa('.quantity-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const foodName = btn.dataset.food;
      const input = document.querySelector(`.quantity-input[data-food="${foodName}"]`);
      const currentValue = parseInt(input.value) || 1;
      const newValue = Math.max(currentValue - 1, 1);
      input.value = newValue;
      updateTotalPrice(foodName);
    });
  });
  
  // 入力フィールド
  qa('.quantity-input').forEach(input => {
    input.addEventListener('input', () => {
      let value = parseInt(input.value) || 1;
      value = Math.max(1, Math.min(value, 999));
      input.value = value;
      updateTotalPrice(input.dataset.food);
    });
    
    input.addEventListener('blur', () => {
      if (!input.value || parseInt(input.value) < 1) {
        input.value = 1;
        updateTotalPrice(input.dataset.food);
      }
    });
  });
}

// 合計金額の更新
function updateTotalPrice(foodName) {
  const input = document.querySelector(`.quantity-input[data-food="${foodName}"]`);
  const buyBtn = document.querySelector(`.buy-btn[data-food="${foodName}"]`);
  const totalPriceEl = document.querySelector(`.total-price[data-food="${foodName}"] .total-amount`);
  
  const quantity = parseInt(input.value) || 1;
  const unitPrice = parseInt(buyBtn.dataset.price);
  const totalPrice = quantity * unitPrice;
  
  totalPriceEl.textContent = totalPrice;
  
  // コイン残高チェック
  const coinCount = parseInt(q('#coin-count').textContent) || 0;
  buyBtn.disabled = coinCount < totalPrice;
}

// 購入処理の修正（既存のinitBuyButtons関数を置き換え）
function initBuyButtons() {
  qa('.buy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const foodName = btn.dataset.food;
      const input = document.querySelector(`.quantity-input[data-food="${foodName}"]`);
      const quantity = parseInt(input.value) || 1;
      const unitPrice = parseInt(btn.dataset.price);
      const totalPrice = quantity * unitPrice;
      
      // コイン残高チェック
      const currentCoins = parseInt(q('#coin-count').textContent) || 0;
      if (currentCoins < totalPrice) {
        alert('コインが足りません');
        return;
      }
      
      try {
        btn.disabled = true;
        btn.textContent = '購入中...';
        
        const res = await fetch('/buy_food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            food_name: foodName,
            quantity: quantity  // 個数を追加
          })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
          updateUI(data);
          
          // 購入後は個数を1にリセット
          input.value = 1;
          updateTotalPrice(foodName);
          
          // 成功メッセージ
          btn.textContent = '購入完了！';
          setTimeout(() => {
            btn.textContent = '購入';
            btn.disabled = false;
          }, 1000);
        } else {
          alert(data.error || '購入に失敗しました');
          btn.textContent = '購入';
          btn.disabled = false;
        }
      } catch (err) {
        console.error('エラー:', err);
        alert('通信エラーが発生しました');
        btn.textContent = '購入';
        btn.disabled = false;
      }
    });
  });
}

// =============================================================================
// 購入処理
// =============================================================================

function initBuyButtons() {
  qa('.buy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const foodName = btn.dataset.food;
      const price = parseInt(btn.dataset.price);
      
      try {
        const res = await fetch('/buy_food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ food_name: foodName })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
          updateUI(data);
        } else {
          alert(data.error || '購入に失敗しました');
        }
      } catch (err) {
        console.error('エラー:', err);
        alert('通信エラーが発生しました');
      }
    });
  });
}

// =============================================================================
// 餌やり処理
// =============================================================================


function initFeedButtons() {
  qa('.feed-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const foodName = btn.dataset.food;
      const levelLabel = q('#level-label');
      const currentLevel = levelLabel ? parseInt(levelLabel.textContent.replace('Lv.', '')) : 0;
      
      // ボタンを一時的に無効化
      btn.disabled = true;
      btn.style.opacity = '0.6';
      
      try {
        const res = await fetch('/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ food_name: foodName })
        });
        
        const data = await res.json();
        
        if (data.levels_gained !== undefined && data.levels_gained > 0) {
          // ★重要: レベルアップした場合
          if (data.image) {
            localStorage.setItem('lastDiscoveredPet', data.image);
          }
          
          // ★重要: 少し待機してからモーダル表示（データベース同期を保証）
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // ★重要: 画像のキャッシュを回避するためタイムスタンプ付きで取得
          const timestamp = Date.now();
          const imageWithCache = `${data.image}?t=${timestamp}`;
          
          showLevelUpModal({
            oldLevel: data.start_level,
            newLevel: data.level,
            petImage: imageWithCache, // キャッシュバスター付き
            petType: data.pet_type || 1,
            evolution: data.evolution || 1,
            levelsGained: data.levels_gained
          });
        } else {
          // ★重要: レベルアップしていない場合
          updateUI(data);
          btn.disabled = false;
          btn.style.opacity = '1';
        }
      } catch (err) {
        console.error('エラー:', err);
        alert('餌やりに失敗しました');
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    });
  });
}

// =============================================================================
// 初期化
// =============================================================================

function init() {
  initTheme();
  initPetName();
  initBuyButtons();
  initFeedButtons();
  initLevelUpModal();
  initQuantitySelectors();
}

init();