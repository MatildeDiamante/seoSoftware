// Service to interact with Google Gemini AI for generating internal link recommendations
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = "gemini-2.5-flash";

// Vincolated output schema: reflects the fields that can be saved in LinkSuggestion
const linkSuggestionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    exactParagraphContext: {
      type: Type.STRING,
      description:
        "The exact paragraph (or its slightly adapted version) of the source page where the link should be inserted",
    },
    suggestedAnchorText: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-3 natural and relevant anchor text variations",
    },
    reasoning: {
      type: Type.STRING,
      description: "Brief SEO reasoning for the semantic choice",
    },
  },
  required: ["exactParagraphContext", "suggestedAnchorText", "reasoning"],
};

// Builds the prompt using only the fields actually present in the Page model
function buildPrompt(sourcePage, targetPage) {
  const sourceParagraphsBlock = (sourcePage.paragraphs || [])
    .slice(0, 12) // limits the context to control costs/tokens
    .map((text, i) => `[Paragraph ${i + 1}]: ${text}`)
    .join("\n\n");

  const targetPreview = (targetPage.paragraphs || []).slice(0, 3).join(" ");

  return `
You are a SEO expert specialized in information architecture and predictive internal linking.

Objective: Suggest where and how to insert an internal link from the SOURCE PAGE to the TARGET PAGE.

SOURCE PAGE:
URL: ${sourcePage.url}
Title: ${sourcePage.title || "N/A"}
Available paragraphs:
${sourceParagraphsBlock || "[No paragraphs available]"}

TARGET PAGE:
URL: ${targetPage.url}
Title: ${targetPage.title || "N/A"}
Content preview: ${targetPreview || "[No preview available]"}

Request:
1. Identify the paragraph in the SOURCE PAGE that is semantically most relevant to host a link to the TARGET PAGE.
2. If no paragraph is suitable as is, provide a slightly adapted version of that paragraph (without altering its meaning).
3. Provide 2-3 natural, non-over-optimized anchor text variations (avoid repeated exact-match).
4. Briefly explain the SEO/semantic reasoning behind the choice.
`;
}

// Requests a Gemini suggestion for an internal link between two pages,
// and returns an object already compatible with the fields of LinkSuggestion
export async function generateLinkRecommendation(
  sourcePage,
  targetPage,
  retries = 2,
) {
  const prompt = buildPrompt(sourcePage, targetPage);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: linkSuggestionResponseSchema,
          temperature: 0.4, // low variance: more deterministic and SEO-coherent responses
        },
      });

      const parsed = JSON.parse(response.text);

      // Defensive validation even with a constrained schema (never blindly trust AI output)
      if (
        typeof parsed.exactParagraphContext !== "string" ||
        !Array.isArray(parsed.suggestedAnchorText) ||
        parsed.suggestedAnchorText.length === 0 ||
        typeof parsed.reasoning !== "string"
      ) {
        throw new Error("Incomplete or malformed Gemini response");
      }

      return {
        exactParagraphContext: parsed.exactParagraphContext,
        suggestedAnchorText: parsed.suggestedAnchorText,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      const isLastAttempt = attempt === retries;
      console.error(
        `[GEMINI] Attempt ${attempt + 1}/${retries + 1} failed for ${sourcePage.url} -> ${targetPage.url}:`,
        error.message,
      );
      if (isLastAttempt) throw error;
    }
  }
}
