const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const srcDir = path.join(projectRoot, 'src');
const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];

// 1. Get ALL files in src
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      if (validExtensions.includes(path.extname(file))) {
        fileList.push(filePath);
      }
    }
  });
  return fileList;
}

const allFiles = getAllFiles(srcDir);
// Add root files that are part of the source
if (fs.existsSync(path.join(projectRoot, 'App.js'))) {
  allFiles.push(path.join(projectRoot, 'App.js'));
}
if (fs.existsSync(path.join(projectRoot, 'index.js'))) {
  allFiles.push(path.join(projectRoot, 'index.js'));
}

// 2. Find USED files by traversing imports
const usedFiles = new Set();
const queue = [
  path.join(projectRoot, 'index.js'),
  path.join(projectRoot, 'App.js'),
];

function resolvePath(sourceFile, importPath) {
  if (!importPath.startsWith('.')) {
    return null;
  } // Ignore non-relative imports for now

  const dir = path.dirname(sourceFile);
  const absolutePath = path.resolve(dir, importPath);

  // 1. Exact match (rare for imports, but possible)
  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
    return absolutePath;
  }

  // 2. Try extensions
  for (const ext of validExtensions) {
    if (fs.existsSync(absolutePath + ext)) {
      return absolutePath + ext;
    }
  }

  // 3. Try directory index
  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
    const indexBase = path.join(absolutePath, 'index');
    for (const ext of validExtensions) {
      if (fs.existsSync(indexBase + ext)) {
        return indexBase + ext;
      }
    }
  }

  return null;
}

while (queue.length > 0) {
  const file = queue.shift();
  if (usedFiles.has(file)) {
    continue;
  }

  // If file doesn't exist (maybe optional import or error), skip
  if (!fs.existsSync(file)) {
    continue;
  }

  usedFiles.add(file);

  try {
    const content = fs.readFileSync(file, 'utf8');
    // Regex to capture import sources
    // Matches: import ... from 'source'; export ... from 'source'; require('source'); import('source')
    const importPattern =
      /(?:import|export)\s+(?:.*?from\s+)?['"](.*?)['"]|require\(['"](.*?)['"]\)|import\(['"](.*?)['"]\)/g;

    let match;
    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1] || match[2] || match[3];
      if (importPath) {
        const resolved = resolvePath(file, importPath);
        if (resolved && !usedFiles.has(resolved)) {
          queue.push(resolved);
        }
      }
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
}

// 3. Compare and List
const unusedFiles = allFiles.filter(f => !usedFiles.has(f));

console.log('--- UNUSED FILES START ---');
unusedFiles.forEach(f => {
  console.log(path.relative(projectRoot, f));
});
console.log('--- UNUSED FILES END ---');
