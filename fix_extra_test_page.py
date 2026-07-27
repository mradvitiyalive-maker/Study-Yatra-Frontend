path = "src/components/SamplePaper.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

edits = [
    (
        "  const [activeTest, setActiveTest] = useState<SamplePaperTest | null>(null);\n  const [attempted, setAttempted] = useState(false);\n",
        "  const [activeTest, setActiveTest] = useState<SamplePaperTest | null>(null);\n"
    ),
    (
        "    setActiveTest(test);\n    setAttempted(false);\n    setStep('detail');",
        "    setActiveTest(test);\n    setStep('detail');"
    ),
    (
        '              onClick={() => setAttempted(true)}\n',
        ''
    ),
    (
        "          {attempted && (\n            <div className=\"bg-slate-50",
        "          <div className=\"bg-slate-50"
    ),
]

for old, new in edits:
    count = content.count(old)
    assert count == 1, f"NOT UNIQUE (count={count}): {old!r}"
    content = content.replace(old, new)

old_tail = "              )}\n            </div>\n          )}\n        </div>\n      )}\n    </div>"
new_tail = "              )}\n          </div>\n        </div>\n      )}\n    </div>"
count = content.count(old_tail)
assert count == 1, f"tail NOT UNIQUE (count={count})"
content = content.replace(old_tail, new_tail)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("SamplePaper.tsx updated OK")
