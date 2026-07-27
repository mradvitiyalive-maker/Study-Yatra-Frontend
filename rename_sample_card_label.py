path = "src/components/Hero.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = '<span className="text-base sm:text-lg font-bold font-poppins dark:text-white group-hover:text-white">Sample</span>'
new = '<span className="text-base sm:text-lg font-bold font-poppins dark:text-white group-hover:text-white">Sample Papers</span>'

count = content.count(old)
assert count == 1, f"NOT UNIQUE (count={count})"
content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Hero.tsx label updated OK")
