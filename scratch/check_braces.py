level = 0
with open('app.js', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        open_c = line.count('{')
        close_c = line.count('}')
        old_level = level
        level += open_c - close_c
        if ('function ' in line or 'class ' in line) and '{' in line:
            print(f'Line {idx+1} (level {old_level} -> {level}): {line.strip()}')
        if level < 0:
            print(f'Line {idx+1} went NEGATIVE: {level}')
            level = 0

print("Final level at end of file:", level)
