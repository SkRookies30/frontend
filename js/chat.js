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

function addAI(text) {
  const div = document.createElement('div');
  div.className = 'msg';
  
  // 마크다운 느낌을 주기 위해 줄바꿈(\n)을 <br>로 변환하고
  // [항목] 부분을 볼드체로 강조하는 간단한 처리
  const formattedText = text
    .replace(/\n/g, '<br>')
    .replace(/\[(요약|위험도|탐지 근거|즉시 대응 방안|OWASP \/ MITRE)\]/g, '<strong><br>[$1]</strong>');

  div.innerHTML = `
    <div class="avatar">잉</div>
    <div class="bubble">
      <div class="meta"><span class="who">에이아이이잉</span> · 방금</div>
      <div class="content">${formattedText}</div>
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
  const chatHistory = document.getElementById('chatHistory'); // 요소를 다시 확인
  if (!chatHistory) return;

  chatHistory.innerHTML = '';
  chats.forEach(chat => {
    const li = document.createElement('li');
    // 현재 활성화된 채팅에 클래스 부여
    li.className = chat.id === currentChatId ? 'active' : '';
    li.textContent = chat.title || '새 대화';

    // ✅ 클릭 시 대화창을 비우고 다시 그리는 함수 호출
    li.onclick = () => {
      loadChat(chat.id);
    };

    const delBtn = document.createElement('button');
    delBtn.className = 'more';
    delBtn.innerText = '삭제';
    delBtn.onclick = e => {
      e.stopPropagation(); // li의 클릭 이벤트가 실행되지 않게 방지
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
  const chat = chats.find(c => c.id === id);
  if (!chat) return;

  // 1. 대화창 비우기 (갱신 안 되는 느낌을 없애줌)
  chatBody.innerHTML = ''; 

  // 2. 메시지 다시 그리기
  chat.messages.forEach(m => {
    if (m.role === 'user') {
      addUser(m.text);
    } else {
      addAI(m.text);
    }
  });

  // 3. 사이드바의 active 위치를 바꾸기 위해 다시 렌더링
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
  const savedData = localStorage.getItem(STORAGE_KEY);
  chats = JSON.parse(savedData || '[]');

  // 주소창에서 id 파라미터가 있는지 확인 (?id=12345)
  const urlParams = new URLSearchParams(window.location.search);
  const chatIdFromUrl = urlParams.get('id');
  console.log("넘어온 ID:", chatIdFromUrl);
  if (chats.length === 0) {
    // 저장된 데이터가 아예 없을 때만 초기 생성
    createNewChat('안녕하세요');
  } 
  else {
    // URL에 ID가 있고, 그 ID가 실제 데이터(chats)에 존재하는지 확인합니다.
    const hasValidId = chatIdFromUrl && chats.some(c => c.id === chatIdFromUrl);

    if (hasValidId) {
        // URL의 ID가 유효하면 그 ID를 현재 채팅으로 설정
        currentChatId = chatIdFromUrl;
    } else if(currentChatId==null) {
        createNewChat('안녕하세요');
    } else {
        // URL에 ID가 없거나 잘못된 ID면 가장 최근 채팅(0번)으로 설정
        currentChatId = chats[0].id;
        // 주소창도 해당 ID로 업데이트 (선택 사항)
        // location.href = `chat.html?id=${currentChatId}`; 
    }
    renderSidebar();
    loadChat(currentChatId); // 여기서 실제 메시지를 화면에 그려주는 함수를 호출하세요.
  }

  // 테마 복구
  const savedTheme = localStorage.getItem(STORAGE_THEME);
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    if(darkToggle) darkToggle.checked = true;
  }

}

window.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  loadAll();   // chat.html
});

/* ===== send (GPT 연동 핵심) ===== */
/* ===== send (GPT 연동 핵심) ===== */
/* ===== send (GPT 연동 핵심) - 최종 수정본 ===== */
async function send(textOverride) {
  const text = (textOverride ?? composer.value).trim();
  if (!text) return;

  // 현재 활성화된 채팅 객체 찾기
  const chat = chats.find(c => c.id === currentChatId);
  if (!chat) return;

  // 1. 사용자 메시지를 UI에 표시하고 배열에 추가
  addUser(text);
  chat.messages.push({ role: 'user', text: text });
  
  // 제목 자동 업데이트 (첫 메시지일 경우만)
  if (!chat.title || chat.title === '새 대화' || chat.title === '안녕하세요') {
    chat.title = text.slice(0, 15);
  }
  
  // 사용자 메시지 보낸 즉시 로컬 저장 (서버 응답 전에도 내역 보존)
  saveChats();
  renderSidebar();
  composer.value = '';
  autoResize();
  addTyping();

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chat.messages, current_log: text }) // 전체 대화 내역 전송
    });

    if (!res.ok) throw new Error('서버 응답 실패');

    const data = await res.json();
    removeTyping();

    // 2. AI 답변이 정상적으로 왔을 때만 실행
    if (data && data.reply) {
      // 2. 위험도에 따른 추가 UI 표시 (addAI 함수를 확장하거나 별도 호출)
      if (data.status === "위험") {
        const alertMsg = `⚠️ 경고: 시스템에서 ${Math.round(data.score * 100)}% 확률로 공격을 감지했습니다.`;
        addSystemAlert(alertMsg); // 시스템 알림 UI 함수 (아래 참고)
      }
      
      // ✅ 중요: 기존 chat.messages 배열에 AI 답변 추가
      chat.messages.push({ role: 'ai', text: data.reply, status:data.status }); // 상태값 추가

      // UI에 AI 답변 표시
      addAI(data.reply);

      // ✅ 중요: 추가된 AI 답변까지 포함하여 최종 저장
      saveChats();
    } else {
      throw new Error('응답 데이터 형식이 올바르지 않습니다.');
    }

  } catch (err) {
    removeTyping();
    
    // ✅ 핵심 수정: 오류 메시지도 AI의 역할로 배열에 넣고 저장합니다.
    const errorMsg = '에이아이이잉 오류났어… 분석 서버 연결을 확인해줘! 🥲';
    
    chat.messages.push({ role: 'ai', text: errorMsg });
    addAI(errorMsg);
    
    saveChats(); // 여기서 에러 메시지까지 포함하여 저장됨
    console.error("통신 오류 발생:", err);
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

function addSystemAlert(message) {
  const div = document.createElement('div');
  div.className = 'msg system-alert'; // CSS에서 배경색을 연한 빨강으로 설정하세요
  div.innerHTML = `<div class="alert-box">${message}</div>`;
  chatBody.appendChild(div);
  scrollToBottom();
}