import { copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceFile = join(__dirname, '7Dlogo.jpg');
const targetFile = join(__dirname, 'public', '7Dlogo.jpg');

copyFileSync(sourceFile, targetFile);
console.log('File copied successfully!');
