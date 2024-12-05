const fs = require('node:fs');
const path = require('node:path');

const fileSuffixList = ['.h', '.hpp', '.c', '.cpp', '.cs'];

function setFilePermissions(filename, isReadOnly) 
{
    const mode = isReadOnly ? 0o444 : 0o644; // 只读为 444，可读写为 644
    fs.chmodSync(filename, mode);
}

function isTargetFile(filename) 
{
    const index = filename.lastIndexOf('.');
    const fileSuffix = filename.slice(index);
    return fileSuffixList.includes(fileSuffix);
}

function processDirectory(dirPath, isReadOnly) 
{
    if (fs.existsSync(dirPath)) 
    {
        const list = fs.readdirSync(dirPath, { withFileTypes: true });
        list.forEach((dirent) => 
        {
            const subPath = path.join(dirPath, dirent.name);
            if (dirent.isDirectory()) 
            {
                processDirectory(subPath, isReadOnly);
            } 
            else if (isTargetFile(dirent.name)) 
            {
                setFilePermissions(subPath, isReadOnly);
                console.log(`---> Processed file: ${subPath} to ${isReadOnly ? 'Read-Only' : 'Read-Write'}`);
            }
        });
    } 
    else 
    {
        console.error(`---> Target path does not exist: ${dirPath}`);
    }
}

async function confirmAction(dirPath, fileType) 
{
    return new Promise((resolve) => 
    {
        process.stdout.write(`Target Path: ${dirPath}\nTarget File Types: [${fileType}]\n`);
        process.stdout.write(`Are you sure you want to proceed with changing permissions? (Y/N): `);
        process.stdin.once('data', (data) => 
        {
            const input = data.toString().trim().toUpperCase(); // 转为大写以简化比较
            if (input === 'Y') 
            {
                resolve(true);
            } 
            else if (input === 'N') 
            {
                console.log("Operation canceled.");
                process.exit(0); // 直接退出程序
            } 
            else 
            {
                console.log("Invalid input. Please enter Y or N.");
                confirmAction(dirPath, fileType).then(resolve); // 继续提问
            }
        });
    });
}


function showHelp() 
{
    console.log
    (
`Usage: node chmod.js [options] [path] => node chmod.js -R [path]
Options:
  -R          Set files to Read-Only.
  -RW         Set files to Read-Write.
  -path       Specify the target path to apply permissions. If no path is specified, the current working directory will be used.
  -help       Show this help message.`
    );
}

async function main() 
{
    const args = process.argv.slice(2);
    let isReadOnly = null;
    let dirPath = process.cwd(); // 默认当前工作目录

    if (args.length === 0) 
    {
        console.log("Please provide an argument: -R for Read-Only, -RW for Read-Write, or specify a path.");
        showHelp();
        return;
    }

    if (args[0] === '-R') 
    {
        isReadOnly = true;
    } 
    else if (args[0] === '-RW') 
    {
        isReadOnly = false;
    } 
    else if (args[0] === '-help') 
    {
        showHelp();
        return;
    } 
    else 
    {
        console.log("Invalid argument. Use -R for Read-Only, -RW for Read-Write, or -help for help.");
        return;
    }

    if (args[1]) 
    {
        dirPath = args[1];
    }

    const confirmed = await confirmAction(dirPath, fileSuffixList.join(', '));
    if (!confirmed) 
    {
        return; // 已在 confirmAction 中处理退出
    }

    processDirectory(dirPath, isReadOnly);
    console.log("---> Operation completed!");

    process.exit(0);
}

main();