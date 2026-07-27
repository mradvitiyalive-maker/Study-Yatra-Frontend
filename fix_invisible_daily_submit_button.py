path = "src/components/AdminPanel.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = 'className="px-6 py-3 bg-purple-650 hover:bg-purple-750 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.01]"'
new = 'className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.01]"'

count = content.count(old)
assert count == 1, f"NOT UNIQUE (count={count})"
content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("AdminPanel.tsx daily dose submit button fixed OK")
