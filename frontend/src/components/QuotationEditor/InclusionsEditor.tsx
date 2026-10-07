import React, { useState } from 'react';
import { InclusionSection } from '../../types';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ListChecks,
  Check,
  CornerDownRight,
  FileText,
  ClipboardPaste,
  X
} from 'lucide-react';

interface InclusionsEditorProps {
  inclusions: InclusionSection[];
  onChange: (inclusions: InclusionSection[]) => void;
}

/**
 * Strips leading bullet markers (•, *, -, –, —, etc.) and numbering like "1. ", "1) "
 */
export function cleanBulletLine(line: string): string {
  return line
    .replace(/^(\d+[.)]\s+|[\s•*\-–—\u2022\u25E6\u25AA\u25CF+>]+\s*)/, '')
    .trim();
}

interface ParsedSection {
  title: string;
  subtitle?: string;
  items: string[];
}

export function parseBulkInclusions(text: string): ParsedSection[] {
  const lines = text.split(/\r?\n/);
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      continue;
    }

    const hasBullet = /^[\s•*\-–—\u2022\u25E6\u25AA\u25CF+]/.test(trimmed);
    const isNumbered = /^\d+[.)]\s+/.test(trimmed);
    const isExplicitHeader = /^(={2,}|#{1,4}|\[)/.test(trimmed);
    const prevWasEmpty = i > 0 && !lines[i - 1].trim();

    const isHeader =
      isExplicitHeader ||
      trimmed.endsWith(':') ||
      currentSection === null ||
      (prevWasEmpty && !hasBullet && !isNumbered);

    if (isHeader) {
      const titleStr = trimmed
        .replace(/^[=#{}[\]*]+|[=#{}[\]*:]+$/g, '')
        .trim();

      let title = titleStr;
      let subtitle: string | undefined = undefined;

      const parenMatch = titleStr.match(/^([^(]+)\s*\(([^)]+)\)$/);
      if (parenMatch) {
        title = parenMatch[1].trim();
        subtitle = parenMatch[2].trim();
      } else if (titleStr.includes(' - ') && !titleStr.toLowerCase().includes('photo') && !titleStr.toLowerCase().includes('video')) {
        const parts = titleStr.split(' - ');
        title = parts[0].trim();
        subtitle = parts.slice(1).join(' - ').trim();
      }

      currentSection = {
        title: title || 'Inclusions',
        subtitle,
        items: []
      };
      sections.push(currentSection);
    } else {
      const item = cleanBulletLine(trimmed);
      if (item) {
        if (!currentSection) {
          currentSection = {
            title: 'Inclusions',
            items: []
          };
          sections.push(currentSection);
        }
        currentSection.items.push(item);
      }
    }
  }

  return sections.filter(s => s.items.length > 0 || s.title);
}

export const InclusionsEditor: React.FC<InclusionsEditorProps> = ({
  inclusions,
  onChange
}) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionSubtitle, setNewSectionSubtitle] = useState('');
  const [newSectionItemsText, setNewSectionItemsText] = useState('');
  const [newBulletInputs, setNewBulletInputs] = useState<{ [sectionId: string]: string }>({});

  // Local raw text for each section's textarea to preserve multi-line editing, newlines and cursor
  const [rawTextMap, setRawTextMap] = useState<Record<string, string>>({});

  // View mode per section: default is 'textarea' (Single Large Textbox for copy-paste)
  const [viewModes, setViewModes] = useState<Record<string, 'textarea' | 'list'>>({});

  // Bulk Import modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState<'replace' | 'append'>('replace');

  const getSectionKey = (sec: InclusionSection, idx: number) => sec.id || `sec_${idx}`;

  const setSectionViewMode = (secKey: string, mode: 'textarea' | 'list') => {
    setViewModes(prev => ({ ...prev, [secKey]: mode }));
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    const secId = 'sec_' + Date.now();
    const items = newSectionItemsText
      .split('\n')
      .map(cleanBulletLine)
      .filter(Boolean);

    const newSec: InclusionSection = {
      id: secId,
      title: newSectionTitle.trim(),
      subtitle: newSectionSubtitle.trim() || undefined,
      items
    };
    onChange([...inclusions, newSec]);
    if (newSectionItemsText.trim()) {
      setRawTextMap(prev => ({ ...prev, [secId]: newSectionItemsText }));
    }
    setNewSectionTitle('');
    setNewSectionSubtitle('');
    setNewSectionItemsText('');
  };

  const handleDeleteSection = (index: number) => {
    const updated = inclusions.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === inclusions.length - 1)
    ) {
      return;
    }
    const updated = [...inclusions];
    const target = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    onChange(updated);
  };

  const handleUpdateSectionTitle = (index: number, title: string) => {
    const updated = [...inclusions];
    updated[index] = { ...updated[index], title };
    onChange(updated);
  };

  const handleUpdateSectionSubtitle = (index: number, subtitle: string) => {
    const updated = [...inclusions];
    updated[index] = { ...updated[index], subtitle: subtitle || undefined };
    onChange(updated);
  };

  // Textarea multiline editing handler
  const handleTextareaChange = (secKey: string, sIdx: number, val: string) => {
    setRawTextMap(prev => ({ ...prev, [secKey]: val }));

    const lines = val.split('\n');
    const items = lines
      .map(cleanBulletLine)
      .filter(Boolean);

    const updated = [...inclusions];
    updated[sIdx] = { ...updated[sIdx], items };
    onChange(updated);
  };

  // Clean bullet symbols (•, -, *, numbers) from textarea
  const handleCleanBullets = (secKey: string, sIdx: number) => {
    const currentVal = rawTextMap[secKey] !== undefined ? rawTextMap[secKey] : (inclusions[sIdx]?.items || []).join('\n');
    const lines = currentVal.split('\n');
    const cleaned = lines.map(cleanBulletLine);
    const newText = cleaned.join('\n');
    setRawTextMap(prev => ({ ...prev, [secKey]: newText }));

    const items = cleaned.filter(Boolean);
    const updated = [...inclusions];
    updated[sIdx] = { ...updated[sIdx], items };
    onChange(updated);
  };

  // Clear all items in section
  const handleClearSectionItems = (secKey: string, sIdx: number) => {
    if ((inclusions[sIdx]?.items?.length || 0) > 1 && !window.confirm('Clear all items in this section?')) {
      return;
    }
    setRawTextMap(prev => ({ ...prev, [secKey]: '' }));
    const updated = [...inclusions];
    updated[sIdx] = { ...updated[sIdx], items: [] };
    onChange(updated);
  };

  // List view item handlers
  const handleAddBullet = (sectionId: string, sectionIndex: number) => {
    const text = newBulletInputs[sectionId]?.trim();
    if (!text) return;

    // Multiline paste support in single input too
    const newLines = text.split('\n').map(cleanBulletLine).filter(Boolean);
    if (newLines.length === 0) return;

    const updated = [...inclusions];
    const newItems = [...updated[sectionIndex].items, ...newLines];
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      items: newItems
    };
    onChange(updated);
    setRawTextMap(prev => ({ ...prev, [sectionId]: newItems.join('\n') }));
    setNewBulletInputs(prev => ({ ...prev, [sectionId]: '' }));
  };

  const handleUpdateBullet = (sectionIndex: number, bulletIndex: number, text: string) => {
    const updated = [...inclusions];
    const items = [...updated[sectionIndex].items];
    items[bulletIndex] = text;
    updated[sectionIndex] = { ...updated[sectionIndex], items };
    const secKey = getSectionKey(updated[sectionIndex], sectionIndex);
    setRawTextMap(prev => ({ ...prev, [secKey]: items.join('\n') }));
    onChange(updated);
  };

  const handleDeleteBullet = (sectionIndex: number, bulletIndex: number) => {
    const updated = [...inclusions];
    const items = updated[sectionIndex].items.filter((_, i) => i !== bulletIndex);
    updated[sectionIndex] = { ...updated[sectionIndex], items };
    const secKey = getSectionKey(updated[sectionIndex], sectionIndex);
    setRawTextMap(prev => ({ ...prev, [secKey]: items.join('\n') }));
    onChange(updated);
  };

  const handleMoveBullet = (sectionIndex: number, bulletIndex: number, direction: 'up' | 'down') => {
    const items = [...inclusions[sectionIndex].items];
    if (
      (direction === 'up' && bulletIndex === 0) ||
      (direction === 'down' && bulletIndex === items.length - 1)
    ) {
      return;
    }
    const target = direction === 'up' ? bulletIndex - 1 : bulletIndex + 1;
    const temp = items[bulletIndex];
    items[bulletIndex] = items[target];
    items[target] = temp;

    const updated = [...inclusions];
    updated[sectionIndex] = { ...updated[sectionIndex], items };
    const secKey = getSectionKey(updated[sectionIndex], sectionIndex);
    setRawTextMap(prev => ({ ...prev, [secKey]: items.join('\n') }));
    onChange(updated);
  };

  // Bulk paste importer
  const handleApplyBulk = () => {
    if (!bulkText.trim()) return;
    const parsed = parseBulkInclusions(bulkText);
    if (parsed.length === 0) return;

    const newSections: InclusionSection[] = parsed.map((p, idx) => ({
      id: 'sec_bulk_' + Date.now() + '_' + idx,
      title: p.title,
      subtitle: p.subtitle,
      items: p.items
    }));

    if (bulkMode === 'replace') {
      onChange(newSections);
    } else {
      onChange([...inclusions, ...newSections]);
    }

    setRawTextMap({});
    setShowBulkModal(false);
    setBulkText('');
  };

  // Preset Template Loader
  const loadPreset = (type: 'new' | 'reference' | 'wedding' | 'corporate') => {
    setRawTextMap({});
    setViewModes({});

    if (type === 'new') {
      if (inclusions.length > 0 && !window.confirm('Clear all inclusion categories to start fresh from the beginning?')) {
        return;
      }
      onChange([]);
      return;
    }
    if (type === 'reference') {
      onChange([
        {
          id: 'sec_1',
          title: 'Photography Inclusions',
          items: ['Traditional Photos', 'Traditional Videos', 'Candid Photos']
        },
        {
          id: 'sec_2',
          title: 'Decorations',
          subtitle: 'As per the selected styles and concept',
          items: []
        },
        {
          id: 'sec_3',
          title: 'Food Inclusions',
          subtitle: 'Morning Tiffin - 80nos 7am',
          items: [
            'Coffee',
            'Kasi halwa',
            'Mini ponda',
            'Idly',
            'Poori',
            'pongal',
            'Vadacurry',
            'OnionSambar',
            'Coconut chutney',
            'Kara chutney',
            'Water bottle',
            'Banana leaf',
            'Service boys'
          ]
        },
        {
          id: 'sec_4',
          title: 'Counter items',
          items: ['Ice cream (abucatta)', 'Beeda 200nos', 'Fruits salad -200nos (2fruits)']
        },
        {
          id: 'sec_5',
          title: 'Deliverables',
          items: ['Frame', 'Album', 'Retouched Images']
        },
        {
          id: 'sec_6',
          title: 'Lunch (300nos)12.pm',
          items: [
            'Special methuvadai',
            'Semiya payasam',
            'Laddu',
            'Corn cutlet',
            'Vazhakka chops/vendakka chips',
            'Rice',
            'Kathambam Sambar',
            'Rasam',
            'Curd',
            'Moorekuzhambu/vathakuzhambu',
            'National porial/cabbage poriyal',
            'Karunai mazhiyal',
            'Podalanga kootu/veg aviyal',
            'Milagu Appalam',
            'Moore milaga',
            'Pickle',
            'Water bottle',
            'Banana leaf',
            'Service boys'
          ]
        }
      ]);
    } else if (type === 'wedding') {
      onChange([
        {
          id: 'sec_w1',
          title: 'STAGE DECORATION & MANDAP',
          subtitle: 'Traditional Floral & Contemporary Ambience',
          items: [
            'Grand Entrance Arch with Fresh Exotic Flowers',
            'Mandap Drapes with Warm Ambient LED Spotlights',
            'Walkway Flower Petals Carpet & Brass Vilakku Urli',
            'Bride & Groom Grand Sofa Set',
            'Customized Couple Name Board with Floral Accents'
          ]
        },
        {
          id: 'sec_w2',
          title: 'PHOTOGRAPHY & VIDEOGRAPHY',
          items: [
            '2 Traditional Photographers (Full Event Coverage)',
            '1 Candid Wedding Specialist Photographer',
            '2 Cinematic HD Videographers with Gimbal',
            'Drone Aerial Coverage for Reception',
            '1 Signature Photobook Album (40 Pages)',
            'Teaser Video Reel (1 Minute for Instagram)',
            'Complete High Resolution Digital Drive'
          ]
        },
        {
          id: 'sec_w3',
          title: 'SPECIAL EFFECTS & SFX',
          items: [
            'Cold Pyros during Bride & Groom Entry (4 Shots)',
            'Dry Ice Low Smoke Cloud on Stage',
            'Rose Petals Air Blast Cannon',
            'Confetti Shower during Muhurtham Moment'
          ]
        },
        {
          id: 'sec_w4',
          title: 'CULTURAL MUSIC & ENTERTAINMENT',
          subtitle: 'Traditional Artists',
          items: [
            'Mangalavathiyam Nadaswaram & Thavil Troupe - 5 Nos',
            'Classical Instrumental Fusion Band for Reception',
            'Professional Event Coordinator on Site'
          ]
        }
      ]);
    } else if (type === 'corporate') {
      onChange([
        {
          id: 'sec_c1',
          title: 'STAGE, AUDIO & VISUAL SETUP',
          items: [
            'High Definition P3 LED Wall (24ft x 12ft)',
            'JBL Line Array Sound System with Digital Mixer',
            '4 Wireless Collar & Handheld Cordless Mics',
            'Podium with Gooseneck Microphones',
            'Stage Lighting Rig with Moving Heads & Wash'
          ]
        },
        {
          id: 'sec_c2',
          title: 'REGISTRATION & BRANDING',
          items: [
            'Kiosk Registration Counters with Fast Lanyard Badging',
            'Selfie Photo Booth with Company Backdrop',
            'Directional Signages & Standees (6 Nos)',
            'Welcome Hostesses with Corporate Kit'
          ]
        }
      ]);
    }
  };

  const detectedBulkSections = bulkText.trim() ? parseBulkInclusions(bulkText) : [];

  return (
    <div className="space-y-6">
      {/* Preset bar */}
      <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
          <Sparkles size={14} className="text-brand-gold shrink-0" />
          <span>Quick Inclusions Templates:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => loadPreset('new')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
              inclusions.length === 0
                ? 'bg-brand-maroon text-brand-gold-light border border-brand-gold'
                : 'bg-[#251c2e] hover:bg-[#34273e] text-brand-gold-light border border-brand-gold/50'
            }`}
            title="Start fresh from the beginning with blank inclusions"
          >
            <Plus size={13} className="text-brand-gold" />
            <span>New (Start from Beginning)</span>
          </button>
          <button
            type="button"
            onClick={() => loadPreset('reference')}
            className="px-2.5 sm:px-3 py-1.5 bg-stone-800/90 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded-lg text-xs font-medium transition"
          >
            Reference Quote Template
          </button>
          <button
            type="button"
            onClick={() => loadPreset('wedding')}
            className="px-2.5 sm:px-3 py-1.5 bg-stone-800/90 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded-lg text-xs font-medium transition"
          >
            Grand Wedding
          </button>
          <button
            type="button"
            onClick={() => loadPreset('corporate')}
            className="px-2.5 sm:px-3 py-1.5 bg-stone-800/90 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded-lg text-xs font-medium transition"
          >
            Corporate Conference
          </button>

          {/* Bulk Paste All Button */}
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-brand-gold/40 text-brand-gold-light rounded-lg text-xs font-medium transition"
            title="Bulk paste multiple sections and bullet items at once"
          >
            <ClipboardPaste size={13} className="text-brand-gold" />
            <span>Bulk Paste All</span>
          </button>
        </div>
      </div>

      {/* Empty State when starting from scratch */}
      {inclusions.length === 0 && (
        <div className="bg-[#18151f] border border-dashed border-stone-700/80 rounded-xl p-6 sm:p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-brand-maroon/30 border border-brand-gold/40 flex items-center justify-center">
            <Sparkles size={20} className="text-brand-gold" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-stone-200">Starting from the Beginning</h4>
            <p className="text-xs text-stone-400 max-w-md mx-auto">
              No inclusions yet. Fill out the &quot;+ Add New Inclusions Section&quot; form below to build your custom scope, or choose one of the templates above.
            </p>
          </div>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-4">
        {inclusions.map((section, sIdx) => {
          const secKey = getSectionKey(section, sIdx);
          const isTextareaMode = (viewModes[secKey] ?? 'textarea') === 'textarea';
          const textValue = rawTextMap[secKey] !== undefined ? rawTextMap[secKey] : section.items.join('\n');
          const linesCount = textValue.split('\n').length;

          return (
            <div
              key={secKey}
              className="bg-[#1c1920] border border-stone-800/90 rounded-xl p-5 shadow-sm transition hover:border-stone-700"
            >
              {/* Section Header Controls */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-800/80 mb-3.5">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateSectionTitle(sIdx, e.target.value)}
                    placeholder="Section Title (e.g. PHOTOGRAPHY INCLUSIONS)"
                    className="bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-gold-light focus:outline-none focus:border-brand-gold transition"
                  />
                  <input
                    type="text"
                    value={section.subtitle || ''}
                    onChange={(e) => handleUpdateSectionSubtitle(sIdx, e.target.value)}
                    placeholder="Optional Subtitle (e.g. WEDDING / Morning Tiffin)"
                    className="bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-brand-gold transition"
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveSection(sIdx, 'up')}
                    disabled={sIdx === 0}
                    className="p-1.5 text-stone-400 hover:text-stone-100 disabled:opacity-30 rounded hover:bg-stone-800 transition"
                    title="Move Section Up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSection(sIdx, 'down')}
                    disabled={sIdx === inclusions.length - 1}
                    className="p-1.5 text-stone-400 hover:text-stone-100 disabled:opacity-30 rounded hover:bg-stone-800 transition"
                    title="Move Section Down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSection(sIdx)}
                    className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-950/30 transition ml-1"
                    title="Delete Section"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Inclusions Content Area */}
              <div className="space-y-2">
                {/* Items Controls Bar */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-300 text-xs">
                      {isTextareaMode ? 'Inclusion Items (one per line):' : 'Bullet Items:'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#121015] border border-stone-800 text-[11px] text-brand-gold font-medium">
                      {section.items.length} {section.items.length === 1 ? 'bullet' : 'bullets'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Clean Bullets Button */}
                    {isTextareaMode && textValue.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleCleanBullets(secKey, sIdx)}
                        title="Strip leading bullet symbols (•, -, *) and numbering"
                        className="text-[11px] px-2 py-1 text-stone-400 hover:text-brand-gold bg-stone-900/60 hover:bg-stone-800 border border-stone-800 rounded transition flex items-center gap-1"
                      >
                        <Sparkles size={11} className="text-brand-gold" />
                        <span>Clean Bullets</span>
                      </button>
                    )}

                    {/* Clear all items */}
                    {section.items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleClearSectionItems(secKey, sIdx)}
                        title="Clear all bullet items in this section"
                        className="text-[11px] px-1.5 py-1 text-stone-500 hover:text-red-400 rounded transition"
                      >
                        Clear
                      </button>
                    )}

                    {/* Mode Toggle: Single Large Text Box vs List View */}
                    <div className="flex items-center bg-[#121015] border border-stone-800 rounded-lg p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSectionViewMode(secKey, 'textarea')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition ${
                          isTextareaMode
                            ? 'bg-brand-maroon text-brand-gold-light font-bold shadow-sm'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                        title="Single large text box for easy copy-pasting"
                      >
                        <FileText size={11} />
                        <span>Single Text Box</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionViewMode(secKey, 'list')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition ${
                          !isTextareaMode
                            ? 'bg-brand-maroon text-brand-gold-light font-bold shadow-sm'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                        title="Individual bullet rows for reordering"
                      >
                        <ListChecks size={11} />
                        <span>List View</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SINGLE LARGE TEXTBOX MODE (DEFAULT) */}
                {isTextareaMode ? (
                  <div className="space-y-1.5">
                    <textarea
                      value={textValue}
                      onChange={(e) => handleTextareaChange(secKey, sIdx, e.target.value)}
                      placeholder={'Paste or type inclusion items here (one per line)...\n\nExample:\nTraditional Photos - 1\nTraditional Videos - 1\nCandid Photos - 1\nCandid Video - 1'}
                      rows={Math.max(5, Math.min(14, linesCount + 1))}
                      className="w-full bg-[#121015] border border-stone-700/80 focus:border-brand-gold rounded-lg p-3 text-xs text-stone-200 font-mono leading-relaxed focus:outline-none transition resize-y placeholder-stone-600 focus:ring-1 focus:ring-brand-gold/30 min-h-[110px]"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 px-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-brand-gold font-bold">&#8226;</span>
                        <span>Copy and paste entire list directly. Each non-empty line becomes a bullet point in the quotation.</span>
                      </span>
                      <span className="text-stone-400 font-medium">
                        {section.items.length} {section.items.length === 1 ? 'bullet' : 'bullets'} active
                      </span>
                    </div>
                  </div>
                ) : (
                  /* LIST VIEW MODE (Individual inputs) */
                  <div className="space-y-2 pl-2 pt-1">
                    {section.items.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2 group">
                        <span className="text-stone-500 font-bold text-xs select-none">&#8226;</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => handleUpdateBullet(sIdx, bIdx, e.target.value)}
                          className="flex-1 bg-[#141217] border border-transparent hover:border-stone-700 focus:border-brand-gold rounded px-2.5 py-1 text-xs text-stone-200 focus:outline-none transition"
                        />
                        <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => handleMoveBullet(sIdx, bIdx, 'up')}
                            disabled={bIdx === 0}
                            className="p-1 text-stone-500 hover:text-stone-300 disabled:opacity-20"
                            title="Move Bullet Up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveBullet(sIdx, bIdx, 'down')}
                            disabled={bIdx === section.items.length - 1}
                            className="p-1 text-stone-500 hover:text-stone-300 disabled:opacity-20"
                            title="Move Bullet Down"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBullet(sIdx, bIdx)}
                            className="p-1 text-red-400 hover:text-red-300"
                            title="Delete Bullet"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Bullet Input */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-800/60">
                      <CornerDownRight size={13} className="text-brand-gold" />
                      <input
                        type="text"
                        value={newBulletInputs[section.id] || ''}
                        onChange={(e) =>
                          setNewBulletInputs(prev => ({ ...prev, [section.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBullet(section.id, sIdx);
                          }
                        }}
                        placeholder="Type new bullet item (or paste multiple lines) and press Enter..."
                        className="flex-1 bg-[#121015] border border-stone-800 focus:border-brand-gold/60 rounded px-2.5 py-1 text-xs text-stone-300 focus:outline-none transition placeholder-stone-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddBullet(section.id, sIdx)}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded font-medium transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Section Card */}
      <div className="bg-[#1c1920]/80 border border-dashed border-stone-700/80 rounded-xl p-5">
        <h4 className="text-xs font-semibold text-brand-gold uppercase tracking-wider mb-3">
          + Add New Inclusions Section
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="Section Heading (e.g. CATERING SERVICE)"
            className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
          />
          <input
            type="text"
            value={newSectionSubtitle}
            onChange={(e) => setNewSectionSubtitle(e.target.value)}
            placeholder="Optional Subheading (e.g. Morning Tiffin - 100 Nos)"
            className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
          />
        </div>

        {/* Textbox directly in Add Section */}
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-stone-400 mb-1">
            Inclusion Items (one per line, paste content here):
          </label>
          <textarea
            value={newSectionItemsText}
            onChange={(e) => setNewSectionItemsText(e.target.value)}
            placeholder={'Traditional Photos - 1\nTraditional Videos - 1\nCandid Photos - 1'}
            rows={4}
            className="w-full bg-[#121015] border border-stone-700 rounded-lg p-3 text-xs text-stone-200 font-mono leading-relaxed focus:outline-none focus:border-brand-gold transition placeholder-stone-600 resize-y"
          />
        </div>

        <button
          type="button"
          onClick={handleAddSection}
          className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs font-semibold text-brand-gold-light transition"
        >
          <Plus size={14} />
          <span>Add Section</span>
        </button>
      </div>

      {/* Bulk Paste Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1920] border border-stone-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <ClipboardPaste size={18} className="text-brand-gold" />
                <h3 className="text-sm font-bold text-stone-100">Bulk Paste Inclusions</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="p-1 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              Paste your entire scope or event quotation inclusions below. Sections and bullet items are detected automatically. Blank lines separate sections.
            </p>

            <div className="flex-1 min-h-0 flex flex-col space-y-2">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`Photography Inclusions (WEDDING)\nTraditional Photos - 1\nTraditional Videos - 1\nCandid Photos - 1\n\nDeliverables\nFrame - 1\nAlbum - 1`}
                className="flex-1 w-full min-h-[220px] bg-[#121015] border border-stone-700 rounded-xl p-3.5 text-xs text-stone-200 font-mono leading-relaxed focus:outline-none focus:border-brand-gold transition resize-none placeholder-stone-600"
              />

              {/* Live Detection Summary */}
              {detectedBulkSections.length > 0 && (
                <div className="bg-[#141217] border border-stone-800 rounded-lg p-2.5 text-xs flex items-center justify-between">
                  <span className="text-stone-300">
                    Detected: <strong className="text-brand-gold">{detectedBulkSections.length} sections</strong> ({detectedBulkSections.reduce((acc, s) => acc + s.items.length, 0)} bullets)
                  </span>
                  <span className="text-stone-500 text-[11px]">
                    {detectedBulkSections.map(s => s.title).join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-800">
              <div className="flex items-center gap-4 text-xs text-stone-300 w-full sm:w-auto">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkMode"
                    value="replace"
                    checked={bulkMode === 'replace'}
                    onChange={() => setBulkMode('replace')}
                    className="accent-brand-gold"
                  />
                  <span>Replace existing inclusions</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkMode"
                    value="append"
                    checked={bulkMode === 'append'}
                    onChange={() => setBulkMode('append')}
                    className="accent-brand-gold"
                  />
                  <span>Append to existing</span>
                </label>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!bulkText.trim() || detectedBulkSections.length === 0}
                  onClick={handleApplyBulk}
                  className="px-4 py-1.5 bg-brand-maroon hover:bg-brand-maroon-light border border-brand-gold/60 text-brand-gold-light text-xs font-semibold rounded-lg transition shadow-md disabled:opacity-40"
                >
                  Import Inclusions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
