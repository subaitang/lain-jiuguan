import os

file_path = 'App.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Init diceLog
if "if (!sess.diceLog) sess.diceLog = [];" not in content:
    content = content.replace("if (!sess.npcRegistry) sess.npcRegistry = {};", "if (!sess.npcRegistry) sess.npcRegistry = {};\n            if (!sess.diceLog) sess.diceLog = [];")

# 2. Pass props to DiceRoller
target = """                        <DiceRoller 
                            onRollComplete={(res) => setInput(prev => `${prev} ${res}`)}
                            onClose={() => setShowDiceRoller(false)}
                            isMinimized={false}
                            isMaximized={false}
                            onMinimize={() => {}}
                            onMaximize={() => {}}
                            userStats={currentSession.userRPStats} 
                            language={settings.user.language}
                        />"""

replacement = """                        <DiceRoller 
                            onRollComplete={(res) => setInput(prev => `${prev} ${res}`)}
                            onClose={() => setShowDiceRoller(false)}
                            isMinimized={false}
                            isMaximized={false}
                            onMinimize={() => {}}
                            onMaximize={() => {}}
                            userStats={currentSession.userRPStats} 
                            language={settings.user.language}
                            history={currentSession.diceLog || []}
                            onUpdateHistory={(newHistory) => {
                                setCurrentSession(prev => {
                                    const updated = { ...prev, diceLog: newHistory };
                                    sessionService.save(updated);
                                    return updated;
                                });
                            }}
                        />"""

if "history={currentSession.diceLog || []}" not in content:
    content = content.replace(target, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx patched for Dice History successfully.")
