// =============================================================================
// ユーティリティ関数
// =============================================================================

const q = (sel) => document.querySelector(sel);
const qa = (sel) => document.querySelectorAll(sel);

// =============================================================================
// グローバル変数
// =============================================================================

let selectedCell = null;
let petName = localStorage.getItem('petName') || '';
let currentDisplayDate = '';
const allEvents = JSON.parse(document.getElementById('events-data').textContent);
const monthKey = document.getElementById('month-key-data').textContent;
let goalAchieved = JSON.parse(document.getElementById('goal-achieved-data').textContent);

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
// 場所管理
// =============================================================================

let locations = JSON.parse(localStorage.getItem('locations') || JSON.stringify({
  '自宅': '#3b82f6',
  '屋外': '#22c55e',
  '外(屋内)': '#f97316',
  'オンライン': '#8b5cf6',
  'その他': '#64748b'
}));

function updateLocationSelect() {
  const select = q('#locationSelect');
  if (!select) return;
  
  const currentValue = select.value;
  select.innerHTML = '<option value="">場所を選択</option>';
  
  Object.keys(locations).forEach(loc => {
    const option = document.createElement('option');
    option.value = loc;
    option.textContent = loc;
    select.appendChild(option);
  });
  
  if (currentValue) select.value = currentValue;
}

function renderSettingsLocationList() {
  const list = q('#settings-location-list');
  if (!list) return;
  
  list.innerHTML = '';
  
  Object.entries(locations).forEach(([name, color]) => {
    const item = document.createElement('div');
    item.className = 'settings-location-item';
    item.innerHTML = `
      <div class="settings-location-color" style="background: ${color};" data-name="${name}"></div>
      <div class="settings-location-name">${name}</div>
      <button class="settings-location-delete" data-name="${name}">×</button>
    `;
    list.appendChild(item);
  });
  
  qa('.settings-location-color').forEach(colorDiv => {
    colorDiv.addEventListener('click', (e) => {
      const name = e.target.dataset.name;
      openColorPicker(name);
    });
  });
  
  qa('.settings-location-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const name = btn.dataset.name;
      delete locations[name];
      localStorage.setItem('locations', JSON.stringify(locations));
      renderSettingsLocationList();
      updateLocationSelect();
    });
  });
}

function initLocationManagement() {
  const settingsAddLocationBtn = q('#settings-add-location-btn');
  if (settingsAddLocationBtn) {
    settingsAddLocationBtn.addEventListener('click', () => {
      const name = prompt('新しい場所の名前を入力してください:');
      if (name && name.trim() && !locations[name.trim()]) {
        const defaultColors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
        const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];
        
        locations[name.trim()] = randomColor;
        localStorage.setItem('locations', JSON.stringify(locations));
        renderSettingsLocationList();
        updateLocationSelect();
      }
    });
  }
  
  renderSettingsLocationList();
  updateLocationSelect();
}

// =============================================================================
// カラーピッカー
// =============================================================================

let currentEditingLocation = null;
let selectedColor = '#3b82f6';

const colorPickerModal = q('#colorPickerModal');
const customColorInput = q('#customColorInput');
const colorPresets = qa('.color-preset');
const confirmColorBtn = q('#confirmColorBtn');
const cancelColorBtn = q('#cancelColorBtn');

function openColorPicker(locationName) {
  currentEditingLocation = locationName;
  const currentColor = locations[locationName] || '#3b82f6';
  selectedColor = currentColor;
  customColorInput.value = currentColor;
  
  colorPresets.forEach(p => p.classList.remove('selected'));
  const matchingPreset = Array.from(colorPresets).find(p => p.dataset.color === currentColor);
  if (matchingPreset) {
    matchingPreset.classList.add('selected');
  }
  
  colorPickerModal.classList.add('active');
}

function closeColorPicker() {
  colorPickerModal.classList.remove('active');
  currentEditingLocation = null;
}

function initColorPicker() {
  colorPresets.forEach(preset => {
    preset.addEventListener('click', () => {
      colorPresets.forEach(p => p.classList.remove('selected'));
      preset.classList.add('selected');
      selectedColor = preset.dataset.color;
      customColorInput.value = selectedColor;
    });
  });

  customColorInput.addEventListener('input', (e) => {
    selectedColor = e.target.value;
    colorPresets.forEach(p => p.classList.remove('selected'));
  });

  confirmColorBtn.addEventListener('click', () => {
    if (currentEditingLocation) {
      locations[currentEditingLocation] = selectedColor;
      localStorage.setItem('locations', JSON.stringify(locations));
      renderSettingsLocationList();
      updateLocationSelect();
      displayEventsForDate(currentDisplayDate);
    }
    closeColorPicker();
  });

  cancelColorBtn.addEventListener('click', closeColorPicker);

  colorPickerModal.addEventListener('click', (e) => {
    if (e.target === colorPickerModal) {
      closeColorPicker();
    }
  });
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
// ペット名管理
// =============================================================================

function initPetName() {
  if (petName) q('#pet-name-input').value = petName;
  q('#pet-name-input').addEventListener('input', (e) => {
    petName = e.target.value;
    localStorage.setItem('petName', petName);
  });
}

// =============================================================================
// タイムライン表示
// =============================================================================

function applyColorsToExistingEvents() {
  qa('.timeline-event').forEach(eventDiv => {
    const location = eventDiv.dataset.location || 'その他';
    const locationColor = locations[location] || locations['その他'] || '#64748b';
    eventDiv.style.background = locationColor;
  });
}

function getMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function isOverlapping(ev1, ev2) {
  const start1 = getMinutes(ev1.start_time || ev1.time || '00:00');
  const end1 = getMinutes(ev1.end_time || '23:59');
  const start2 = getMinutes(ev2.start_time || ev2.time || '00:00');
  const end2 = getMinutes(ev2.end_time || '23:59');
  
  return start1 < end2 && start2 < end1;
}

function displayEventsForDate(dateStr) {
  currentDisplayDate = dateStr;
  const titleEl = q("#selected-date-label");
  const dateInputEl = q("#selected-date-input");
  const timelineEventsEl = q("#timeline-events");
  
  const today = new Date().toISOString().split('T')[0];
  
  if (dateStr === today) {
    titleEl.textContent = `今日の予定`;
  } else {
    titleEl.textContent = `${dateStr}の予定`;
  }

  dateInputEl.value = dateStr;
  
  const events = allEvents[dateStr] || [];
  
  const existingEvents = timelineEventsEl.querySelectorAll('.timeline-event');
  existingEvents.forEach(el => el.remove());
  
  if (events.length > 0) {
    const sortedEvents = [...events].sort((a, b) => {
      const aStart = a.start_time || a.time || '00:00';
      const bStart = b.start_time || b.time || '00:00';
      return aStart.localeCompare(bStart);
    });
    
    const columns = [];
    sortedEvents.forEach(ev => {
      let placed = false;
      
      for (let col of columns) {
        let canPlace = true;
        for (let existingEv of col) {
          if (isOverlapping(ev, existingEv)) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          col.push(ev);
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        columns.push([ev]);
      }
    });
    
    const eventColumnMap = new Map();
    sortedEvents.forEach(ev => {
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].includes(ev)) {
          eventColumnMap.set(ev, i);
          break;
        }
      }
    });
    
    const nowTime = q('.current-time-label')?.textContent || '00:00';
    sortedEvents.forEach(ev => {
      const isToday = dateStr === today;
      const startTime = ev.start_time || ev.time || '00:00';
      const endTime = ev.end_time || '23:59';
      const isPast = isToday && endTime <= nowTime;
      const canDelete = ev.done === null;
      
      const startMinutes = getMinutes(startTime);
      const endMinutes = getMinutes(endTime);
      const topPosition = (startMinutes / 1440.0 * 100);
      const height = ((endMinutes - startMinutes) / 1440.0 * 100);
      
      const div = document.createElement("div");
      div.className = "timeline-event";
      if (ev.done === true) div.classList.add('event-done');
      else if (ev.done === false) div.classList.add('event-failed');
      else if (isPast) div.classList.add('event-past');
      
      div.style.top = `${topPosition}%`;
      div.style.height = `${Math.max(height, 2)}%`;
      
      const columnIndex = eventColumnMap.get(ev);
      const leftOffset = columnIndex * 260;
      div.style.left = `${leftOffset + 8}px`;
      
      const locationColor = locations[ev.location] || locations['その他'] || '#64748b';
      div.style.background = locationColor;
      
      div.dataset.id = ev.id;
      div.dataset.date = dateStr;
      div.dataset.startTime = startTime;
      div.dataset.endTime = endTime;
      div.dataset.event = ev.event;
      div.dataset.location = ev.location || 'その他';
      
      let buttonsHTML = '';
      if (isPast && ev.done === null) {
        buttonsHTML = `
          <button class="btn btn-success btn-small done-btn" data-id="${ev.id}" data-date="${dateStr}" data-done="true">できた</button>
          <button class="btn btn-danger btn-small done-btn" data-id="${ev.id}" data-date="${dateStr}" data-done="false">できなかった</button>
          <button class="btn btn-danger btn-small delete-btn" data-id="${ev.id}" data-date="${dateStr}">削除</button>
        `;
      } else if (ev.done !== null) {
        buttonsHTML = ev.done 
          ? '<span class="badge badge-success">$2713 できた</span>'
          : '<span class="badge badge-danger">$2717 できなかった</span>';
      } else {
        buttonsHTML = `<button class="btn btn-danger btn-small delete-btn" data-id="${ev.id}" data-date="${dateStr}">削除</button>`;
      }
      
      div.innerHTML = `
        <div class="timeline-event-time">${startTime} - ${endTime}</div>
        <div class="timeline-event-location">$D83D$DCCD ${ev.location || 'その他'}</div>
        <div class="timeline-event-text">${ev.event}</div>
        <div class="timeline-event-actions">
          ${buttonsHTML}
        </div>
      `;
      
      timelineEventsEl.appendChild(div);
    });
  }
  
  if (dateStr === today) {
    const nowTimeLabel = q('.current-time-label')?.textContent;
    if (nowTimeLabel) {
      const nowMinutes = getMinutes(nowTimeLabel);
      const scrollPosition = (nowMinutes / 1440.0) * 2400;
      const container = q('.timeline-scroll');
      if (container) {
        container.scrollTop = Math.max(0, scrollPosition - 200);
      }
    }
  }
}

// =============================================================================
// イベント処理
// =============================================================================

function initEventHandlers() {
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("done-btn")) {
      const btn = e.target;
      const done = btn.dataset.done;
      const id = btn.dataset.id;
      const date = btn.dataset.date;

      try {
        const res = await fetch("/set_done", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ id, date, done })
        });
        // 修正後
        const data = await res.json();
        if (res.ok && data.success) {
          displayEventsForDate(currentDisplayDate);
          updatePetUI({
            image: data.pet_image,
            level: data.pet_level,
            message: data.pet_message,
            exp: data.pet_exp,
            next_exp: data.next_exp,
            pet_coins: data.pet_coins
          });

          // コイン獲得演出を表示（成功時のみ）
          if (done === 'true') {
            // 時間から報酬を計算
            const timelineEvent = document.querySelector(`.timeline-event[data-id="${id}"]`);
            let coinReward = 10;
            
            if (timelineEvent) {
              const startTime = timelineEvent.dataset.startTime;
              const endTime = timelineEvent.dataset.endTime;
              const [startH, startM] = startTime.split(':').map(Number);
              const [endH, endM] = endTime.split(':').map(Number);
              const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
              
              if (durationMinutes < 30) coinReward = 5;
              else if (durationMinutes < 60) coinReward = 10;
              else if (durationMinutes < 120) coinReward = 25;
              else if (durationMinutes < 180) coinReward = 48;
              else coinReward = 140;
            }
            
            showCoinModal({
              coinAmount: coinReward,
              totalCoins: data.pet_coins,
              message: 'タスク完了!'
            });
          }

          if (!data.pet_alive || data.pet_image.includes("death")) {
            q("#revive-area").classList.remove("hidden");
            q("#level-label").style.display = "none";
            const expBarContainer = q('.exp-bar-container');
            if (expBarContainer) expBarContainer.style.display = "none";
          }
        } else {
          alert(data.error || "エラーが発生しました");
        }
      } catch (err) {
        console.error("通信エラー", err);
        alert("通信エラーが発生しました");
      }
    }
    
    if (e.target.classList.contains("delete-btn")) {
      const btn = e.target;
      const id = btn.dataset.id;
      const date = btn.dataset.date;
      
      try {
        const res = await fetch("/delete_event", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ id, date })
        });
        
        if (res.ok) {
          if (allEvents[date]) {
            allEvents[date] = allEvents[date].filter(ev => ev.id != id);
            if (allEvents[date].length === 0) delete allEvents[date];
          }
          
          const cell = document.querySelector(`td.calendar-cell[data-date="${date}"]`);
          if (cell) {
            const entry = cell.querySelector(`[data-id="${id}"]`);
            if (entry) entry.remove();
          }
          
          displayEventsForDate(currentDisplayDate);
        } else {
          alert("削除に失敗しました");
        }
      } catch (err) {
        console.error("通信エラー", err);
        alert("通信エラーが発生しました");
      }
    }
  });
}

// =============================================================================
// カレンダーセルクリック
// =============================================================================

function initCalendarCells() {
  qa("td.calendar-cell").forEach(cell => {
    cell.addEventListener("click", (e) => {
      const clickedEntry = e.target.closest(".event-entry");
      if (clickedEntry) {
        e.stopPropagation();
        const date = clickedEntry.dataset.date;
        const id = clickedEntry.dataset.id;
        const startTime = clickedEntry.dataset.startTime;
        const endTime = clickedEntry.dataset.endTime;
        const eventText = clickedEntry.dataset.event;
        const location = clickedEntry.dataset.location || '';
        showForm({ date, id, startTime, endTime, eventText, location, isEdit: true });
        return;
      }
      
      const date = cell.getAttribute("data-date");
      if (!date) return;
      
      displayEventsForDate(date);
      
      qa("td.calendar-cell").forEach(c => c.classList.remove("selected"));
      cell.classList.add("selected");
      
      const today = q("#selected-date-input")?.value || "";
      if (date >= today) {
        showForm({ date, isEdit: false });
      }
    });
  });
}

// =============================================================================
// フォーム管理
// =============================================================================

function showForm({ date, id = "", startTime = "09:00", endTime = "10:00", eventText = "", location = "", isEdit = false }) {
  if (selectedCell) selectedCell.classList.remove("selected");
  selectedCell = document.querySelector(`td[data-date='${date}']`);
  if (selectedCell) selectedCell.classList.add("selected");

  q("#form").classList.remove("hidden");
  q("#date").value = date;
  q("#event_id").value = id;
  q("#startTimeInput").value = startTime;
  q("#endTimeInput").value = endTime;
  q("#eventInput").value = eventText;
  q("#locationSelect").value = location;

  const form = q("#eventForm");
  form.method = "post";
  form.action = isEdit ? "/update_event" : "/add_event";
  q("#submitBtn").textContent = isEdit ? "更新" : "追加";
  
  setTimeout(() => {
    q("#form").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

function initFormHandlers() {
  const eventForm = q("#eventForm");
  if (eventForm) {
    eventForm.addEventListener("submit", (e) => {
      const startTime = q("#startTimeInput").value;
      const endTime = q("#endTimeInput").value;
      const errorMsg = q("#form-error-message");
      
      errorMsg.style.display = "none";
      errorMsg.textContent = "";
      
      if (startTime >= endTime) {
        e.preventDefault();
        errorMsg.textContent = "終了時間は開始時間より後にしてください";
        errorMsg.style.display = "block";
        errorMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return false;
      }
    });
  }

  q("#cancelBtn").addEventListener("click", () => {
    q("#form").classList.add("hidden");
    if (selectedCell) selectedCell.classList.remove("selected");
  });

  const addEventTrigger = q("#add-event-trigger");
  if (addEventTrigger) {
    addEventTrigger.addEventListener("click", () => {
      const selectedDate = q("#selected-date-input").value;
      const today = new Date().toISOString().split('T')[0];
      
      if (selectedDate >= today) {
        showForm({ date: selectedDate, isEdit: false });
      }
    });
  }
}

// =============================================================================
// 日付選択ピッカー
// =============================================================================

function initDatePicker() {
  const datePickerModal = q('#datePickerModal');
  const datePickerTrigger = q('#date-picker-trigger');
  const yearSelect = q('#yearSelect');
  const monthSelect = q('#monthSelect');
  const daySelect = q('#daySelect');
  const weekdayDisplay = q('#weekdayDisplay');
  const confirmDateBtn = q('#confirmDateBtn');
  const cancelDateBtn = q('#cancelDateBtn');
  const selectedDateInput = q('#selected-date-input');
  
  const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  
  function populateYears() {
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = `${year}年`;
      yearSelect.appendChild(option);
    }
  }
  
  function populateMonths() {
    monthSelect.innerHTML = '';
    for (let month = 1; month <= 12; month++) {
      const option = document.createElement('option');
      option.value = month;
      option.textContent = `${month}月`;
      monthSelect.appendChild(option);
    }
  }
  
  function populateDays(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    daySelect.innerHTML = '';
    for (let day = 1; day <= daysInMonth; day++) {
      const option = document.createElement('option');
      option.value = day;
      option.textContent = `${day}日`;
      daySelect.appendChild(option);
    }
  }
  
  function updateWeekday() {
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    const day = parseInt(daySelect.value);
    
    const date = new Date(year, month - 1, day);
    const weekday = weekdays[date.getDay()];
    weekdayDisplay.textContent = `${year}年${month}月${day}日 (${weekday})`;
  }
  
  function openDatePicker() {
    const currentDate = selectedDateInput.value;
    const [year, month, day] = currentDate.split('-').map(Number);
    
    populateYears();
    populateMonths();
    populateDays(year, month);
    
    yearSelect.value = year;
    monthSelect.value = month;
    daySelect.value = day;
    
    updateWeekday();
    datePickerModal.classList.add('active');
  }
  
  function closeDatePicker() {
    datePickerModal.classList.remove('active');
  }
  
  if (datePickerTrigger) {
    datePickerTrigger.addEventListener('click', openDatePicker);
  }
  
  yearSelect.addEventListener('change', () => {
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    populateDays(year, month);
    daySelect.value = 1;
    updateWeekday();
  });
  
  monthSelect.addEventListener('change', () => {
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    populateDays(year, month);
    
    const currentDay = parseInt(daySelect.value);
    const daysInMonth = new Date(year, month, 0).getDate();
    if (currentDay > daysInMonth) {
      daySelect.value = 1;
    }
    updateWeekday();
  });
  
  daySelect.addEventListener('change', updateWeekday);
  
  confirmDateBtn.addEventListener('click', () => {
    const year = yearSelect.value;
    const month = String(monthSelect.value).padStart(2, '0');
    const day = String(daySelect.value).padStart(2, '0');
    const selectedDate = `${year}-${month}-${day}`;
    
    selectedDateInput.value = selectedDate;
    displayEventsForDate(selectedDate);
    
    qa("td.calendar-cell").forEach(c => c.classList.remove("selected"));
    const targetCell = document.querySelector(`td[data-date='${selectedDate}']`);
    if (targetCell) targetCell.classList.add("selected");
    
    closeDatePicker();
  });
  
  cancelDateBtn.addEventListener('click', closeDatePicker);
  
  datePickerModal.addEventListener('click', (e) => {
    if (e.target === datePickerModal) {
      closeDatePicker();
    }
  });
}

// =============================================================================
// 時間間隔設定
// =============================================================================

let timeDuration = parseInt(localStorage.getItem('timeDuration') || '60');

function initTimeDuration() {
  const durationRadios = qa('input[name="time-duration"]');
  durationRadios.forEach(radio => {
    if (parseInt(radio.value) === timeDuration) {
      radio.checked = true;
    }
    
    radio.addEventListener('change', (e) => {
      timeDuration = parseInt(e.target.value);
      localStorage.setItem('timeDuration', timeDuration);
    });
  });

  const startTimeInput = q('#startTimeInput');
  const endTimeInput = q('#endTimeInput');

  if (startTimeInput && endTimeInput) {
    startTimeInput.addEventListener('change', (e) => {
      const startTime = e.target.value;
      if (!startTime) return;
      
      const [startHour, startMin] = startTime.split(':').map(Number);
      let totalMinutes = startHour * 60 + startMin;
      totalMinutes += timeDuration;
      
      if (totalMinutes >= 24 * 60) {
        totalMinutes = 23 * 60 + 59;
      }
      
      const endHour = Math.floor(totalMinutes / 60);
      const endMin = totalMinutes % 60;
      
      endTimeInput.value = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    });
  }
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
// ペットUI更新
// =============================================================================

function updatePetUI(data) {
  if (data.image !== undefined) {
    q("#pet-img").src = `/static/images/${data.image}`;
    if (data.image.includes("death")) {
      q("#level-label").style.display = "none";
      const expBarContainer = q('.exp-bar-container');
      if (expBarContainer) expBarContainer.style.display = "none";
    } else {
      q("#level-label").style.display = "block";
      const expBarContainer = q('.exp-bar-container');
      if (expBarContainer) expBarContainer.style.display = "block";
    }
  }
  if (data.message !== undefined) q("#pet-message").textContent = data.message;
  if (data.level !== undefined) q("#level-label").textContent = `Lv.${data.level}`;
  
  if (data.pet_coins !== undefined) {
    const coinCount = q("#coin-count");
    if (coinCount) coinCount.textContent = data.pet_coins;
    
    const headerCoinCount = q("#header-coin-count");
    if (headerCoinCount) headerCoinCount.textContent = data.pet_coins;
  }
  
  if (data.exp !== undefined && data.next_exp !== undefined) {
    updateExpBar(data.exp, data.next_exp);
  }
}

// =============================================================================
// ショップボタン
// =============================================================================

function initShopButton() {
  const shopBtn = q("#go-to-shop-btn");
  if (shopBtn) {
    shopBtn.addEventListener("click", () => {
      window.location.href = "/shop";
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
// コイン獲得モーダル制御
// =============================================================================

function showCoinModal({ coinAmount, totalCoins, message }) {
  const modal = q('#coinModal');
  const coinAmountEl = q('#coinAmount');
  const coinMessageEl = q('#coinMessage');
  const coinTotalAmountEl = q('#coinTotalAmount');
  const sparklesContainer = q('#coinSparkles');
  
  if (!modal) return;
  
  coinAmountEl.textContent = `+${coinAmount}`;
  coinMessageEl.textContent = message;
  coinTotalAmountEl.textContent = totalCoins;
  
  // キラキラエフェクトを生成
  sparklesContainer.innerHTML = '';
  for (let i = 0; i < 40; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.animationDelay = `${Math.random() * 2}s`;
    sparkle.style.animationDuration = `${2 + Math.random() * 2}s`;
    sparklesContainer.appendChild(sparkle);
  }
  
  // コイン紙吹雪エフェクト
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'coin-confetti';
    confetti.textContent = '金';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random() * 3}s`;
    confetti.style.animationDuration = `${3 + Math.random() * 2}s`;
    sparklesContainer.appendChild(confetti);
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCoinModal() {
  const modal = q('#coinModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function initCoinModal() {
  const closeBtn = q('#coinCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeCoinModal();
      // 目標達成後はページをリロード
      if (q('#achieve-goal-btn') && goalAchieved) {
        location.reload();
      }
    });
  }
  
  const backdrop = q('.coin-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeCoinModal);
  }
  
  document.addEventListener('keydown', (e) => {
    const modal = q('#coinModal');
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeCoinModal();
    }
  });
}

// =============================================================================
// ペットボタン
// =============================================================================

function initPetButtons() {
  const startBtn = q("#start");
  if (startBtn) {
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
            q("#start-area").classList.add("hidden");
            q("#game-area").classList.remove("hidden");
            q("#revive-area").classList.add("hidden");
            
            const expBarContainer = q('.exp-bar-container');
            if (expBarContainer) expBarContainer.style.display = "block";
            
            updatePetUI(data);
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

  const feedBtn = q("#feed-btn");
  if (feedBtn) {
    feedBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      
      const levelLabel = q('#level-label');
      const currentLevel = levelLabel ? parseInt(levelLabel.textContent.replace('Lv.', '')) : 0;
      
      try {
        const res = await fetch("/feed", { method: "POST" });
        const data = await res.json();
        
        if (data.level !== undefined && data.level > currentLevel) {
          if (data.image) {
            localStorage.setItem('lastDiscoveredPet', data.image);
          }
          
          showLevelUpModal({
            oldLevel: data.start_level || currentLevel,
            newLevel: data.level,
            petImage: data.image,
            petType: data.pet_type || 1,
            evolution: data.evolution || 1,
            levelsGained: data.levels_gained || 1
          });
        } else {
          updatePetUI({
            image: data.image,
            level: data.level,
            message: data.message,
            food: data.food,
            exp: data.exp,
            next_exp: data.next_exp
          });
        } 
      } catch (err) {
        console.error('エラー:', err);
        alert('餌やりに失敗しました');
      }
    });
  }

  const reviveBtn = q("#revive");
  if (reviveBtn) {
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
            q("#revive-area").classList.add("hidden");
            q("#level-label").style.display = "block";
            
            const expBarContainer = q('.exp-bar-container');
            if (expBarContainer) expBarContainer.style.display = "block";
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

  const reviveBtnGame = q("#revive-btn-game");
  if (reviveBtnGame) {
    reviveBtnGame.addEventListener("click", async (e) => {
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
            q("#revive-area").classList.add("hidden");
            q("#level-label").style.display = "block";
            
            const expBarContainer = q('.exp-bar-container');
            if (expBarContainer) expBarContainer.style.display = "block";
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
}

// =============================================================================
// 目標管理
// =============================================================================

function initGoalButtons() {
  const setGoalBtn = q("#set-goal-btn");
  if (setGoalBtn) {
    setGoalBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const goalInput = q("#goal-input");
      const goalText = goalInput.value.trim();
      
      if (!goalText) {
        alert("目標を入力してください");
        return;
      }
      
      try {
        const res = await fetch("/set_goal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month_key: monthKey, goal: goalText })
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
          location.reload();
        } else {
          alert(data.error || "目標の設定に失敗しました");
        }
      } catch (err) {
        console.error("通信エラー", err);
        alert("通信エラーが発生しました");
      }
    });
  }

  const achieveGoalBtn = q("#achieve-goal-btn");
  if (achieveGoalBtn) {
    achieveGoalBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (goalAchieved) {
        alert("すでに達成済みです");
        return;
      }
      
      try {
        const res = await fetch("/achieve_goal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month_key: monthKey })
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
          goalAchieved = true;
          
          // コイン獲得演出を表示
          showCoinModal({
            coinAmount: 1500,
            totalCoins: data.coins,
            message: '月目標達成おめでとう!'
          });
          
          // モーダルを閉じた後にページをリロード
          //setTimeout(() => {
          //  location.reload();
          //}, 100);
        } else {
          alert(data.error || "エラーが発生しました");
        }
      } catch (err) {
        console.error("通信エラー", err);
        alert("通信エラーが発生しました");
      }
    });
  }
}

// =============================================================================
// ランダム予定管理
// =============================================================================

let eventPresets = JSON.parse(localStorage.getItem('eventPresets') || JSON.stringify([
  '読書', '買い物', '散歩', '運動', '料理', '掃除', '洗濯',
  '勉強', '映画鑑賞', '音楽鑑賞', 'ゲーム', '友達と会う',
  'カフェ', 'ジム', 'ヨガ', '趣味の時間'
]));

function saveEventPresets() {
  localStorage.setItem('eventPresets', JSON.stringify(eventPresets));
}

function renderSettingsEventList() {
  const list = q('#settings-event-list');
  if (!list) return;
  
  list.innerHTML = '';
  
  eventPresets.forEach((eventName, index) => {
    const item = document.createElement('div');
    item.className = 'settings-event-item';
    item.innerHTML = `
      <div class="settings-event-name">${eventName}</div>
      <button class="settings-event-delete" data-index="${index}">×</button>
    `;
    list.appendChild(item);
  });
  
  qa('.settings-event-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(btn.dataset.index);
      eventPresets.splice(index, 1);
      saveEventPresets();
      renderSettingsEventList();
    });
  });
}

function initRandomEvents() {
  const settingsAddEventBtn = q('#settings-add-event-btn');
  if (settingsAddEventBtn) {
    settingsAddEventBtn.addEventListener('click', () => {
      const name = prompt('新しい予定を入力してください:');
      if (name && name.trim() && !eventPresets.includes(name.trim())) {
        eventPresets.push(name.trim());
        saveEventPresets();
        renderSettingsEventList();
      } else if (name && eventPresets.includes(name.trim())) {
        alert('その予定は既に存在します');
      }
    });
  }

  const randomEventBtn = q('#randomEventBtn');
  if (randomEventBtn) {
    randomEventBtn.addEventListener('click', () => {
      if (eventPresets.length === 0) {
        alert('ランダム予定が設定されていません。設定メニューから追加してください。');
        return;
      }
      
      const randomIndex = Math.floor(Math.random() * eventPresets.length);
      const randomEvent = eventPresets[randomIndex];
      q('#eventInput').value = randomEvent;
    });
  }
  
  renderSettingsEventList();
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
// 初期化
// =============================================================================

function init() {
  initTheme();
  initPetName();
  initLocationManagement();
  initColorPicker();
  initPetSelectModal();
  initEventHandlers();
  initCalendarCells();
  initFormHandlers();
  initDatePicker();
  initTimeDuration();
  initPetButtons();
  initGoalButtons();
  initRandomEvents();
  initSettingsAccordion();
  initLevelUpModal();
  initCoinModal();
  initShopButton();
  
  applyColorsToExistingEvents();
  
  const initialDate = q("#selected-date-input")?.value || "";
  if (initialDate) displayEventsForDate(initialDate);
}

init();