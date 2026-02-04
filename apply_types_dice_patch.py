import os

file_path = 'types.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if "diceLog?:" not in content:
    content = content.replace("relationships?: { targetId: string; type: 'friend' | 'enemy' | 'neutral'; value: number }[];", "relationships?: { targetId: string; type: 'friend' | 'enemy' | 'neutral'; value: number }[];\n  diceLog?: string[];")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("types.ts patched for Dice Log successfully.")
