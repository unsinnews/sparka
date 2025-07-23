#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

async function fetchAndConvertModels() {
  try {
    console.log('Fetching models from API...');

    // Fetch the JSON data from the API
    const response = await fetch('https://ai-gateway.vercel.sh/v1/models');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData = await response.json();

    // Write the JSON file
    const jsonPath = path.join(__dirname, '../providers/models.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log('Saved JSON file:', jsonPath);

    // Generate TypeScript content
    const outputPath = path.join(__dirname, '../providers/models-generated.ts');
    const tsContent = `import type { ModelData } from '@/providers/model-data';

// Define the data with proper typing
export const modelsData: ModelData[] = ${JSON.stringify(jsonData.data, null, 2)};
`;

    // Write the TypeScript file
    fs.writeFileSync(outputPath, tsContent);
    console.log('Generated TypeScript file:', outputPath);
  } catch (error) {
    console.error('Error fetching or converting models:', error);
    process.exit(1);
  }
}

fetchAndConvertModels();
