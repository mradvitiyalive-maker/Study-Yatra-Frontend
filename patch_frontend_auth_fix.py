def apply(content, old, new, label):
    count = content.count(old)
    assert count == 1, f"{label}: expected exactly 1 match, found {count}"
    return content.replace(old, new)

path = "src/components/AdminPanel.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: loadDailyDoses - was missing Authorization header entirely
old = """  const loadDailyDoses = async () => {
    try {
      setLoadingDailyDoses(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/daily-dose`);
      if (res.ok) {
        const data = await res.json();
        setDailyDoseList(data);
      }
    } catch (err) {
      console.error('Failed to load admin daily doses:', err);
    } finally {
      setLoadingDailyDoses(false);
    }
  };"""
new = """  const loadDailyDoses = async () => {
    try {
      setLoadingDailyDoses(true);
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/daily-dose`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDailyDoseList(data);
      }
    } catch (err) {
      console.error('Failed to load admin daily doses:', err);
    } finally {
      setLoadingDailyDoses(false);
    }
  };"""
content = apply(content, old, new, "Fix 1 (loadDailyDoses)")

# Fix 2: loadAdminLectures - was missing Authorization header entirely
old = """  const loadAdminLectures = async () => {
    try {
      setLoadingLectures(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/lectures`);
      if (res.ok) {
        const data = await res.json();
        setAdminLectures(data || []);
      }
    } catch (err) {
      console.error('Failed to load admin lectures:', err);
    } finally {
      setLoadingLectures(false);
    }
  };"""
new = """  const loadAdminLectures = async () => {
    try {
      setLoadingLectures(true);
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/lectures`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminLectures(data || []);
      }
    } catch (err) {
      console.error('Failed to load admin lectures:', err);
    } finally {
      setLoadingLectures(false);
    }
  };"""
content = apply(content, old, new, "Fix 2 (loadAdminLectures)")

# Fix 3: handleDeleteLecture - was missing Authorization header entirely
old = """  const handleDeleteLecture = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/lectures/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });"""
new = """  const handleDeleteLecture = async (id: number) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/lectures/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id })
      });"""
content = apply(content, old, new, "Fix 3 (handleDeleteLecture)")

# Fix 4: handleSaveDailyDose - was missing Authorization header entirely
old = """    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/daily-dose/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },"""
new = """    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/daily-dose/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },"""
content = apply(content, old, new, "Fix 4 (handleSaveDailyDose)")

# Fix 5: handleSaveLecture - was missing Authorization header entirely
old = """      const res = await fetch(`${API_BASE_URL}/api/admin/lectures/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });"""
new = """      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/lectures/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });"""
content = apply(content, old, new, "Fix 5 (handleSaveLecture)")

# Fix 6: handleDeleteDailyDoseChoice - was missing Authorization header entirely
old = """  const handleDeleteDailyDoseChoice = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/daily-dose/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });"""
new = """  const handleDeleteDailyDoseChoice = async (id: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/daily-dose/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id })
      });"""
content = apply(content, old, new, "Fix 6 (handleDeleteDailyDoseChoice)")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed 6 missing-Authorization-header bugs across Daily Dose and Lecture admin functions.")
print("Affected: loadDailyDoses, loadAdminLectures, handleSaveDailyDose, handleSaveLecture,")
print("handleDeleteLecture, handleDeleteDailyDoseChoice.")
