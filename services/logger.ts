
export type LogType = 'info' | 'warn' | 'error' | 'tx' | 'rx' | 'sys' | 'auth';

export interface LogEntry {
    id: string;
    timestamp: string;
    source: string;
    message: string;
    type: LogType;
}

export interface ProcessStatus {
    id: string;
    name: string;
    state: 'IDLE' | 'EXEC' | 'WAIT' | 'ERR';
    load: number; // 0-100
}

type LogListener = (entry: LogEntry) => void;
type ProcessListener = (processes: ProcessStatus[]) => void;

class LoggerService {
    private listeners: LogListener[] = [];
    private processListeners: ProcessListener[] = [];
    private history: LogEntry[] = [];
    
    // Active "Real" Processes tracking
    private activeProcesses: Map<string, ProcessStatus> = new Map();

    constructor() {
        // Initialize some default "daemon" processes for flavor
        this.updateProcess('daemon_net', 'NET_DAEMON', 'IDLE', 5);
        this.updateProcess('daemon_sys', 'SYS_MONITOR', 'EXEC', 12);
    }

    log(message: string, source: string = "SYS", type: LogType = 'info') {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const ms = now.getMilliseconds().toString().padStart(3, '0');
        const timestamp = `${timeStr}.${ms}`;

        const entry: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp,
            source: source.toUpperCase().substring(0, 8),
            message,
            type
        };
        
        this.history.push(entry);
        if (this.history.length > 100) this.history.shift();
        this.notify(entry);
    }

    // Helper for Network TX (Transmission)
    logTx(message: string, source: string = "NET") {
        this.log(message, source, 'tx');
    }

    // Helper for Network RX (Reception)
    logRx(message: string, source: string = "NET") {
        this.log(message, source, 'rx');
    }

    error(message: string, source: string = "ERR") {
        this.log(message, source, 'error');
    }

    subscribe(listener: LogListener) {
        this.listeners.push(listener);
        this.history.forEach(l => listener(l));
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    subscribeProcesses(listener: ProcessListener) {
        this.processListeners.push(listener);
        listener(Array.from(this.activeProcesses.values()));
        return () => {
            this.processListeners = this.processListeners.filter(l => l !== listener);
        };
    }

    private notify(entry: LogEntry) {
        this.listeners.forEach(l => l(entry));
    }

    private notifyProcesses() {
        const list = Array.from(this.activeProcesses.values());
        this.processListeners.forEach(l => l(list));
    }

    clear() {
        this.history = [];
        this.log("--- MEMORY FLUSHED ---", "SYS", "sys");
    }

    // Process Management
    updateProcess(id: string, name: string, state: 'IDLE' | 'EXEC' | 'WAIT' | 'ERR', load?: number) {
        const current = this.activeProcesses.get(id);
        const newLoad = load !== undefined ? load : (current ? current.load : Math.random() * 20);
        
        this.activeProcesses.set(id, {
            id,
            name,
            state,
            load: newLoad
        });
        this.notifyProcesses();
    }

    removeProcess(id: string) {
        this.activeProcesses.delete(id);
        this.notifyProcesses();
    }
}

export const logger = new LoggerService();
