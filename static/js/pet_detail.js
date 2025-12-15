// =============================================================================
// ユーティリティ関数
// =============================================================================

const q = (sel) => document.querySelector(sel);
const qa = (sel) => document.querySelectorAll(sel);

// =============================================================================
// ペット説明データ
// =============================================================================

const PET_DESCRIPTIONS = {
  // 鳥系統
  "pet1/lv1.gif": "小さくて可愛らしい雛鳥。ピヨピヨと鳴きながら成長を楽しみにしている。",
  "pet1/lv2.gif": "ふわふわの羽毛に包まれた幼鳥。好奇心旺盛で何でも興味津々。",
  "pet1/lv3.gif": "ぴょんぴょん跳ねる元気な若鳥。飛ぶ練習を始めたばかり。",
  "pet1/lv4.gif": "くるくると回転しながら飛ぶ器用な鳥。空中での動きが軽やか。",
  "pet1/lv5.gif": "もふもふの羽を持つ愛らしい成鳥。触り心地が最高。",
  "pet1/lv6.gif": "にゃんと鳴く不思議な鳥。猫のような性格を持つ。",
  "pet1/lv7.gif": "素晴らしい鳴き声を持つ美しい鳥。歌が得意。",
  "pet1/lv8.gif": "ドラゴンの特徴を持つ強力な鳥。炎を操る力がある。",
  "pet1/lv9.gif": "伝説の不死鳥。灰の中から何度でも蘇る神秘の力を持つ。",
  "pet1/lv10_type1.gif": "王者の風格を持つ最強の鳥。全てを統べる威厳がある。",
  "pet1/lv10_type2.gif": "機械と融合した未来型の鳥。テクノロジーの結晶。",
  "pet1/lv10_type3.gif": "芸術的な美しさを持つ鳥。その姿は絵画のよう。",
  "pet1/lv10_type4.gif": "藍色に輝く神秘的な鳥。次元を超える力を持つ。",
  "pet1/lv10_type5.gif": "サイケデリックな色彩を放つ鳥。見る者を魅了する。",
  "pet1/lv10_type6.gif": "幻のような存在。姿を見た者は幸運に恵まれる。",
  "pet1/lv10_type7.gif": "重装甲を纏った戦闘型の鳥。無敵の防御力を誇る。",
  "pet1/lv10_type8.gif": "最新モデルの機械鳥。高度なAIを搭載している。",
  "pet1/lv10_type9.gif": "電気を操る驚異的な鳥。雷鳴のような速さで飛ぶ。",
  "pet1/lv10_type10.gif": "見る者に幸運をもたらす、幻のレインボーチキン。",
  "pet1/death.jpg": "料理されてしまった姿。美味しそうな香りが漂う。",
  
  // 獣系統
  "pet2/lv1.gif": "ころころと転がる小さな獣。まだ歩くのも危なっかしい。",
  "pet2/lv2.gif": "ぱんぱんと跳ねる元気な幼獣。遊ぶことが大好き。",
  "pet2/lv3.gif": "ふわふわの毛並みを持つ若獣。撫でると喜ぶ。",
  "pet2/lv4.gif": "もこもこの毛玉のような獣。抱きしめたくなる可愛さ。",
  "pet2/lv5_type1.gif": "子供のおもちゃとしていたずらされた生き物",
  "pet2/lv5_type2.gif": "冷静沈着で高潔。人を試すことがあるが、心を正しく保つ者には友となる。",
  "pet2/lv5_type3.gif": "昔、時間に追われる町の菓子職人が「もっと早く仕事が片付くお菓子」を願って生まれた。以降、毎年一度だけ市場に現れ、買った者は一日中超スピードで生活できると言われる。",
  "pet2/lv5_type4.gif": "神鳥の翼を持つ古代龍。空と大地を制す伝説級の守護獣。",
  "pet2/lv5_type5.gif": "紅冠の混成王獣。翼獣と共鳴し、鋭い爪で大地すら裂く力を持つ。",
  "pet2/death.jpg": "こんがりと焼かれた姿。食欲をそそる見た目。",
  
  // 水系統
  "pet3/lv1.gif": "ぷくぷくと泡を出す小さな水棲生物。水中が大好き。",
  "pet3/lv2.gif": "ぱちゃぱちゃと水を弾く幼生。泳ぎの練習中。",
  "pet3/lv3.gif": "すいすいと泳ぐ若い水棲生物。水の流れを読む。",
  "pet3/lv4.gif": "ぐるぐると渦を巻きながら泳ぐ。水流を操る力がある。",
  "pet3/lv5_type1.gif": "水の支配者として君臨する存在。海を統べる力を持つ。",
  "pet3/lv5_type2.gif": "大海原を支配する強大な存在。波を従える。",
  "pet3/lv5_type3.gif": "潮の満ち引きを操る神秘的な存在。月の力を宿す。",
  "pet3/lv5_type4.gif": "海神の名を持つ伝説の存在。深海の秘密を知る。",
  "pet3/lv5_type5.gif": "海の怪物として恐れられる巨大な存在。無限の力を持つ。",
  "pet3/death.jpg": "干からびた姿。かつての輝きは失われた。",
  
  // 炎系統
  "pet4/lv1.gif": "小さな炎を纏う幼生。熱い情熱を持っている。",
  "pet4/lv2.gif": "ほのかに燃える若い炎の生命。温かさを感じる。",
  "pet4/lv3.gif": "もえもえと燃え上がる情熱的な存在。エネルギーに満ちている。",
  "pet4/lv4.gif": "ごうごうと燃える強力な炎。その熱は全てを溶かす。",
  "pet4/lv5_type1.gif": "炎の支配者として君臨する存在。火を自在に操る。",
  "pet4/lv5_type2.gif": "炎の王として君臨する強者。灼熱の力を持つ。",
  "pet4/lv5_type3.gif": "地獄の業火を操る恐るべき存在。全てを焼き尽くす。",
  "pet4/lv5_type4.gif": "炎を極めし者。その火は消えることがない。",
  "pet4/lv5_type5.gif": "太陽のような輝きを放つ存在。光と熱の化身。",
  "pet4/death.jpg": "灰となった姿。かつての炎は消え去った。",
  
  // 星系統
  "pet5/lv1.gif": "120円(税込み) 139kcal",
  "pet5/lv2.gif": "120円(税込み) 180kcal",
  "pet5/lv3.gif": "120円(税込み) 122kcal",
  "pet5/lv4.gif": "200円(税込み) 152kcal",
  "pet5/lv5_type1.gif": "300円(税込み) 252kcal",
  "pet5/lv5_type2.gif": "400円(税込み) 176kcal",
  "pet5/lv5_type3.gif": "銀河を統べる壮大な存在。宇宙の真理を知る。",
  "pet5/lv5_type4.gif": "宇宙そのものを体現する存在。無限の広がりを持つ。",
  "pet5/lv5_type5.gif": "星雲の美しさを持つ幻想的な存在。生命の源。",
  "pet5/death.jpg": "流れ星となった姿。美しく散っていった。",
  
  // 雑種系統
  "pet6/lv1.gif": "いろんな特徴が混ざった不思議な幼生。個性的。",
  "pet6/lv2.gif": "様々な要素が混ざり合った若い存在。予測不可能。",
  "pet6/lv3.gif": "異なる種の特徴を併せ持つ存在。ハイブリッドの力。",
  "pet6/lv4.gif": "カオスな力を秘めた存在。秩序と混沌の境界にいる。",
  "pet6/lv5_type1.gif": "古の社にのみ棲む隠れる菌獣。気配を完全に消す。",
  "pet6/lv5_type2.gif": "複数の胞子や菌糸を使い、森の暗闇を利用した戦いを得意とする",
  "pet6/lv5_type3.gif": "かつて古代の森に現れた神獣、森を腐敗させながら増殖",
  "pet6/lv5_type4.gif": "魘=悪夢の名を持つ黴の大権現。寝ている者に胞子を送り込み意識を奪う。",
  "pet6/lv5_type5.gif": "真の菌の皇として崇められる、神殿に祀られし巨大神体。",
  "pet6/death.jpg": "土に還った姿。新たな生命の糧となる。",
};

const PET_TYPE_NAMES = {
  1: "鳥系統",
  2: "獣系統",
  3: "水系統",
  4: "炎系統",
  5: "星系統",
  6: "雑種系統"
};

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
// ペット詳細モーダル
// =============================================================================

const petDetailModal = q('#petDetailModal');

function openPetDetailModal(petData) {
  const modalImage = q('#modalPetImage');
  const modalName = q('#modalPetName');
  const modalType = q('#modalPetType');
  const modalDescription = q('#modalPetDescription');
  const modal育成Count = q('#modalPet育成Count');
  const modalNumber = q('#modalPetNumber');
  const modalRarity = q('#modalPetRarity');
  
  modalImage.src = `/static/images/${petData.image}`;
  modalName.textContent = petData.name;
  modalType.textContent = PET_TYPE_NAMES[petData.petType] || '';
  modalDescription.textContent = PET_DESCRIPTIONS[petData.image] || 'このペットの詳細情報はまだありません。';
  modal育成Count.textContent = `育成回数: ${petData.育成Count}回`;
  modalNumber.textContent = `図鑑 No.${petData.number}`;
  
  // レアリティ星を表示
  if (petData.rarity && petData.rarity > 0) {
    modalRarity.innerHTML = '';
    modalRarity.setAttribute('data-rarity', petData.rarity);
    for (let i = 0; i < petData.rarity; i++) {
      const star = document.createElement('span');
      star.className = 'rarity-star';
      star.textContent = '★';
      modalRarity.appendChild(star);
    }
    modalRarity.style.display = 'flex';
  } else {
    modalRarity.style.display = 'none';
  }
  
  petDetailModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePetDetailModal() {
  petDetailModal.classList.remove('active');
  document.body.style.overflow = '';
}

function initPetDetailModal() {
  const closeBtn = q('#closePetDetailBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closePetDetailModal);
  }
  
  const backdrop = q('.pet-detail-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closePetDetailModal);
  }
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && petDetailModal.classList.contains('active')) {
      closePetDetailModal();
    }
  });
  
  qa('.pokedex-section').forEach((section, index) => {
    section.dataset.petType = index + 1;
  });
  
  let petNumber = 0;
  qa('.pokedex-item').forEach(item => {
    petNumber++;
    item.dataset.number = petNumber;
    
    if (item.classList.contains('discovered')) {
      item.addEventListener('click', () => {
        const petData = {
          image: item.dataset.image,
          name: item.dataset.name,
          petType: parseInt(item.closest('.pokedex-section').dataset.petType || '1'),
          number: parseInt(item.dataset.number),
          育成Count: parseInt(item.dataset.育成Count || '0'),
          rarity: item.dataset.rarity && item.dataset.rarity !== 'None' ? parseInt(item.dataset.rarity) : null
        };
        openPetDetailModal(petData);
      });
    }
  });
}

// =============================================================================
// ペット名管理
// =============================================================================

function initPetName() {
  const petName = localStorage.getItem('petName') || '名前未設定';
  q('#pet-name-display').textContent = petName;
}

// =============================================================================
// ペット選択モーダル
// =============================================================================

const petSelectModal = q('#petSelectModal');
let petSelectCallback = null;

function openPetSelectModal(callback) {
  petSelectCallback = callback;
  petSelectModal.classList.add('active');
}

function closePetSelectModal() {
  petSelectModal.classList.remove('active');
  petSelectCallback = null;
}

function initPetSelectModal() {
  qa('.pet-select-item').forEach(item => {
    item.addEventListener('click', () => {
      const petType = parseInt(item.dataset.petType);
      if (petSelectCallback) {
        petSelectCallback(petType);
      }
      closePetSelectModal();
    });
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

function updatePetUI(data) {
  if (data.image !== undefined) {
    q("#pet-img-large").src = `/static/images/${data.image}`;
  }
  if (data.message !== undefined) {
    q("#pet-message").textContent = data.message;
  }
  if (data.exp !== undefined && data.next_exp !== undefined) {
    updateExpBar(data.exp, data.next_exp);
  }
  if (data.inventory !== undefined) {
    updateInventory(data.inventory);
  }
}

// =============================================================================
// インベントリ更新
// =============================================================================

function updateInventory(inventory) {
  const mapping = {
    '基本の餌': 'inventory-basic',
    'おいしい餌': 'inventory-tasty',
    'プレミアム餌': 'inventory-premium',
    'スペシャル餌': 'inventory-special'
  };
  
  Object.entries(inventory).forEach(([foodName, count]) => {
    const elementId = mapping[foodName];
    if (elementId) {
      const el = q(`#${elementId}`);
      if (el) el.textContent = count;
    }
  });
}

// =============================================================================
// 餌やり機能
// =============================================================================

// 選択中の餌
let selectedFood = {
  name: '基本の餌',
  emoji: '$D83C$DF3E',
  exp: 1
};

function initFoodSelection() {
  const foodItems = qa('.compact-food-item.selectable');
  
  if (foodItems.length > 0) {
    foodItems[0].classList.add('selected');
  }
  
  foodItems.forEach(item => {
    item.addEventListener('click', () => {
      qa('.compact-food-item.selectable').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      
      selectedFood = {
        name: item.dataset.food,
        emoji: item.querySelector('.food-emoji').textContent,
        exp: parseInt(item.dataset.exp)
      };
      
      updateSelectedFoodDisplay();
    });
  });
}

function updateSelectedFoodDisplay() {
  const emojiEl = q('#selectedEmoji');
  const nameEl = q('#selectedName');
  const expEl = q('#selectedExp');
  
  if (emojiEl) emojiEl.textContent = selectedFood.emoji;
  if (nameEl) nameEl.textContent = selectedFood.name;
  if (expEl) expEl.textContent = `+${selectedFood.exp} EXP`;
}


function initFeedButton() {
  const selectedFoodDisplay = q('#selectedFoodDisplay');
  if (!selectedFoodDisplay) return;
  
  selectedFoodDisplay.addEventListener('click', async () => {
    try {
      selectedFoodDisplay.disabled = true;
      selectedFoodDisplay.style.opacity = '0.6';
      
      const res = await fetch('/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_name: selectedFood.name })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        updatePetUI(data);
        
        // レベルアップした場合のみモーダル表示
        if (data.levels_gained && data.levels_gained > 0) {
          const petType = data.pet_type || 1;
          const isFinalEvolution = (petType === 1 && data.level === 10) || (petType !== 1 && data.level === 5);
          
          // 新しく発見したペットを記録（レベルアップ時のみ）
          if (data.image) {
            localStorage.setItem('lastDiscoveredPet', data.image);
          }
          
          // スクロール位置を保存
          const pokedexSections = q('.pokedex-sections');
          if (pokedexSections) {
            localStorage.setItem('pokedexScrollPosition', pokedexSections.scrollTop);
          }
          
          // ペットタイプを保存
          const petTypeMatch = data.image.match(/^pet(\d+)\//);
          if (petTypeMatch) {
            localStorage.setItem('lastScrolledSection', petTypeMatch[1]);
          }
          
          showLevelUpModal({
            oldLevel: data.start_level || data.level - 1,
            newLevel: data.level,
            petImage: data.image,
            petType: petType,
            evolution: isFinalEvolution ? data.evolution : undefined,
            levelsGained: data.levels_gained
          });
        }
      } else {
        alert(data.message || '餌やりに失敗しました');
      }
    } catch (err) {
      console.error('エラー:', err);
      alert('餌やりに失敗しました');
    } finally {
      selectedFoodDisplay.disabled = false;
      selectedFoodDisplay.style.opacity = '1';
    }
  });
}

// =============================================================================
// ペットボタン処理
// =============================================================================

function initStartButton() {
  const startBtn = q("#start-btn");
  if (!startBtn) return;
  
  startBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    
    openPetSelectModal(async (petType) => {
      try {
        const res = await fetch("/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pet_type: petType })
        });
        const data = await res.json();
        
        if (res.ok) {
          updatePetUI(data);
          localStorage.removeItem('lastScrolledSection');
          setTimeout(() => location.reload(), 1000);
        } else {
          alert(data.error || 'エラーが発生しました');
        }
      } catch (err) {
        console.error('エラー:', err);
        alert('育成開始に失敗しました');
      }
    });
  });
}

function initReviveButton() {
  const reviveBtn = q("#revive-btn");
  if (!reviveBtn) return;
  
  reviveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    
    openPetSelectModal(async (petType) => {
      try {
        const res = await fetch("/revive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pet_type: petType })
        });
        const data = await res.json();
        
        if (res.ok) {
          updatePetUI(data);
          localStorage.removeItem('lastScrolledSection');
          setTimeout(() => location.reload(), 1000);
        } else {
          alert(data.error || 'エラーが発生しました');
        }
      } catch (err) {
        console.error('エラー:', err);
        alert('育て直しに失敗しました');
      }
    });
  });
}

function initReviveAliveButton() {
  const reviveBtnAlive = q("#revive-btn-alive");
  if (!reviveBtnAlive) return;
  
  reviveBtnAlive.addEventListener("click", async (e) => {
    e.preventDefault();
    
    openPetSelectModal(async (petType) => {
      try {
        const res = await fetch("/revive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pet_type: petType })
        });
        const data = await res.json();
        
        if (res.ok) {
          updatePetUI(data);
          localStorage.removeItem('lastScrolledSection');
          setTimeout(() => location.reload(), 1000);
        } else {
          alert(data.error || 'エラーが発生しました');
        }
      } catch (err) {
        console.error('エラー:', err);
        alert('育て直しに失敗しました');
      }
    });
  });
}

// =============================================================================
// スクロール位置の即座復元(ページ読み込み直後)
// =============================================================================

function restoreScrollPositionImmediately() {
  const lastScrolledSection = localStorage.getItem('lastScrolledSection');
  const savedScrollPos = localStorage.getItem('pokedexScrollPosition');
  const lastDiscovered = localStorage.getItem('lastDiscoveredPet');
  
  if (lastScrolledSection && savedScrollPos) {
    const pokedexSections = q('.pokedex-sections');
    if (pokedexSections) {
      // lastDiscoveredがある場合のみ条件チェック、なければ無条件で復元
      if (!lastDiscovered) {
        pokedexSections.scrollTop = parseInt(savedScrollPos);
      } else {
        const petTypeMatch = lastDiscovered.match(/^pet(\d+)\//);
        if (petTypeMatch && petTypeMatch[1] === lastScrolledSection) {
          pokedexSections.scrollTop = parseInt(savedScrollPos);
        }
      }
    }
  }
}

// =============================================================================
// 新規発見ペットへの自動スクロール
// =============================================================================

function scrollToNewDiscovery() {
  const lastDiscoveredKey = 'lastDiscoveredPet';
  const lastDiscovered = localStorage.getItem(lastDiscoveredKey);
  const lastScrolledSectionKey = 'lastScrolledSection';
  const lastScrolledSection = localStorage.getItem(lastScrolledSectionKey);
  
  if (lastDiscovered) {
    const targetItem = document.querySelector(`.pokedex-item[data-image="${lastDiscovered}"]`);
    
    if (targetItem && targetItem.classList.contains('discovered')) {
      setTimeout(() => {
        const pokedexSections = q('.pokedex-sections');
        if (pokedexSections) {
          const section = targetItem.closest('.pokedex-section');
          const sectionTitle = section.querySelector('.pokedex-section-title');
          
          if (sectionTitle) {
            const sectionsRect = pokedexSections.getBoundingClientRect();
            const titleRect = sectionTitle.getBoundingClientRect();
            const scrollOffset = pokedexSections.scrollTop;
            
            const targetScrollTop = scrollOffset + (titleRect.top - sectionsRect.top) - 10;
            
            pokedexSections.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth'
            });
          }
          
          targetItem.style.animation = 'highlight 2s ease-in-out';
          
          setTimeout(() => {
            targetItem.style.animation = '';
          }, 2000);
          
          // スクロール位置を保存
          const petType = section.dataset.petType;
          if (petType) {
            localStorage.setItem(lastScrolledSectionKey, petType);
            // スクロール完了後に位置を保存
            setTimeout(() => {
              localStorage.setItem('pokedexScrollPosition', pokedexSections.scrollTop);
            }, 600);
          }
        }
      }, 500);
      
      localStorage.removeItem(lastDiscoveredKey);
    }
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
    closeBtn.addEventListener('click', () => {
      closeLevelUpModal();
      location.reload();
    });
  }
  
  const backdrop = q('.levelup-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeLevelUpModal();
      location.reload();
    });
  }
  
  document.addEventListener('keydown', (e) => {
    const modal = q('#levelupModal');
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeLevelUpModal();
      location.reload();
    }
  });
}



// =============================================================================
// 初期化
// =============================================================================

function init() {
  // 最優先:スクロール位置を即座に復元(同じ系統の場合)
  restoreScrollPositionImmediately();
  
  // テーマ初期化
  initTheme();
  
  // ペット名初期化
  initPetName();
  
  // ペット選択モーダル初期化
  initPetSelectModal();
  
  // ペット詳細モーダル初期化
  initPetDetailModal();
  
  // レベルアップモーダル初期化
  initLevelUpModal();
  
  // ボタン初期化
  initStartButton();
  initReviveButton();
  initReviveAliveButton();
  
  // 餌やりボタン初期化
  initFoodSelection();
  initFeedButton();
  
  // 新規発見ペットへスクロール
  scrollToNewDiscovery();
}

// ページ読み込み時に初期化実行
init();