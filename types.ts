export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ARTICLE_GENERATOR = 'ARTICLE_GENERATOR',
  IMAGE_STUDIO = 'IMAGE_STUDIO',
  RESEARCH = 'RESEARCH',
  LOCAL_SEO = 'LOCAL_SEO',
  CHAT = 'CHAT',
  QUICK_IDEAS = 'QUICK_IDEAS'
}

export interface ArticleConfig {
  mainKeyword: string;
  articleTitle?: string;
  targetUrl: string;
  brandName: string;
  searchIntent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  toneOfVoice: string;
  includeImages: boolean;
  wordCount: number; // New
  readabilityLevel: string; // New
}

export interface SavedTemplate {
  id: string;
  name: string;
  config: Omit<ArticleConfig, 'mainKeyword' | 'articleTitle'>;
}

export interface GeneratedArticle {
  seo_metadata: {
    meta_title: string;
    meta_description: string;
    url_slug_suggestion: string;
    primary_keyword_focus: string;
  };
  article_content: {
    h1_title: string;
    snippet_bait: string;
    body_markdown: string;
    faq_section: Array<{ question: string; answer: string }>;
  };
  media_suggestions: Array<{
    placement: string;
    image_prompt: string;
    alt_text: string;
  }>;
  internal_linking_suggestions: Array<{
    anchor_text: string;
    target_page_context: string;
    reason: string;
  }>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ResearchResult {
  text: string;
  groundingChunks?: Array<{
    web?: { uri: string; title: string };
  }>;
}

export interface MapResult {
  text: string;
  groundingChunks?: Array<{
    maps?: {
      uri: string;
      title: string;
      placeAnswerSources?: any[];
    }
  }>;
}