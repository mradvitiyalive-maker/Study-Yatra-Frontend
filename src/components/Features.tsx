import { BookCheck, Video, BarChart3, Star, MessageSquarePlus, PersonStanding, ChevronRight } from 'lucide-react';

interface FeaturesProps {
  onSelectFeature: (tabId: string) => void;
}

export default function Features({ onSelectFeature }: FeaturesProps) {
  const cards = [
    {
      id: 'easy-concepts',
      title: 'Easy Concepts',
      desc: 'Important syllabus concepts ke easy formulas, keynotes aur hand-written explanations to build deep clarity.',
      icon: BookCheck,
      color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
      actionTab: 'practice-onboarding'
    },
    {
      id: 'chapter-videos',
      title: 'Chapter-wise Videos',
      desc: 'Expert curated concise conceptual videos aur YouTube link lectures specific to every single chapter.',
      icon: Video,
      color: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
      actionTab: 'practice-onboarding'
    },
    {
      id: 'pyq-analysis',
      title: 'PYQ Analysis',
      desc: 'Previous Year Questions categorized clearly with actual exam year tags like "JEE 2022", "NEET 2024". No mess!',
      icon: BarChart3,
      color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      actionTab: 'practice-onboarding'
    },
    {
      id: 'tips-tricks',
      title: 'Exam Tips & Tricks',
      desc: 'Rank boosting speed strategies, pattern tips, formula shortcuts jo time bachaaye aur accuracy double kare.',
      icon: Star,
      color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
      actionTab: 'subscription'
    },
    {
      id: 'doubt-support',
      title: 'Doubt Support',
      desc: 'Dedicated duda (doubt) system jahan students question typed query ya photocopy upload karke replies paate hain.',
      icon: MessageSquarePlus,
      color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      actionTab: 'doubt-support'
    },
    {
      id: 'mentorship',
      title: 'Personal Mentorship',
      desc: 'Booking for 1-on-1 live interactions. Pehle do classes FREE demo, uske baad ₹500 key per-lecture custom booking.',
      icon: PersonStanding,
      color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
      actionTab: 'mentorship'
    }
  ];

  return (
    <div id="features-section" className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold font-poppins text-slate-900 dark:text-white tracking-tight">
            Study Yatra Smart Features
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Syllabus complete karna aur pre-exam prep ko perfect banana ab banega extremely smooth aur high-yield.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                id={`feature-card-${card.id}`}
                onClick={() => onSelectFeature(card.actionTab)}
                className="group p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:shadow-lg dark:hover:shadow-slate-950 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${card.color} mb-5`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  <h3 className="text-lg font-bold font-poppins text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {card.title}
                  </h3>
                  
                  <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-450 leading-relaxed">
                    {card.desc}
                  </p>
                  
                  {card.id === 'chapter-videos' && (
                    <div className="mt-4">
                      <a
                        href="https://www.youtube.com/@StudyYatra29"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-2.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer border border-red-500"
                      >
                        <Video className="h-4 w-4 shrink-0" />
                        <span>Visit YouTube: @StudyYatra29</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1.5 transition-transform duration-200">
                  <span>Explore Tab</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
