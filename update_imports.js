const fs = require('fs');  
let c = fs.readFileSync('App.tsx', 'utf8');  
const moved = ['generateWorldNews', 'generateCampaignSetting', 'generateMapData'];  
const regex = /import \{ (.*?) \} from '\.\/services\/geminiService';/;  
const match = c.match(regex);  
if (match) {  
    const funcs = match[1].split(',').map(s => s.trim());  
    const kept = funcs.filter(f => !moved.includes(f));  
    const newImport = `import { ${kept.join(', ')} } from './services/geminiService';\nimport { ${moved.join(', ')} } from './services/worldEngine';`;  
    c = c.replace(match[0], newImport);  
    fs.writeFileSync('App.tsx', c);  
    console.log("Imports updated.");  
} else {  
    console.log("No match found.");  
}  
