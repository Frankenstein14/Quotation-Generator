import React, { useState } from 'react';
import { InclusionSection } from '../../types';
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles, ListChecks, Check, CornerDownRight } from 'lucide-react';

interface InclusionsEditorProps {
  inclusions: InclusionSection[];
  onChange: (inclusions: InclusionSection[]) => void;
}

export const InclusionsEditor: React.FC<InclusionsEditorProps> = ({
  inclusions,
  onChange
}) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionSubtitle, setNewSectionSubtitle] = useState('');
  const [newBulletInputs, setNewBulletInputs] = useState<{ [sectionId: string]: string }>({});

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    const newSec: InclusionSection = {
      id: 'sec_' + Date.now(),
      title: newSectionTitle.trim(),
      subtitle: newSectionSubtitle.trim() || undefined,
      items: []
    };
    onChange([...inclusions, newSec]);
    setNewSectionTitle('');
    setNewSectionSubtitle('');
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

  const handleAddBullet = (sectionId: string, sectionIndex: number) => {
    const text = newBulletInputs[sectionId]?.trim();
    if (!text) return;
    const updated = [...inclusions];
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      items: [...updated[sectionIndex].items, text]
    };
    onChange(updated);
    setNewBulletInputs(prev => ({ ...prev, [sectionId]: '' }));
  };

  const handleUpdateBullet = (sectionIndex: number, bulletIndex: number, text: string) => {
    const updated = [...inclusions];
    const items = [...updated[sectionIndex].items];
    items[bulletIndex] = text;
    updated[sectionIndex] = { ...updated[sectionIndex], items };
    onChange(updated);
  };

  const handleDeleteBullet = (sectionIndex: number, bulletIndex: number) => {
    const updated = [...inclusions];
    const items = updated[sectionIndex].items.filter((_, i) => i !== bulletIndex);
    updated[sectionIndex] = { ...updated[sectionIndex], items };
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
    onChange(updated);
  };

  // Preset Template Loader
  const loadPreset = (type: 'new' | 'reference' | 'wedding' | 'corporate') => {
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
        {inclusions.map((section, sIdx) => (
          <div
            key={section.id || sIdx}
            className="bg-[#1c1920] border border-stone-800/90 rounded-xl p-5 shadow-sm transition hover:border-stone-700"
          >
            {/* Section Header Controls */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-800/80 mb-4">
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
                  placeholder="Optional Subtitle (e.g. Morning Tiffin - 80nos 7am)"
                  className="bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-brand-gold transition"
                />
              </div>

              <div className="flex items-center gap-1">
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

            {/* Bullets List */}
            <div className="space-y-2 pl-2">
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
              <div className="flex items-center gap-2 mt-2 pt-2">
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
                  placeholder="Type new bullet item and press Enter..."
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
          </div>
        ))}
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
        <button
          type="button"
          onClick={handleAddSection}
          className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs font-semibold text-brand-gold-light transition"
        >
          <Plus size={14} />
          <span>Add Section</span>
        </button>
      </div>
    </div>
  );
};
