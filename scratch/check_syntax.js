const fs = require("fs");
const path = require("path");
const babel = require("@babel/parser");

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (filePath.endsWith(".js") || filePath.endsWith(".jsx")) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const srcDir = path.join(__dirname, "../src");
const allFiles = getAllFiles(srcDir);
console.log(`Checking syntax for ${allFiles.length} files...`);

let errorCount = 0;
for (const file of allFiles) {
    try {
        const code = fs.readFileSync(file, "utf8");
        babel.parse(code, {
            sourceType: "module",
            plugins: ["jsx", "typescript"]
        });
    } catch (err) {
        console.error(`Syntax Error in ${file}: ${err.message}`);
        errorCount++;
    }
}

if (errorCount === 0) {
    console.log("SUCCESS: All JS/JSX files in src/ have 100% valid syntax with ZERO errors!");
} else {
    console.log(`FAILURE: Found ${errorCount} syntax errors.`);
}
