path = "src/components/SamplePaper.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                      <PlayCircle className="h-5 w-5" />
                    </div>"""

new = """                    <button
                      onClick={() => openTest(test)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-80 cursor-pointer"
                      title="Attempt test"
                    >
                      <PlayCircle className="h-5 w-5" />
                    </button>"""

count = content.count(old)
assert count == 1, f"NOT UNIQUE (count={count})"
content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("SamplePaper.tsx updated OK")
