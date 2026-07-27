path = "src/components/Onboarding.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

edits = [
    (
        'className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-amber-500 focus:outline-none focus:ring-amber-500/20 transition-all cursor-pointer text-left"',
        'className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-purple-500 focus:outline-none focus:ring-purple-500/20 transition-all cursor-pointer text-left"'
    ),
    (
        '<HelpCircle className="h-8 w-8 text-amber-500" />',
        '<HelpCircle className="h-8 w-8 text-purple-500" />'
    ),
]

for old, new in edits:
    count = content.count(old)
    assert count == 1, f"NOT UNIQUE (count={count}): {old[:70]!r}"
    content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Onboarding.tsx sample paper card updated OK")
