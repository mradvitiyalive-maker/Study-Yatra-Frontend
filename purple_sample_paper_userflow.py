path = "src/components/SamplePaper.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

edits = [
    (
        'w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-xs cursor-pointer transition-all',
        'w-full py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-xs cursor-pointer transition-all'
    ),
    (
        'block w-full text-center py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-sm cursor-pointer transition-all',
        'block w-full text-center py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-sm cursor-pointer transition-all'
    ),
]

for old, new in edits:
    count = content.count(old)
    assert count == 1, f"NOT UNIQUE (count={count}): {old[:70]!r}"
    content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("SamplePaper.tsx updated OK")
