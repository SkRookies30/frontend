# agents/guidance_agent.py
# 대응 가이드 생성 (LLM 담당) - 홍서현, 김희재, 신선호, 김창민

import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# ✅ API 키 체크(없으면 바로 에러로 알려줌)
_api_key = os.getenv("OPENAI_API_KEY")
if not _api_key:
    raise ValueError("OPENAI_API_KEY가 없습니다. .env 파일에 OPENAI_API_KEY를 설정하세요.")

_client = OpenAI(api_key=_api_key)

SYSTEM_PROMPT = """너는 보안 로그를 분석하는 SecureAI 어시스턴트다.

반드시 아래 형식으로만 답변해라.
형식을 벗어나거나 불필요한 인사는 절대 하지 마라.

추가 규칙:
- 공격 유형 및 이상 여부 판단은 [모델 분석 결과]를 우선적으로 참고하라.
- 아래 섹션 제목([요약]...[OWASP / MITRE])을 반드시 그대로 포함해라.
- [탐지 근거]와 [즉시 대응 방안]은 각각 정확히 2~3개 bullet로만 써라.
- 사용자의 질문이 지나치게 추상적이면, [탐지 근거]에는 확인이 필요한 로그/지표를 제시하고, [즉시 대응 방안]에는 “정보 수집/확인” 위주의 조치를 제시해라.
- 임의로 특정 공격(예: 암호화 실패, SSRF 등)을 단정하지 마라. 근거가 부족하면 “가능성”으로 표현해라.

[요약]
- 한 문장으로 핵심만 설명

[위험도]
- LOW / MEDIUM / HIGH 중 하나
- 위험 점수(0.00 ~ 1.00)

[탐지 근거]
- 근거 2~3개

[즉시 대응 방안]
- 조치 2~3개

[OWASP / MITRE]
- 관련 항목 이름만 간단히 나열
"""


class ResponseGuidanceAgent:
    def __init__(self, model: str = "gpt-5", max_output_tokens: int = 400):
        self.model = model
        self.max_output_tokens = max_output_tokens

    def generate(self, user_text: str) -> str:
        """기본: user_text만으로 가이드 생성"""
        resp = _client.responses.create(
            model=self.model,
            reasoning={"effort": "minimal"},
            max_output_tokens=self.max_output_tokens,
            input=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_text},
            ],
        )
        return (resp.output_text or "").strip()

    def generate_with_evidence(
        self,
        user_text: str,
        evidences: List[Dict[str, Any]],
        top_k: int = 5,
        detection: Optional[Dict[str, Any]] = None,
        classification: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        RAG: 벡터 검색 결과(근거) + (선택) 모델 결과를 user_text에 붙여서 가이드 생성
        - evidences: retriever.search()가 반환한 dict 리스트
        - detection: {"is_anomaly": 0/1, "anomaly_score": float} 같은 형태(없어도 됨)
        - classification: {"attack_code": int, "attack_name": str, "confidence": float} 같은 형태(없어도 됨)
        """
        evidences = (evidences or [])[:top_k]

        # ✅ (선택) 모델 결과 블록 구성
        model_lines: List[str] = []
        if detection:
            model_lines.append(
                f"- 이상탐지: is_anomaly={detection.get('is_anomaly')} / anomaly_score={detection.get('anomaly_score')}"
            )
        if classification:
            model_lines.append(
                f"- 공격분류: attack_name={classification.get('attack_name')} (code={classification.get('attack_code')}), confidence={classification.get('confidence')}"
            )
        model_block = "\n".join(model_lines).strip()

        # ✅ 근거 블록 구성
        evidence_block = ""
        if evidences:
            evidence_block = "\n".join(
                [
                    f"- ({e.get('source_doc','')} {e.get('source_section','')}) {e.get('action_text','')}"
                    for e in evidences
                ]
            )

        # ✅ 최종 프롬프트 조립 (있으면 붙이고 없으면 생략)
        prompt = f"""사용자 요청:
{user_text}
"""
        if model_block:
            prompt += f"\n[모델 분석 결과]\n{model_block}\n"
        if evidence_block:
            prompt += f"\n[공식 문서 근거(벡터 검색 결과)]\n{evidence_block}\n"

        return self.generate(prompt)