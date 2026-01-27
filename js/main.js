let chats = [];
let currentChatId = null;

const chatHistory = document.getElementById('chatHistory');

const settingsBtn = document.getElementById('settingsBtn');
const settingsSheet = document.getElementById('settingsSheet');
const settingsBackdrop = document.getElementById('settingsBackdrop');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');
const darkToggle = document.getElementById('darkToggle');
const resetBtn = document.getElementById('resetBtn');

// 사이드 바를 위한 공통 저장 채팅목록 (main.js, chat.js 둘 다 동일)
const STORAGE_KEY = 'aiiing_chats';
const STORAGE_THEME = 'secureai_theme';

function applySavedTheme(){
  const theme = localStorage.getItem(STORAGE_THEME);
  const isDark = theme === 'dark';

  document.body.classList.toggle('dark', isDark);

  const toggle = document.getElementById('darkToggle');
  if(toggle) toggle.checked = isDark;
}

function saveChats(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function renderSidebar(){
  chatHistory.innerHTML = '';
  chats.forEach(chat => {
    const li = document.createElement('li');
    li.className = chat.id === currentChatId ? 'active' : '';
    li.textContent = chat.title;

    li.onclick = () => loadChat(chat.id);

    const delBtn = document.createElement('button');
    delBtn.className = 'more';
    delBtn.innerText = '삭제';
    delBtn.onclick = e => {
      e.stopPropagation();
      deleteChat(chat.id);
    };

    li.appendChild(delBtn);
    chatHistory.appendChild(li);
  });
}

function createNewChat(title='새 대화'){
  const id = Date.now().toString();
  chats.unshift({ id, title, messages: [] });
  currentChatId = id;
  clearChatUI();
  renderSidebar();
  saveChats();
}

function loadChat(id) { // 화면이동
  // 클릭한 채팅의 ID를 가지고 채팅 페이지(chat.html)로 이동합니다.
  // URL 뒤에 ?id=숫자 형태의 파라미터를 붙여서 넘겨줍니다.
  console.log("클릭된 채팅 ID:", id); // 브라우저 콘솔(F12)에서 확인
  if (!id) {
    console.error("ID가 없습니다!");
    return;
  }
  location.href = `chat.html?id=${id}`;
}

function loadChats() {
  chats = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  renderSidebar();
}

window.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  loadChats(); // main.html
});

function deleteChat(id){
  chats = chats.filter(c => c.id !== id);

  if(currentChatId === id){
    currentChatId = chats[0]?.id || null;
    if(currentChatId) loadChat(currentChatId);
    else clearChatUI();
  }

  saveChats();
  renderSidebar();
}

function openSettings(){
  document.body.classList.add('settings-open');
  settingsSheet.setAttribute('aria-hidden','false');
  settingsBackdrop.setAttribute('aria-hidden','false');
}

function closeSettings(){
  document.body.classList.remove('settings-open');
  settingsSheet.setAttribute('aria-hidden','true');
  settingsBackdrop.setAttribute('aria-hidden','true');
}

settingsBtn?.addEventListener('click', openSettings);
settingsCloseBtn?.addEventListener('click', closeSettings);
settingsBackdrop?.addEventListener('click', closeSettings);

document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') closeSettings();
});

darkToggle?.addEventListener('change', () => {
  if(darkToggle.checked){
    document.body.classList.add('dark');
    localStorage.setItem(STORAGE_THEME, 'dark');
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem(STORAGE_THEME, 'light');
  }
});

resetBtn?.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  chats = [];
  currentChatId = null;
  renderSidebar();
  closeSettings();
});


function showToast(html) {
  document.getElementById('toastMessage').innerHTML = html;
  document.getElementById('toast').classList.add('show');
}


function hideToast() {
  const toast = document.getElementById('toast');
  toast.classList.remove('show');
  toast.setAttribute('aria-hidden', 'true');
}

window.hideToast = hideToast;
window.showToast = showToast;

/* 토스트 esc종료 */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') hideToast();
});

const guideHtml = `
  <h3>사용법</h3>
  <ol>
    <li>대화 시작하기 버튼을 눌러주세요</li>
    <li>보안 AI에게 궁금한 점을 물어보시고</li>
    <li>답변을 적용해보세요</li>
    <li>사이드바에서 질문목록을 관리할 수 있습니다</li>
  </ol>
`;

const noteHtml = `
  <h3>문서</h3>
  <ol>
    <li>문서 내용</li>
  </ol>
`;
