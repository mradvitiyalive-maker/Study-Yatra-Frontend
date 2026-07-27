path = "src/components/SamplePaper.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_header = """                  <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold font-poppins text-slate-800 dark:text-white">{test.testName}</span>
                    <button
                      onClick={() => openTest(test)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-80 cursor-pointer"
                      title="Attempt test"
                    >
                      <PlayCircle className="h-5 w-5" />
                    </button>
                  </div>"""

new_header = """                  <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold font-poppins text-slate-800 dark:text-white">{test.testName}</span>
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                      <PlayCircle className="h-5 w-5" />
                    </div>
                  </div>"""

assert content.count(old_header) == 1, "header block not found or not unique"
content = content.replace(old_header, new_header)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("SamplePaper.tsx updated OK")
