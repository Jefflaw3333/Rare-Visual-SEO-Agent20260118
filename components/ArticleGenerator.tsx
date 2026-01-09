import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from "@clerk/clerk-react";
import { ArticleConfig, GeneratedArticle, SavedTemplate } from '../types';
import { generateSEOArticle, generateImage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Loader2, Download, Copy, Image as ImageIcon, Check, Link as LinkIcon, ExternalLink, Code, FileText, Zap, BarChart3, LayoutTemplate, Plus, Save, Trash2, X } from 'lucide-react';

// Reusable Copy Button Component
const CopyButton = ({
  text,
  className = "text-slate-500 hover:text-white transition-colors",
  size = 14,
  title = "Copy"
}: {
  text: string,
  className?: string,
  size?: number,
  title?: string
}) => (
  <button
    onClick={() => navigator.clipboard.writeText(text)}
    className={className}
    title={title}
  >
    <Copy size={size} />
  </button>
);

const ArticleGenerator: React.FC = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedArticle | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'meta' | 'visuals' | 'links'>('content');
  const [config, setConfig] = useState<ArticleConfig>({
    mainKeyword: '',
    articleTitle: '',
    targetUrl: '',
    brandName: '',
    searchIntent: 'Informational',
    toneOfVoice: 'Opinionated Expert (20+ Years Exp)',
    includeImages: true,
    wordCount: 1500,
    readabilityLevel: '8th or 9th grade',
  });

  // Template State
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // State for image generation within article
  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});

  // Load templates on mount
  useEffect(() => {
    const saved = localStorage.getItem('seo_templates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse templates", e);
      }
    }
  }, []);

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newTemplate: SavedTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      config: {
        targetUrl: config.targetUrl,
        brandName: config.brandName,
        searchIntent: config.searchIntent,
        toneOfVoice: config.toneOfVoice,
        includeImages: config.includeImages,
        wordCount: config.wordCount,
        readabilityLevel: config.readabilityLevel
      }
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem('seo_templates', JSON.stringify(updated));
    setIsSavingTemplate(false);
    setNewTemplateName('');
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setConfig(prev => ({
        ...prev,
        ...template.config
      }));
    }
  };

  const handleDeleteTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('seo_templates', JSON.stringify(updated));
  };

  const handleGenerate = async () => {
    if (!config.mainKeyword) return;
    setLoading(true);
    setGeneratedData(null);
    try {
      const token = await getToken();
      const result = await generateSEOArticle(config, token);
      setGeneratedData(result);
    } catch (error) {
      console.error(error);
      alert("Failed to generate article. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVisual = async (index: number, prompt: string) => {
    setGeneratingImageIndex(index);
    try {
      // Check for key first as per requirement for Pro Image model
      if (window.aistudio && window.aistudio.openSelectKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      const img = await generateImage(prompt, "1K");
      if (img) {
        setGeneratedImages(prev => ({ ...prev, [index]: img }));
      }
    } catch (e) {
      alert("Error generating image. Ensure you have selected a paid API key for high-quality image generation.");
    } finally {
      setGeneratingImageIndex(null);
    }
  };

  // Calculate Keyword Density and Stats
  const keywordStats = useMemo(() => {
    if (!generatedData || !config.mainKeyword) return null;

    const text = generatedData.article_content.body_markdown;
    const keyword = config.mainKeyword;

    const normalizedText = text.toLowerCase();
    const normalizedKeyword = keyword.toLowerCase().trim();
    if (!normalizedKeyword) return null;

    // Simple word count (match words)
    const words = normalizedText.match(/\b[\w']+\b/g) || [];
    const totalWords = words.length;

    if (totalWords === 0) return { count: 0, density: "0.00", totalWords: 0 };

    // Escape regex characters in keyword
    const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Regex for whole word/phrase match
    const keywordRegex = new RegExp(`\\b${escapedKeyword}\\b`, 'g');

    const matches = normalizedText.match(keywordRegex);
    const count = matches ? matches.length : 0;

    // Density: (Count / Total Words) * 100
    const density = ((count / totalWords) * 100).toFixed(2);

    return { count, density, totalWords };
  }, [generatedData, config.mainKeyword]);

  const getFullArticleText = () => {
    if (!generatedData) return "";
    return `
# ${generatedData.article_content.h1_title}

**Meta Title**: ${generatedData.seo_metadata.meta_title}
**Meta Description**: ${generatedData.seo_metadata.meta_description}

## Key Takeaways
${generatedData.article_content.snippet_bait}

---

${generatedData.article_content.body_markdown}

---

## Frequently Asked Questions

${generatedData.article_content.faq_section.map(faq => `### ${faq.question}\n${faq.answer}`).join('\n\n')}
    `.trim();
  };

  const copyToClipboard = () => {
    const text = getFullArticleText();
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="px-8 py-6 border-b border-slate-800 bg-slate-900/50">
        <h1 className="text-2xl font-bold text-white">SEO Article Architect</h1>
        <p className="text-slate-400">Generate high-ranking content with E-E-A-T principles using Gemini 3 Pro.</p>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Input */}
        <div className="w-1/3 min-w-[350px] p-6 overflow-y-auto border-r border-slate-800 bg-slate-900/30">

          {/* Templates Section */}
          <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <LayoutTemplate size={14} /> Templates
              </label>
              {!isSavingTemplate && (
                <button
                  onClick={() => setIsSavingTemplate(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Save Current
                </button>
              )}
            </div>

            {isSavingTemplate ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Template Name..."
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                />
                <button onClick={handleSaveTemplate} className="p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500">
                  <Save size={14} />
                </button>
                <button onClick={() => setIsSavingTemplate(false)} className="p-1.5 bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                {templates.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No saved templates yet.</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {templates.map(t => (
                      <div
                        key={t.id}
                        className="group flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/50 hover:bg-slate-700/50 transition-colors cursor-pointer border border-transparent hover:border-slate-600"
                        onClick={() => handleLoadTemplate(t.id)}
                      >
                        <span className="text-sm text-slate-300 truncate font-medium">{t.name}</span>
                        <button
                          onClick={(e) => handleDeleteTemplate(e, t.id)}
                          className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="Delete Template"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Main Keyword *</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Vintage handbag charms"
                value={config.mainKeyword}
                onChange={(e) => setConfig({ ...config, mainKeyword: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Article Title (H1)</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-600"
                placeholder="Optional: Specific H1 you want"
                value={config.articleTitle}
                onChange={(e) => setConfig({ ...config, articleTitle: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Brand Name</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. RareVisual"
                value={config.brandName}
                onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Target URLs (Context)</label>
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-600 h-24 resize-none"
                placeholder="https://yourbrand.com/collection&#10;https://competitor.com/example"
                value={config.targetUrl}
                onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">Add multiple URLs (one per line) for context.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Word Count</label>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="1500"
                  value={config.wordCount}
                  onChange={(e) => setConfig({ ...config, wordCount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Search Intent</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={config.searchIntent}
                  onChange={(e) => setConfig({ ...config, searchIntent: e.target.value as any })}
                >
                  <option value="Informational">Informational</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Transactional">Transactional</option>
                  <option value="Navigational">Navigational</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Readability Level</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={config.readabilityLevel}
                onChange={(e) => setConfig({ ...config, readabilityLevel: e.target.value })}
              >
                <option value="Conversational language">Conversational language (Easy to read)</option>
                <option value="5th grade">5th grade (Very easy to read)</option>
                <option value="7th grade">7th grade (Fairly easy to read)</option>
                <option value="8th or 9th grade">8th or 9th grade (Plain language)</option>
                <option value="High School">High School (Standard)</option>
                <option value="University">University (Advanced)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tone of Voice</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={config.toneOfVoice}
                onChange={(e) => setConfig({ ...config, toneOfVoice: e.target.value })}
              >
                <option value="Opinionated Expert (20+ Years Exp)">Opinionated Expert (20+ Years Exp)</option>
                <option value="Casual & Storytelling (Humanized)">Casual & Storytelling (High Perplexity)</option>
                <option value="Professional yet approachable">Professional yet approachable</option>
                <option value="Direct & Hard-hitting">Direct & Hard-hitting</option>
                <option value="Gen Z & Trendy">Gen Z & Trendy</option>
                <option value="Luxury & Sophisticated">Luxury & Sophisticated</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !config.mainKeyword}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${loading || !config.mainKeyword
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/25'
                }`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
              {loading ? 'Designing Content...' : 'Generate Article'}
            </button>
          </div>
        </div>

        {/* Right Panel: Output */}
        <div className="flex-1 bg-slate-950 overflow-hidden flex flex-col">
          {!generatedData && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-10 text-center">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                <FileText size={32} className="opacity-50" />
              </div>
              <h3 className="text-xl font-medium text-slate-300 mb-2">Ready to create</h3>
              <p>Configure parameters on the left to start generating high-performance content.</p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-indigo-400 p-10">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="animate-pulse">Optimizing Burstiness & Perplexity...</p>
              <p className="text-sm text-slate-500 mt-2">Drafting content with Gemini 3 Pro</p>
            </div>
          )}

          {generatedData && (
            <>
              <div className="flex border-b border-slate-800 bg-slate-900/50 justify-between items-center pr-4">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'content' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                  >
                    Content Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('meta')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'meta' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                  >
                    SEO Metadata
                  </button>
                  <button
                    onClick={() => setActiveTab('visuals')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'visuals' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                  >
                    Visuals & Media
                  </button>
                  <button
                    onClick={() => setActiveTab('links')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'links' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                  >
                    Link Strategy
                  </button>
                </div>
                {activeTab === 'content' && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md transition-colors shadow-lg"
                  >
                    <Copy size={14} />
                    Copy Article
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeTab === 'content' && (
                  <div className="max-w-3xl mx-auto space-y-8">
                    {/* Meta Data Highlight Section for Writers */}
                    <div className="bg-slate-900 border-l-4 border-indigo-500 p-6 rounded-r-lg mb-8">
                      <div className="grid gap-4">
                        <div>
                          <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">Meta Title</span>
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-white font-medium">{generatedData.seo_metadata.meta_title}</p>
                            <CopyButton text={generatedData.seo_metadata.meta_title} />
                          </div>
                        </div>
                        <div>
                          <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">Meta Description</span>
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-slate-300 text-sm leading-relaxed">{generatedData.seo_metadata.meta_description}</p>
                            <CopyButton text={generatedData.seo_metadata.meta_description} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="prose prose-invert prose-indigo max-w-none">
                      <h1 className="text-4xl font-extrabold text-white mb-6 tracking-tight">{generatedData.article_content.h1_title}</h1>

                      {keywordStats && (
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50 mb-6 w-fit">
                          <div className="flex items-center gap-1.5">
                            <BarChart3 size={14} className="text-indigo-400" />
                            <span>Word Count: <span className="text-slate-200">{keywordStats.totalWords}</span></span>
                          </div>
                          <div className="w-px h-3 bg-slate-700"></div>
                          <div>
                            Keyword: <span className="text-indigo-300">"{config.mainKeyword}"</span>
                          </div>
                          <div className="w-px h-3 bg-slate-700"></div>
                          <div>
                            Uses: <span className="text-slate-200">{keywordStats.count}</span>
                          </div>
                          <div className="w-px h-3 bg-slate-700"></div>
                          <div>
                            Density: <span className={`${parseFloat(keywordStats.density) > 2.5 ? 'text-yellow-400' : 'text-emerald-400'}`}>{keywordStats.density}%</span>
                          </div>
                        </div>
                      )}

                      <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-6 mb-8">
                        <h3 className="text-indigo-300 font-bold mb-3 uppercase text-xs tracking-wider flex items-center gap-2">
                          <Zap size={14} />
                          Key Takeaways
                        </h3>
                        <div className="text-slate-200">
                          <ReactMarkdown>{generatedData.article_content.snippet_bait}</ReactMarkdown>
                        </div>
                      </div>

                      <div className="markdown-body text-slate-300 leading-relaxed space-y-6">
                        <ReactMarkdown components={{
                          h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-white mt-8 mb-4" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-slate-800 pb-2" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-indigo-100 mt-6 mb-3" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-bold text-white bg-indigo-900/30 px-1 rounded" {...props} />
                        }}>
                          {generatedData.article_content.body_markdown}
                        </ReactMarkdown>
                      </div>

                      {generatedData.internal_linking_suggestions && generatedData.internal_linking_suggestions.length > 0 && (
                        <div className="my-10 bg-slate-900 border border-slate-800 rounded-xl p-6">
                          <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <LinkIcon size={16} />
                            Internal Link Opportunities
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {generatedData.internal_linking_suggestions.map((link, idx) => (
                              <div key={idx} className="flex flex-col p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-indigo-400 font-medium text-sm">"{link.anchor_text}"</span>
                                  <div className="flex gap-2">
                                    <CopyButton
                                      text={link.anchor_text}
                                      size={12}
                                      title="Copy Anchor"
                                    />
                                  </div>
                                </div>
                                <span className="text-xs text-slate-500">Link to: {link.target_page_context}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-12 pt-8 border-t border-slate-800">
                        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                          {generatedData.article_content.faq_section.map((faq, i) => (
                            <div key={i} className="bg-slate-900/50 rounded-lg p-5 border border-slate-800/50">
                              <h3 className="font-semibold text-white mb-3 text-lg flex items-start gap-2">
                                <span className="text-indigo-500 mt-1">Q.</span>
                                {faq.question}
                              </h3>
                              <p className="text-slate-400 pl-6 leading-relaxed">{faq.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'meta' && (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-lg p-6 shadow-sm mb-6 font-sans">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-800 font-medium">RareVisual</span>
                          <span className="text-xs text-gray-500">{config.targetUrl || 'https://example.com'} › {generatedData.seo_metadata.url_slug_suggestion}</span>
                        </div>
                      </div>
                      <div className="group/title flex items-start justify-between gap-4">
                        <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-medium mb-1 truncate flex-1">
                          {generatedData.seo_metadata.meta_title}
                        </h3>
                        <CopyButton
                          text={generatedData.seo_metadata.meta_title}
                          className="text-gray-400 hover:text-gray-600 p-1 opacity-0 group-hover/title:opacity-100 transition-opacity"
                          size={16}
                          title="Copy Title"
                        />
                      </div>
                      <div className="group/desc flex items-start justify-between gap-4">
                        <p className="text-sm text-gray-600 leading-normal flex-1">
                          {generatedData.seo_metadata.meta_description}
                        </p>
                        <CopyButton
                          text={generatedData.seo_metadata.meta_description}
                          className="text-gray-400 hover:text-gray-600 p-1 opacity-0 group-hover/desc:opacity-100 transition-opacity"
                          size={16}
                          title="Copy Description"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-xs uppercase tracking-wider">Target Keyword</span>
                        <div className="text-white font-mono mt-1">{generatedData.seo_metadata.primary_keyword_focus}</div>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-xs uppercase tracking-wider">URL Slug</span>
                        <div className="text-white font-mono mt-1">{generatedData.seo_metadata.url_slug_suggestion}</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'visuals' && (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <p className="text-slate-400 mb-4">Gemini suggests the following placements for visual content. Click "Generate" to create exclusive assets.</p>
                    {generatedData.media_suggestions.map((media, idx) => (
                      <div key={idx} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col md:flex-row">
                        <div className="p-6 flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-indigo-900 text-indigo-200 text-xs px-2 py-1 rounded uppercase font-semibold">
                              {media.placement}
                            </span>
                          </div>
                          <p className="text-white font-medium mb-2">Prompt Suggestion:</p>
                          <p className="text-slate-400 text-sm italic mb-4">"{media.image_prompt}"</p>
                          <p className="text-slate-500 text-xs mb-4"><span className="font-semibold text-slate-400">Alt Text:</span> {media.alt_text}</p>

                          <button
                            onClick={() => handleGenerateVisual(idx, media.image_prompt)}
                            disabled={generatingImageIndex === idx || !!generatedImages[idx]}
                            className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                          >
                            {generatingImageIndex === idx ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                            {generatedImages[idx] ? 'Generated' : 'Generate with Gemini Pro Image'}
                          </button>
                        </div>
                        <div className="w-full md:w-64 bg-black flex items-center justify-center relative min-h-[200px]">
                          {generatedImages[idx] ? (
                            <img src={generatedImages[idx]} alt="Generated" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-slate-700 flex flex-col items-center">
                              <ImageIcon size={32} className="mb-2 opacity-50" />
                              <span className="text-xs">Preview Area</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'links' && (
                  <div className="max-w-3xl mx-auto">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white mb-2">Internal Linking Opportunities</h3>
                      <p className="text-slate-400">Strategic internal links improve crawlability and distribute page authority. Based on your content, consider linking these terms to existing pages.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {generatedData.internal_linking_suggestions && generatedData.internal_linking_suggestions.length > 0 ? (
                        generatedData.internal_linking_suggestions.map((link, idx) => (
                          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="p-3 bg-indigo-900/30 rounded-lg shrink-0">
                              <LinkIcon className="text-indigo-400" size={24} />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Anchor Text</span>
                                <span className="text-white font-medium bg-slate-800 px-2 py-0.5 rounded border border-slate-700">"{link.anchor_text}"</span>
                              </div>
                              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Context</span>
                                <span className="text-indigo-300">{link.target_page_context}</span>
                              </div>
                              <p className="text-sm text-slate-400 mt-2 border-t border-slate-800 pt-2"><span className="text-slate-500 font-medium">Why?</span> {link.reason}</p>
                            </div>
                            <div className="shrink-0 flex flex-col gap-2">
                              <CopyButton
                                text={link.anchor_text}
                                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                size={18}
                                title="Copy Anchor Text"
                              />
                              <CopyButton
                                text={`<a href="#">${link.anchor_text}</a>`}
                                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                size={18}
                                title="Copy Link HTML Stub"
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-8 text-slate-500">
                          No specific internal linking suggestions generated for this article.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleGenerator;