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

// =============================================================================
// パスワードバリデーション(リアルタイム)
// =============================================================================

const signupPassword = document.getElementById('signup-password');

if (signupPassword) {
  signupPassword.addEventListener('input', (e) => {
    const password = e.target.value;
    
    // 5文字以上チェック
    const reqLength = document.getElementById('req-length');
    if (password.length >= 5) {
      reqLength.classList.add('valid');
    } else {
      reqLength.classList.remove('valid');
    }
    
    // 英字チェック
    const reqAlpha = document.getElementById('req-alpha');
    const hasAlpha = /[a-zA-Z]/.test(password);
    if (hasAlpha) {
      reqAlpha.classList.add('valid');
    } else {
      reqAlpha.classList.remove('valid');
    }
    
    // 数字チェック
    const reqDigit = document.getElementById('req-digit');
    const hasDigit = /[0-9]/.test(password);
    if (hasDigit) {
      reqDigit.classList.add('valid');
    } else {
      reqDigit.classList.remove('valid');
    }
  });
  
  // フォーム送信時のバリデーション
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      const password = signupPassword.value;
      const hasAlpha = /[a-zA-Z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      
      if (password.length < 5) {
        e.preventDefault();
        alert('パスワードは5文字以上にしてください');
        return false;
      }
      
      if (!hasAlpha || !hasDigit) {
        e.preventDefault();
        alert('パスワードは英字と数字を両方含む必要があります');
        return false;
      }
    });
  }
}