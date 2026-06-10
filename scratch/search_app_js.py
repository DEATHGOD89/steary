import re

with open('c:/Users/hubsh/Downloads/steary/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

term = 'heroPanel'
for idx, line in enumerate(lines):
    if term in line:
        print(f"Line {idx+1}: {line.strip()}")
