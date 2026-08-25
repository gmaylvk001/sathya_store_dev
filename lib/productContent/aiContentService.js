function buildPrompt({ category, brand, productCode, productName }) {
  return `You are an e-commerce product content generator.

Generate product details in valid JSON only.

Product:
{
"Category":"${category}"
"Brand":"${brand}"
"Product Code":"${productCode}"
"Product Name":"${productName}"
}

Instructions:

1. Return ONLY valid JSON.
2. Do not include markdown.
3. Generate SEO-friendly content.
4. Description should be 150-250 words.
5. Highlights should contain 8 bullet points.
6. Key Features should contain 5 bullet points.
7. Meta title maximum 60 characters.
8. Meta description maximum 160 characters.
9. Meta keywords should be comma separated.

JSON format:

{
  "category":"",
  "brand":"",
  "product_code":"",
  "product_name":"",
  "description":"",
  "highlights":[],
  "key_features":[],
  "meta_title":"",
  "meta_description":"",
  "meta_keywords":""
}`;
}

function parseJsonContent(raw) {
  if (!raw) return null;
  let text = String(raw).trim();
  text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    text = text.slice(start, end + 1);
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractResponsesText(result) {
  if (result?.output_text) return result.output_text;
  const outputs = Array.isArray(result?.output) ? result.output : [];
  for (const item of outputs) {
    const contents = Array.isArray(item?.content) ? item.content : [];
    for (const part of contents) {
      if (part?.text) return part.text;
    }
  }
  return null;
}

function normalizeContent(parsed, fallback = {}) {
  if (!parsed || typeof parsed !== "object") return null;
  const highlights = Array.isArray(parsed.highlights)
    ? parsed.highlights.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const keyFeatures = Array.isArray(parsed.key_features)
    ? parsed.key_features.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  return {
    category: String(parsed.category || fallback.category || "").trim(),
    brand: String(parsed.brand || fallback.brand || "").trim(),
    product_code: String(parsed.product_code || fallback.productCode || "").trim(),
    product_name: String(parsed.product_name || fallback.productName || "").trim(),
    description: String(parsed.description || "").trim(),
    highlights,
    key_features: keyFeatures,
    meta_title: String(parsed.meta_title || "").trim().slice(0, 60),
    meta_description: String(parsed.meta_description || "").trim().slice(0, 160),
    meta_keywords: String(parsed.meta_keywords || "").trim(),
  };
}

async function generateViaResponsesApi({ apiKey, model, prompt }) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
      text: {
        format: {
          type: "json_object",
        },
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `Responses API ${res.status}`;
    throw new Error(message);
  }

  return parseJsonContent(extractResponsesText(data));
}

async function generateViaChatCompletions({ apiKey, model, prompt }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an e-commerce product content generator. Return ONLY valid JSON.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `Chat Completions API ${res.status}`;
    throw new Error(message);
  }

  return parseJsonContent(data?.choices?.[0]?.message?.content);
}

export async function generateProductAiContent({
  category = "",
  brand = "",
  productCode = "",
  productName = "",
} = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const prompt = buildPrompt({ category, brand, productCode, productName });
  const model = process.env.OPENAI_PRODUCT_MODEL || "gpt-4o";
  const fallback = { category, brand, productCode, productName };

  try {
    const parsed = await generateViaResponsesApi({ apiKey, model, prompt });
    const content = normalizeContent(parsed, fallback);
    if (content) return { ...content, _source: "openai-responses" };
  } catch (err) {
    console.warn("OpenAI responses API failed, falling back:", err.message);
  }

  const parsed = await generateViaChatCompletions({ apiKey, model, prompt });
  const content = normalizeContent(parsed, fallback);
  if (!content) {
    throw new Error("OpenAI did not return valid product JSON");
  }
  return { ...content, _source: "openai-chat" };
}
