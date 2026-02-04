import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, ChatSession } from '../types';
import { X, Terminal } from 'lucide-react';
import { audio } from '../services/audioEngine';

interface TerminalModeProps {
    settings: AppSettings;
    onClose: () => void;
    session: ChatSession;
    onUpdateSettings: (s: AppSettings) => void;
}

interface TerminalLine {
    id: string;
    type: 'input' | 'output' | 'system' | 'error';
    content: string;
}

export const TerminalMode: React.FC<TerminalModeProps> = ({ settings, onClose, session, onUpdateSettings }) => {
    const [lines, setLines] = useState<TerminalLine[]>([
        { id: 'init-1', type: 'system', content: 'WIRED_OS KERNEL v12.6 LOADING...' },
        { id: 'init-2', type: 'system', content: 'MOUNTING VIRTUAL FILESYSTEM... OK' },
        { id: 'init-3', type: 'system', content: 'INITIALIZING NETWORK STACK... OK' },
        { id: 'init-4', type: 'system', content: 'WELCOME USER. TYPE "help" FOR COMMANDS.' }
    ]);
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    useEffect(() => {
        inputRef.current?.focus();
        const handleClick = () => inputRef.current?.focus();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const executeCommand = (cmd: string) => {
        const parts = cmd.trim().split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        let output = '';
        let type: 'output' | 'error' | 'system' = 'output';

        switch (command) {
            case 'help':
                output = `AVAILABLE COMMANDS:
  help      - Show this list
  clear     - Clear terminal buffer
  status    - Show system status
  ls        - List virtual files
  whoami    - Show current user
  connect   - Force network reconnect
  music     - Control audio subsystem
  exit      - Close terminal mode`;
                break;
            case 'clear':
                setLines([]);
                return;
            case 'status':
                output = `SYSTEM STATUS:
  CPU LOAD: ${Math.floor(Math.random() * 30) + 10}%
  MEMORY:   ${Math.floor(Math.random() * 500) + 200}MB USED
  UPTIME:   ${Math.floor(performance.now() / 1000)}s
  NETWORK:  CONNECTED (${settings.user.ipAddress})`;
                break;
            case 'whoami':
                output = `USER: ${settings.user.username}\nROLE: ADMIN\nNODE: ${settings.user.region}`;
                break;
            case 'ls':
                output = `Directory: /usr/wired/data
  drwx------  2 root  root   4096 Jan 01 00:00 .
  drwx------  2 root  root   4096 Jan 01 00:00 ..
  -rw-r--r--  1 user  group  1024 Jan 27 10:00 session.log
  -rw-r--r--  1 user  group  2048 Jan 27 11:30 memories.db
  -rwx------  1 root  root    512 Jan 01 00:00 protocol.exe`;
                break;
            case 'connect':
                output = 'INITIATING HANDSHAKE...\nESTABLISHED SECURE TUNNEL.';
                break;
            case 'music':
                if (args[0] === 'stop') {
                    audio.stop();
                    output = 'AUDIO SUBSYSTEM HALTED.';
                } else if (args[0] === 'play') {
                    audio.resume();
                    output = 'AUDIO SUBSYSTEM RESUMED.';
                } else {
                    output = 'USAGE: music [play|stop]';
                }
                break;
            case 'exit':
                onClose();
                return;
            default:
                output = `COMMAND NOT FOUND: ${command}`;
                type = 'error';
        }

        setLines(prev => [
            ...prev,
            { id: Date.now().toString(), type: type, content: output }
        ]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const cmd = input.trim();
            if (!cmd) return;
            
            setLines(prev => [
                ...prev,
                { id: `in-${Date.now()}`, type: 'input', content: cmd }
            ]);
            
            executeCommand(cmd);
            setInput('');
            audio.playTypingSound(100);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black text-green-500 font-mono p-4 flex flex-col font-['VT323'] text-lg">
            <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/b/bc/Static_tv_noise_clip.gif')] opacity-[0.05] pointer-events-none mix-blend-screen"></div>
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                backgroundSize: '100% 2px, 3px 100%'
            }}></div>
            
            <div className="flex justify-between items-center border-b border-green-500/50 pb-2 mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Terminal size={20} />
                    <span className="font-bold tracking-widest">WIRED_TERMINAL_ACCESS</span>
                </div>
                <button onClick={onClose} className="hover:text-white hover:bg-green-500/20 p-1 transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 relative z-10 scrollbar-none" onClick={() => inputRef.current?.focus()}>
                {lines.map(line => (
                    <div key={line.id} className={`${line.type === 'input' ? 'text-white' : line.type === 'error' ? 'text-red-500' : line.type === 'system' ? 'text-yellow-500' : 'text-green-500'} whitespace-pre-wrap`}>
                        {line.type === 'input' ? '> ' : ''}{line.content}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <div className="mt-4 flex items-center gap-2 relative z-10 border-t border-green-500/30 pt-2">
                <span className="text-green-500 font-bold animate-pulse">{'>'}</span>
                <input 
                    ref={inputRef}
                    type="text" 
                    value={input}
                    onChange={e => { setInput(e.target.value); audio.playUserTyping(); }}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xl uppercase placeholder-green-900"
                    placeholder="ENTER_COMMAND..."
                    autoFocus
                />
            </div>
        </div>
    );
};
