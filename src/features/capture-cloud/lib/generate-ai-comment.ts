import Anthropic from "@anthropic-ai/sdk";
import { pickRandomComment } from "./generate-comment";

export type AiComment = { tag: string; comment: string };

const SYSTEM_PROMPT =
  "너는 하루 한 장 하늘/구름 사진에 러프한 감성 코멘트를 붙이는 다이어리 앱의 톤이다. " +
  "사진이 구름/하늘이 아니어도 검증하거나 지적하지 말고 그냥 사진에 어울리는 코멘트를 붙여라. " +
  "다른 설명 없이 정확히 이 JSON 한 줄만 출력해라: " +
  '{"tag":"3~4글자 짧은 태그","comment":"한 줄 감성 코멘트(20자 이내)"}';

// 학교 API Gateway(Anthropic Messages API 호환)로 사진을 보내 코멘트를 받는다.
// 키가 없거나 호출/파싱이 실패하면 조용히 더미 코멘트로 폴백한다(CLAUDE.md: AI 코멘트는 검증 로직 없이 러프하게).
export async function generateAiComment(photoUrl: string): Promise<AiComment> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return pickRandomComment();

  try {
    const client = new Anthropic({
      apiKey,
      baseURL: "https://factchat-cloud.mindlogic.ai/v1/gateway/claude",
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
    if (!match) return pickRandomComment();

    const parsed = JSON.parse(match[0]) as Partial<AiComment>;
    if (!parsed.tag || !parsed.comment) return pickRandomComment();

    return { tag: parsed.tag, comment: parsed.comment };
  } catch {
    return pickRandomComment();
  }
}
