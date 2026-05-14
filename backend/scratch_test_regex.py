
import re

def test_pattern(template, actual):
    t = template.strip("/")
    a = actual.strip("/")
    pattern = re.escape(t)
    print(f"Template: {template}")
    print(f"Escaped: {pattern}")
    
    # Try the current replacement
    p1 = re.sub(r'\\:[a-zA-Z0-9_]+', r'[^/]+', pattern)
    print(f"After sub (escaped colon): {p1}")
    m1 = re.match(f"^{p1}$", a)
    print(f"Match 1: {bool(m1)}")
    
    # Try unescaped colon replacement
    p2 = re.sub(r':[a-zA-Z0-9_]+', r'[^/]+', pattern)
    print(f"After sub (raw colon): {p2}")
    m2 = re.match(f"^{p2}$", a)
    print(f"Match 2: {bool(m2)}")

template = "/v1/convai/knowledge-base/:documentation_id/content"
actual = "/v1/convai/knowledge-base/1uj0gN0y7134fmhqRzCX/content"

test_pattern(template, actual)
