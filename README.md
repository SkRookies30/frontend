# AI 기반 보안 로그 분석 시스템 (Frontend)

본 프로젝트는 AI 기반 보안 분석 시스템의 **프론트엔드 영역**으로,  
보안 로그 분석 결과를 시각적으로 확인하고 사용자와 상호작용할 수 있는 UI를 제공합니다.  
백엔드의 머신러닝·LLM 분석 결과를 기반으로, 공격 유형 및 이상 징후를 직관적으로 전달하는 것을 목표로 합니다.

---
'''
## 📌 프로젝트 구성
FRONTEND-MAIN/
├─ agents/ # AI 에이전트 연동 모듈
│ └─ init.py
├─ css/ # 스타일시트
│ ├─ main.css
│ └─ chat.css
├─ js/ # 프론트엔드 스크립트
│ ├─ main.js
│ └─ chat.js
├─ data/ # 보안 데이터 및 벡터 인덱스
│ ├─ security_data.json
│ ├─ vector_index.faiss
│ └─ vector_meta.json
├─ images/ # UI 이미지 리소스
│ └─ main_g.gif
├─ scripts/ # 데이터 전처리 및 인덱스 생성 스크립트
│ └─ build_vector_index.py
├─ chat.html # AI 분석 결과 대화형 화면
├─ main.html # 메인 화면
├─ requirements.txt # Python 의존성 목록
└─ README.md
'''
---

## 🖥️ 주요 기능

- **보안 로그 시각화 UI**
  - 공격 유형 분류 결과 및 이상 탐지 결과 확인
- **AI 분석 결과 대화형 인터페이스**
  - LLM 기반 분석 결과를 채팅 형태로 제공
- **벡터 검색 기반 정보 조회**
  - 보안 데이터 임베딩 및 유사도 검색(Faiss)
- **확장 가능한 구조**
  - 백엔드 AI 분석 모듈과 연계 가능

---

## 🧠 동작 개요

1. 사용자 또는 시스템으로부터 보안 로그 데이터 입력
2. 백엔드 AI 분석 결과 수신
3. 공격 유형, 이상 여부, 분석 근거를 프론트엔드에서 시각화
4. LLM 기반 설명을 대화형 UI로 제공

---

## ⚙️ 실행 방법

### 1️⃣ 가상환경 및 의존성 설치
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
