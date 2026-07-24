import yaml from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path ke openapi.yaml
const openapiPath = path.join(__dirname, '../docs/openapi.yaml');

export const openapiSpec = yaml.load(openapiPath);
