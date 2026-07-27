path = "src/components/Onboarding.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {onOpenSamplePaper && (
              <button
                id="onboard-sample-paper"
                onClick={onOpenSamplePaper}
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-purple-500 focus:outline-none focus:ring-purple-500/20 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center justify-between">
                  <HelpCircle className="h-8 w-8 text-purple-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase">Tests</span>
                </div>
                <h4 className="text-xl font-bold font-poppins text-slate-800 dark:text-white mt-4">Sample Paper</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Full syllabus tests with subject-wise video solutions</p>
                <span className="inline-block mt-3 bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2.5 py-1 rounded text-[11px] text-slate-600 dark:text-slate-350 font-mono">
                  Chapter-wise Tests
                </span>
              </button>
            )}
            {["""

new = """          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {["""

count = content.count(old)
assert count == 1, f"NOT UNIQUE (count={count})"
content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Onboarding.tsx sample paper card removed OK")
