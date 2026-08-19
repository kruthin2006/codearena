const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const execPromise = promisify(exec);

class CodeExecutor {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.log('Temp directory already exists');
    }
  }

  async executeJava(code, input) {
    const filename = `Solution_${Date.now()}`;
    const filePath = path.join(this.tempDir, `${filename}.java`);
    const className = 'Solution';

    // Modify code to use the correct class name
    const modifiedCode = code.replace(/public\s+class\s+\w+/, `public class ${className}`);

    try {
      await writeFile(filePath, modifiedCode);
      
      // Compile
      const compileCommand = `javac ${filePath}`;
      await execPromise(compileCommand);

      // Run
      const runCommand = `cd ${this.tempDir} && java ${className}`;
      const { stdout, stderr } = await execPromise(runCommand, {
        input: input,
        timeout: 5000
      });

      // Cleanup
      await unlink(filePath);
      await unlink(path.join(this.tempDir, `${className}.class`));

      return { output: stdout, error: stderr };
    } catch (error) {
      return { output: error.stdout || '', error: error.stderr || error.message };
    }
  }

  async executeCpp(code, input) {
    const filename = `solution_${Date.now()}`;
    const filePath = path.join(this.tempDir, `${filename}.cpp`);
    const outputPath = path.join(this.tempDir, `${filename}`);

    try {
      await writeFile(filePath, code);

      // Compile
      const compileCommand = `g++ ${filePath} -o ${outputPath}`;
      await execPromise(compileCommand);

      // Run
      const runCommand = `${outputPath}`;
      const { stdout, stderr } = await execPromise(runCommand, {
        input: input,
        timeout: 5000
      });

      // Cleanup
      await unlink(filePath);
      await unlink(outputPath);

      return { output: stdout, error: stderr };
    } catch (error) {
      return { output: error.stdout || '', error: error.stderr || error.message };
    }
  }

  async executeCode(language, code, input) {
    if (language === 'java') {
      return await this.executeJava(code, input);
    } else if (language === 'cpp') {
      return await this.executeCpp(code, input);
    } else {
      throw new Error('Unsupported language');
    }
  }
}

module.exports = new CodeExecutor();