path = "src/components/AdminPanel.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

edits = [
    (
        'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 dark:from-amber-400 dark:via-orange-400 dark:to-amber-300',
        'bg-gradient-to-r from-purple-600 via-violet-600 to-purple-500 dark:from-purple-400 dark:via-violet-400 dark:to-purple-300'
    ),
    (
        'bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-400/15 dark:to-orange-400/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-lg border border-amber-500/20 dark:border-amber-500/30 shadow-amber-500/5 shadow-sm',
        'bg-gradient-to-r from-purple-500/10 to-violet-500/10 dark:from-purple-400/15 dark:to-violet-400/15 text-purple-700 dark:text-purple-300 text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-lg border border-purple-500/20 dark:border-purple-500/30 shadow-purple-500/5 shadow-sm'
    ),
    (
        'bg-amber-400 opacity-75',
        'bg-purple-400 opacity-75'
    ),
    (
        'rounded-full h-1.5 w-1.5 bg-amber-600',
        'rounded-full h-1.5 w-1.5 bg-purple-600'
    ),
    (
        'w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-center select-none cursor-pointer transition-all disabled:opacity-50',
        'w-full py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-center select-none cursor-pointer transition-all disabled:opacity-50'
    ),
    (
        'p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 rounded transition-all',
        'p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-600 rounded transition-all'
    ),
    (
        'h-6 w-6 mt-3 text-amber-600 animate-spin',
        'h-6 w-6 mt-3 text-purple-600 animate-spin'
    ),
    (
        'px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] cursor-pointer disabled:opacity-50',
        'px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg text-[10px] cursor-pointer disabled:opacity-50'
    ),
]

for old, new in edits:
    count = content.count(old)
    assert count == 1, f"NOT UNIQUE (count={count}): {old[:70]!r}"
    content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("AdminPanel.tsx sample-papers section updated OK")
