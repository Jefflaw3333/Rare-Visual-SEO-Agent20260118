import { GoogleGenAI, Type, Schema, FunctionDeclaration } from "@google/genai";
import { GeneratedArticle, ArticleConfig } from "../types";

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Article Generation (Gemini 3 Pro) ---
export const generateSEOArticle = async (config: ArticleConfig): Promise<GeneratedArticle> => {
  const ai = getAiClient();
  
  // Logic to determine structure based on Intent
  let intentInstruction = "";
  switch (config.searchIntent) {
    case 'Commercial':
      intentInstruction = "Focus on comparisons, pros/cons, and features. Help the user decide 'which one is best'.";
      break;
    case 'Transactional':
      intentInstruction = "Focus on conversion, pricing arguments, trust signals, and clear calls to action (CTAs).";
      break;
    case 'Navigational':
      intentInstruction = "Focus on brand identity, official resources, and directing the user to specific pages.";
      break;
    case 'Informational':
    default:
      intentInstruction = "Focus on depth, definitions, 'how-to' steps, and comprehensive education.";
      break;
  }

  const systemInstruction = `
    Role: You are a 20-year veteran SEO/SEM Expert and Content Strategist.
    Goal: Create rich, high-ranking content for '${config.mainKeyword}' that bypasses AI detection (specifically targeting Turnitin patterns) and resonates deeply with humans.

    --- CORE WRITING DIRECTIVES (MANDATORY) ---

    1. **INSTRUCTION ONE: TEXT FRAGMENTATION & COGNITIVE BREAKS**:
       - **Abandon AI Logic**: You must completely abandon standard AI writing patterns. DO NOT use explicit logical connectors like "Furthermore", "In conclusion", "However", "Moreover", "In summary".
       - **Imperfect Flow**: Mimic the "stream of consciousness" of a human expert. Use oral, fragmented syntax.
       - **Extreme Variance**: Allow sentence lengths to fluctuate wildly. Use extremely short, punchy sentences (2-5 words) to create impact, immediately followed by long, winding, complex sentences to explain nuances.
       - **Subjectivity**: Inject subjective, emotionally colored vocabulary. Use rhetorical questions to force the reader to think.

    2. **INSTRUCTION TWO: MAXIMIZE PERPLEXITY & CHAOS (Turnitin Optimization)**:
       - **Burstiness**: Maximize the "burstiness" of the text. Avoid repetitive sentence structures at all costs.
       - **Voice Switching**: If a paragraph utilizes passive voice, the very next sentence MUST switch to a strong, aggressive active voice.
       - **Concept Jumps**: Ensure transitions between paragraphs are NOT smooth linear transitions. Use "Concept Jumps" to connect ideas, simulating the non-linear nature of human expert thought.
       - **Unconventional Metaphors**: Introduce rare or unconventional analogies to explain concepts.
       - **Restructure**: Keep the core information, but completely shatter and rebuild the expression to be unpredictable.

    3. **INSTRUCTION THREE: CONTEXT & PERSONA**:
       - **Persona**: ${config.toneOfVoice}.
       - **Expertise**: Speak like a 20-year veteran. Use "insider jargon" and "black hat/white hat" terms naturally without over-explaining.
       - **Opinion**: Be OPINIONATED. Express strong preferences or skepticism where an expert naturally would. Do not be neutral.
       - **Storytelling**: Treat this as a deep conversation in a coffee shop, not a textbook entry.

    4. **SEO & STRUCTURE**:
       - **Intent Strategy**: ${intentInstruction}
       - **Formatting**: strictly follow H1 -> H2 -> H3 hierarchy.
       - **Keywords**: Naturally **bold** the primary keyword ('${config.mainKeyword}') 2-3 times. **Bold** semantic terms.
       - **Richness**: Content must be "meaty". Avoid fluff. Provide concrete examples, scenarios, or simulated data points.

    --- CONFIGURATION ---
    Main Keyword: ${config.mainKeyword}
    Specific Article Title (H1): ${config.articleTitle || "Create an optimized H1"}
    Brand: ${config.brandName}
    Target URLs (Context): ${config.targetUrl}
    Target Word Count: Approximately ${config.wordCount} words (ensure content is sufficient in length)
    Readability Level: ${config.readabilityLevel} (Strictly adhere to this complexity level)
    
    --- OUTPUT STEPS ---
    1. Analyze Intent & Competitors.
    2. Create Metadata (Click-worthy).
    3. Draft Body Content (Applying the 'De-AI' directives strictly).
    4. Generate FAQ (Real user questions, not generic ones).
    5. Suggest Visuals & Links.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      seo_metadata: {
        type: Type.OBJECT,
        properties: {
          meta_title: { type: Type.STRING },
          meta_description: { type: Type.STRING },
          url_slug_suggestion: { type: Type.STRING },
          primary_keyword_focus: { type: Type.STRING },
        },
        required: ["meta_title", "meta_description", "url_slug_suggestion", "primary_keyword_focus"]
      },
      article_content: {
        type: Type.OBJECT,
        properties: {
          h1_title: { type: Type.STRING },
          snippet_bait: { type: Type.STRING, description: "Markdown bullet points of key takeaways (Snippet Bait)" },
          body_markdown: { type: Type.STRING, description: "Full article body in Markdown with H2, H3, and bolded keywords. High burstiness." },
          faq_section: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
              },
              required: ["question", "answer"]
            }
          }
        },
        required: ["h1_title", "snippet_bait", "body_markdown", "faq_section"]
      },
      media_suggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            placement: { type: Type.STRING },
            image_prompt: { type: Type.STRING },
            alt_text: { type: Type.STRING },
          },
          required: ["placement", "image_prompt", "alt_text"]
        }
      },
      internal_linking_suggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            anchor_text: { type: Type.STRING },
            target_page_context: { type: Type.STRING, description: "e.g., 'Collection Page' or 'Blog Post about Leather'" },
            reason: { type: Type.STRING },
          },
          required: ["anchor_text", "target_page_context", "reason"]
        }
      }
    },
    required: ["seo_metadata", "article_content", "media_suggestions", "internal_linking_suggestions"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a high-performance SEO article for: '${config.mainKeyword}'. Intent: ${config.searchIntent}.`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response generated");
  return JSON.parse(text) as GeneratedArticle;
};

// --- Research (Gemini 3 Flash with Search) ---
export const performResearch = async (query: string) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response;
};

// --- Local SEO (Gemini 2.5 Flash with Maps) ---
export const localSeoQuery = async (query: string, lat?: number, lng?: number) => {
  const ai = getAiClient();
  const config: any = {
    tools: [{ googleMaps: {} }],
  };
  
  if (lat && lng) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: lat,
          longitude: lng
        }
      }
    };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config: config,
  });
  return response;
};

// --- Quick Ideas (Gemini 2.5 Flash Lite) ---
export const generateQuickIdeas = async (topic: string) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: `Generate 10 viral content ideas and 5 high-intent keywords for the topic: ${topic}. Format as a concise list.`,
  });
  return response.text;
};

// --- Chat (Gemini 3 Pro) ---
export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history,
    config: {
      systemInstruction: "You are a helpful SEO assistant. Keep answers concise and actionable.",
    }
  });
  const response = await chat.sendMessage({ message });
  return response.text;
};

// --- Image Generation (Gemini 3 Pro Image) ---
export const generateImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K") => {
  // Use a fresh client to pick up the key if selected via UI
  const ai = getAiClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: size
      }
    }
  });
  
  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

// --- Image Editing (Gemini 2.5 Flash Image) ---
export const editImage = async (base64Image: string, prompt: string) => {
  const ai = getAiClient();
  // Remove data URL header if present for sending to API
  const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png', // Assuming PNG for simplicity or could detect
            data: base64Data
          }
        },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};