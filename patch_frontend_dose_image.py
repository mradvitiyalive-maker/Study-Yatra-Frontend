def apply(content, old, new, label):
    count = content.count(old)
    assert count == 1, f"{label}: expected exactly 1 match, found {count}"
    return content.replace(old, new)

# =========================================================
# PART 1: src/components/AdminPanel.tsx
# =========================================================
admin_path = "src/components/AdminPanel.tsx"
with open(admin_path, "r", encoding="utf-8") as f:
    admin = f.read()

old = """  const [ddWrongMotivation, setDdWrongMotivation] = useState<string>('Galtiyaan hi topper banati hain. Re-read the explanation! \U0001F4DA');
  const [ddPublishDate, setDdPublishDate] = useState<string>(() => new Date().toISOString().split('T')[0]);"""
new = """  const [ddWrongMotivation, setDdWrongMotivation] = useState<string>('Galtiyaan hi topper banati hain. Re-read the explanation! \U0001F4DA');
  const [ddMotivationImageUrl, setDdMotivationImageUrl] = useState<string>('');
  const [ddPublishDate, setDdPublishDate] = useState<string>(() => new Date().toISOString().split('T')[0]);"""
admin = apply(admin, old, new, "AdminPanel Edit 1 (state)")

old = """          correctMotivationMessage: ddCorrectMotivation,
          wrongMotivationMessage: ddWrongMotivation,
          publishDate: ddPublishDate || ddDate,"""
new = """          correctMotivationMessage: ddCorrectMotivation,
          wrongMotivationMessage: ddWrongMotivation,
          motivationImageUrl: ddMotivationImageUrl,
          publishDate: ddPublishDate || ddDate,"""
admin = apply(admin, old, new, "AdminPanel Edit 2 (save payload)")

old = """        setDdOptionD('');
        setDdExplanation('');
        loadDailyDoses();"""
new = """        setDdOptionD('');
        setDdExplanation('');
        setDdMotivationImageUrl('');
        loadDailyDoses();"""
admin = apply(admin, old, new, "AdminPanel Edit 3 (reset after save)")

old = """    setDdWrongMotivation(item.wrongMotivationMessage || '');
    setDdPublishDate(item.publishDate || item.date);"""
new = """    setDdWrongMotivation(item.wrongMotivationMessage || '');
    setDdMotivationImageUrl(item.motivationImageUrl || '');
    setDdPublishDate(item.publishDate || item.date);"""
admin = apply(admin, old, new, "AdminPanel Edit 4 (load on edit)")

old = """                {/* Additional metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Publish Date</label>"""
new = """                {/* Motivational quote image swap slide */}
                <div className="space-y-1.5 pb-2">
                  <label className="text-slate-500 uppercase tracking-wider block text-[10px] text-purple-600">Motivation Quote Image URL (optional)</label>
                  <input 
                    type="text"
                    placeholder="https://raw.githubusercontent.com/.../quote.jpg"
                    value={ddMotivationImageUrl}
                    onChange={(e) => setDdMotivationImageUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                  />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Paste a hosted image link (jpg/png). On the homepage, students can swap between today's question and this quote image using the arrow on the card.
                  </p>
                  {ddMotivationImageUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-w-xs">
                      <img 
                        src={ddMotivationImageUrl} 
                        alt="Motivation quote preview" 
                        className="w-full h-40 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>

                {/* Additional metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Publish Date</label>"""
admin = apply(admin, old, new, "AdminPanel Edit 5 (form field)")

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(admin)

print("Patched AdminPanel.tsx: Motivation Quote Image URL field added to Daily Dose Spec form.")

# =========================================================
# PART 2: src/components/DailyDoseWidget.tsx
# =========================================================
widget_path = "src/components/DailyDoseWidget.tsx"
with open(widget_path, "r", encoding="utf-8") as f:
    widget = f.read()

old = """  correctMotivationMessage?: string;
  wrongMotivationMessage?: string;
}"""
new = """  correctMotivationMessage?: string;
  wrongMotivationMessage?: string;
  motivationImageUrl?: string;
}"""
widget = apply(widget, old, new, "DailyDoseWidget Edit 1 (interface)")

old = """  // Confetti particles state
  const [confetti, setConfetti] = useState<{ id: number; left: number; color: string; duration: number; delay: number }[]>([]);

  // Reload question whenever the user's selected exam profile shifts
  useEffect(() => {
    loadTodayDose();
  }, [user.targetExam, user.firebaseUid]);"""
new = """  // Confetti particles state
  const [confetti, setConfetti] = useState<{ id: number; left: number; color: string; duration: number; delay: number }[]>([]);

  // Which slide is showing: 0 = question/result card, 1 = motivation quote image
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);

  // Reload question whenever the user's selected exam profile shifts
  useEffect(() => {
    loadTodayDose();
  }, [user.targetExam, user.firebaseUid]);

  // Reset to the question slide whenever a new Daily Dose loads
  useEffect(() => {
    setActiveSlide(0);
  }, [question?.id]);

  // Auto-swap between the question card and the motivation quote image every few seconds
  useEffect(() => {
    if (!question?.motivationImageUrl) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev === 0 ? 1 : 0));
    }, 6000);
    return () => clearInterval(timer);
  }, [question?.motivationImageUrl, question?.id]);"""
widget = apply(widget, old, new, "DailyDoseWidget Edit 2 (state + auto-swap)")

old = """      {/* COMPLETED OVERLAY HERO CARD: Only visible if completed and NOT actively exploring review mode */}
      {completed && !isReviewMode ? ("""
new = """      {question.motivationImageUrl && activeSlide === 1 ? (
        /* MOTIVATION QUOTE IMAGE SLIDE: swaps in place of the question card */
        <div className="relative min-h-[420px] rounded-2xl overflow-hidden animate-fade-in z-10">
          <img
            src={question.motivationImageUrl}
            alt="Daily motivation quote"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ) : (
      <>
      {/* COMPLETED OVERLAY HERO CARD: Only visible if completed and NOT actively exploring review mode */}
      {completed && !isReviewMode ? ("""
widget = apply(widget, old, new, "DailyDoseWidget Edit 3 (open swap wrapper)")

old = """        </div>
      )}
    </div>
  );
}"""
new = """        </div>
      )}
      </>
      )}

      {/* Manual swap arrow: lets the user flip between the question and the motivation quote image */}
      {question.motivationImageUrl && (
        <button
          onClick={() => setActiveSlide(prev => (prev === 0 ? 1 : 0))}
          aria-label="Swap between question and motivational quote"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:scale-110 transition-all cursor-pointer"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}"""
widget = apply(widget, old, new, "DailyDoseWidget Edit 4 (close wrapper + arrow button)")

with open(widget_path, "w", encoding="utf-8") as f:
    f.write(widget)

print("Patched DailyDoseWidget.tsx: added swap carousel with auto-swap timer and manual arrow.")
