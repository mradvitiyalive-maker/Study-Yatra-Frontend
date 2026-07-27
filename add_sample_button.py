import re

# ---------- 1. Hero.tsx ----------
path = "src/components/Hero.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_props = """interface HeroProps {
  branding: BrandingConfig;
  user: UserProfile;
  onInitiateExam: (exam: Exam) => void;
}

export default function Hero({ branding, user, onInitiateExam }: HeroProps) {"""

new_props = """interface HeroProps {
  branding: BrandingConfig;
  user: UserProfile;
  onInitiateExam: (exam: Exam) => void;
  onOpenSamplePaper?: () => void;
}

export default function Hero({ branding, user, onInitiateExam, onOpenSamplePaper }: HeroProps) {"""

assert content.count(old_props) == 1, "props block not found or not unique"
content = content.replace(old_props, new_props)

old_grid = '<div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">'
new_grid = '<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-xl mx-auto">'
assert content.count(old_grid) == 1, "grid div not found or not unique"
content = content.replace(old_grid, new_grid)

old_cbse_end = """                <span className="text-base sm:text-lg font-bold font-poppins dark:text-white group-hover:text-white">CBSE</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-indigo-100 mt-1">Board Exams</span>
              </button>

            </div>"""

new_cbse_end = """                <span className="text-base sm:text-lg font-bold font-poppins dark:text-white group-hover:text-white">CBSE</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-indigo-100 mt-1">Board Exams</span>
              </button>

              {/* Sample Paper Button */}
              {onOpenSamplePaper && (
                <button
                  id="cta-sample"
                  onClick={onOpenSamplePaper}
                  className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-500 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 shadow-md transition-all duration-200 text-center cursor-pointer transform hover:-translate-y-1"
                >
                  <span className="text-lg sm:text-xl mb-2">📝</span>
                  <span className="text-base sm:text-lg font-bold font-poppins dark:text-white group-hover:text-white">Sample</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-purple-100 mt-1">Test Papers</span>
                </button>
              )}

            </div>"""

assert content.count(old_cbse_end) == 1, "CBSE closing block not found or not unique"
content = content.replace(old_cbse_end, new_cbse_end)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Hero.tsx updated OK")

# ---------- 2. App.tsx ----------
path2 = "src/App.tsx"
with open(path2, "r", encoding="utf-8") as f:
    content2 = f.read()

old_hero_call = """            <Hero 
              branding={branding} 
              user={user}
              onInitiateExam={handleLaunchDirectExamPath} 
            />"""

new_hero_call = """            <Hero 
              branding={branding} 
              user={user}
              onInitiateExam={handleLaunchDirectExamPath} 
              onOpenSamplePaper={() => setCurrentTab('sample-paper')}
            />"""

assert content2.count(old_hero_call) == 1, "Hero call not found or not unique"
content2 = content2.replace(old_hero_call, new_hero_call)

with open(path2, "w", encoding="utf-8") as f:
    f.write(content2)

print("App.tsx updated OK")
