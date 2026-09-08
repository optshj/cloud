import Anthropic from "@anthropic-ai/sdk";
import { pickRandomComment } from "./generate-comment";

type AiComment = { tag: string; comment: string };

const SYSTEM_PROMPT = `너는 하루 한 장 하늘 사진에 러프한 감성 코멘트를 붙이는 다이어리 앱의 톤이다.
사진이 구름/하늘이 아니어도 검증하거나 지적하지 마라(그건 이 서비스의 스코프가 아니다). 대신 사진에 무엇이 찍혔는지 묘사하지 않는다 — 사물·사람·장소·글자를 지목하지 말고 색, 빛, 공기, 그때의 기분만 쓴다. 태그도 같은 규칙을 따른다. 하늘이 아닌 사진에도 톤은 똑같이 유지한다.
다른 설명 없이 정확히 이 JSON 한 줄만 출력해라: {"tag":"3~4글자 짧은 태그","comment":"한 줄 감성 코멘트(20자 이내)"}`;

// 학교 API Gateway(Anthropic Messages API 호환)로 사진을 보내 코멘트를 받는다.
// 키가 없거나 호출/파싱이 실패하면 조용히 더미 코멘트로 폴백한다(CLAUDE.md: AI 코멘트는 검증 로직 없이 러프하게).
//
// **서버 전용이다.** features/ 배럴에 있을 땐 "use client"인 CameraView가 같은 배럴을 import해
// Anthropic SDK가 클라이언트 모듈 그래프에 들어갔다(키는 NEXT_PUBLIC_이 아니라 번들에 인라인되진
// 않았지만 구조가 그랬다). 유일한 소비자가 Route Handler 하나뿐이라 shared/lib으로 내렸다.
//
// 폴백은 조용하지만 로그까지 조용하면 키 만료·모델명 오류·게이트웨이 장애가 전부
// "코멘트가 밋밋하네"로만 보인다 — 사용자 동작은 그대로 두고 원인만 남긴다.
export const generateAiComment = async (photoUrl: string): Promise<AiComment> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return pickRandomComment();

  try {
    const client = new Anthropic({
      apiKey,
      baseURL: "https://factchat-cloud.mindlogic.ai/v1/gateway/claude",
      // SDK 기본 타임아웃은 10분이다. preview 라우트는 이 호출과 역지오코딩을 Promise.all로
      // 묶어 기다리므로, 게이트웨이가 늘어지면 화면이 그만큼 멈춘다.
      timeout: 15_000,
      maxRetries: 1,
    });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: photoUrl } },
            { type: "text", text: "이 사진에 어울리는 태그와 코멘트를 JSON으로 줘." },
          ],
        },
      ],
    });

    const text = message.content.find((b) => b.type === "text")?.text ?? "";
    const match = text.match(/\{[^{}]*\}/);
    if (!match) {
      console.error("generateAiComment: 응답에서 JSON을 못 찾아 더미로 폴백", text.slice(0, 200));
      return pickRandomComment();
    }

    const parsed = JSON.parse(match[0]) as Partial<AiComment>;
    if (!parsed.tag || !parsed.comment) {
      console.error("generateAiComment: tag/comment가 비어 더미로 폴백", match[0]);
      return pickRandomComment();
    }

    return { tag: parsed.tag, comment: parsed.comment };
  } catch (err) {
    console.error("generateAiComment: 게이트웨이 호출 실패, 더미로 폴백", err);
    return pickRandomComment();
  }
};
