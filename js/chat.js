let chats = [];
let currentChatId = null;

const API_URL = 'http://localhost:8000/api/chat';

const composer = document.getElementById('composer');
const chatBody = document.getElementById('chatBody');
const sendBtn = document.getElementById('sendBtn');
const chatHistory = document.getElementById('chatHistory');
const newChatBtn = document.getElementById('newChatBtn');

const insertSampleBtn = document.getElementById('insertSampleBtn');

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

/* ===== utils ===== */
function autoResize(){
  composer.style.height = 'auto';
  composer.style.height = Math.min(composer.scrollHeight, 160) + 'px';
}
composer.addEventListener('input', autoResize);

function escapeHtml(str){
  return str.replaceAll('&','&amp;')
            .replaceAll('<','&lt;')
            .replaceAll('>','&gt;');
}

function scrollToBottom(){
  chatBody.scrollTop = chatBody.scrollHeight;
}

/* ===== UI add message ===== */
function addUser(text){
  const div = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = `
    <div class="bubble">
      <div class="meta"><span class="who">사용자</span> · 방금</div>
      <p>${escapeHtml(text)}</p>
    </div>`;
  chatBody.appendChild(div);
  scrollToBottom();
}

function addAI(text){
  const div = document.createElement('div');
  div.className = 'msg';
  div.innerHTML = `
    <div class="avatar">잉</div>
    <div class="bubble">
      <div class="meta"><span class="who">에이아이이잉</span> · 방금</div>
      <p>${escapeHtml(text)}</p>
    </div>`;
  chatBody.appendChild(div);
  scrollToBottom();
}

function addTyping(){
  const div = document.createElement('div');
  div.className = 'msg typing';
  div.id = 'typing';
  div.innerHTML = `
    <div class="avatar">잉</div>
    <div class="bubble"><p>에이아이이잉이 생각중… 아잉 💭</p></div>`;
  chatBody.appendChild(div);
  scrollToBottom();
}

function removeTyping(){
  const t = document.getElementById('typing');
  if(t) t.remove();
}

/* ===== storage ===== */
function saveChats(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}
function saveTheme(){
  localStorage.setItem(STORAGE_THEME, document.body.classList.contains('dark') ? 'dark' : 'light');
}

/* ===== sidebar ===== */
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

/* ===== chat state ===== */
function createNewChat(title='새 대화'){
  const id = Date.now().toString();
  chats.unshift({ 
    id, 
    title, 
    messages: [
      { role:'ai', text:'안녕하세요! 로그를 붙여넣고 질문해보세요.' }
    ] 
  });
  currentChatId = id;
  loadChat(id); // UI 초기화 후 렌더링
  renderSidebar();
  saveChats();
}

function loadChat(id){
  currentChatId = id;
  chatBody.innerHTML = '';  // UI 초기화

  const chat = chats.find(c => c.id === id);
  if(!chat) return;

  // 새로 만든 채팅인데 AI 메시지가 없다면 기본 메시지 추가
  if(chat.messages.length === 0){
    chat.messages.push({ role:'ai', text:'안녕하세요! 로그를 붙여넣고 질문해보세요.' });
    saveChats();
  }

  chat.messages.forEach(m => {
    if(m.role === 'user') addUser(m.text);
    else addAI(m.text);
  });

  renderSidebar();
  scrollToBottom();
}

function deleteChat(id){
  chats = chats.filter(c => c.id !== id);
  if(currentChatId === id){
    currentChatId = chats[0]?.id || null;
    if(currentChatId) loadChat(currentChatId);
  }
  saveChats();
  renderSidebar();
}

function loadAll(){
  chats = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if(chats.length === 0){
    const id = Date.now().toString();
    chats.push({
      id,
      title: '안녕하세요',
      messages: [
        { role:'ai', text:'안녕하세요! 로그를 붙여넣고 질문해보세요.' }
      ]
    });
    currentChatId = id;
    saveChats();
  }
  else {
    currentChatId = chats[0].id;
    
  }
  renderSidebar();
  loadChat(currentChatId);
  const savedTheme = localStorage.getItem(STORAGE_THEME);
  if(savedTheme === 'dark'){
    document.body.classList.add('dark');
    darkToggle.checked = true;
  }

}

window.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  loadAll();   // chat.html
});

/* ===== send (GPT 연동 핵심) ===== */
async function send(textOverride){
  const text = (textOverride ?? composer.value).trim();
  if(!text) return;

  addUser(text);

  const chat = chats.find(c => c.id === currentChatId);
  chat.messages.push({ role:'user', text });

  // 제목 자동 생성
  if(!chat.title || chat.title === '새 대화'){
    chat.title = text.slice(0,18);
  }

  saveChats();
  renderSidebar();

  composer.value = '';
  autoResize();
  addTyping();

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ messages: chat.messages })
    });
    const data = await res.json();
    removeTyping();

    
    chat.messages.push({ role:'ai', text: data.reply }); // AI 메시지 배열에 추가
    saveChats(); // **반드시 배열 업데이트 후 저장**
    addAI(data.reply);
    renderSidebar();
  } catch(err) {
    removeTyping();
    addAI('에이아이이잉 오류났어… 서버 연결 확인해줘 아잉 🥲');
  }
}

sendBtn.onclick = () => send();
composer.addEventListener('keydown', e => {
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    send();
  }
});

/* ===== misc ===== */
insertSampleBtn.onclick = () => {
  composer.value =
`GET /login.php?user=admin' OR '1'='1 HTTP/1.1
User-Agent: Mozilla/5.0
IP: 192.168.1.200`;
  autoResize();
};

newChatBtn.onclick = () => createNewChat();

settingsBtn.onclick = () => document.body.classList.add('settings-open');
settingsCloseBtn.onclick = () => document.body.classList.remove('settings-open');
settingsBackdrop.onclick = () => document.body.classList.remove('settings-open');

darkToggle.onchange = () => {
  document.body.classList.toggle('dark', darkToggle.checked);
  saveTheme();
};

resetBtn.onclick = () => {
  localStorage.removeItem(STORAGE_KEY);
  chats = [];
  createNewChat();
};
