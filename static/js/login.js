// =============================================================================
// タブ切り替え機能
// =============================================================================

const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.form-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    
    // すべてのタブとコンテンツから active クラスを削除
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    
    // クリックされたタブとそれに対応するコンテンツに active クラスを追加
    tab.classList.add('active');
    document.getElementById(`${target}-content`).classList.add('active');
  });
});