import childProcess from 'child_process';
import path from 'path';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function Promise_all(values) {
  return new Promise((resolve, reject) => { 
    let result = [];
    let total = 0;
    values.forEach((item, index) => {
      Promise.resolve(item).then((res) => {
        result[index] = res;
        total++;
        if (total === values.length) resolve(result);
      }).catch((err) => {
        reject(err);
      });
    });
  }); 
}

await new Promise(async (resolve, reject) => {
  const lock = await new Promise((resolve, reject) => {
    fs.readFile('package-lock.json', 'utf8').then(lock => {
      try {
        lock = JSON.parse(lock.toString());
      } catch {
        throw 'package-lock.json is not valid json?';
      }
      resolve(lock);
    }).catch(err => reject(err));
  });
  return await (async () => {
    const getSHA = name => {
      const sha = lock['packages'][`node_modules/${name}`]?.resolved;
      if (!sha) throw `Invalid resolved ${name}`;
      console.log(`SHA1 of ${name}: ${sha.slice(sha.indexOf('#') + 1)}`);
      return sha.slice(sha.indexOf('#') + 1);
    };
    const updateDep = async (name, branch) => {
      branch = branch || 'develop';
      console.log(`Trying to update ${name}#${branch}`);
      const sha = getSHA(name);
      let res = await fetch(`https://api.github.com/repos/Unsandboxed/${name}/commits/develop?limit=1&cache=${Date.now()}`);
      if (!res.ok) return `Failed to fetch commits for ${name}`;
      res = await res.json();
      if (!res || !res.sha) return 'Invalid SHA1 commit hash';
      console.log(`${name} current sha: ${res.sha}`);
      if (sha === res.sha) return true;
      console.log(`Updating ${name}`);
      await new Promise((resolve, reject) => {
        const cmd = ['npm', ['install', name, `github:Unsandboxed/${name}#${branch}`, '--package-lock-only']];
        console.log('Running', cmd);
        const child = childProcess.spawn(...cmd, {
          cwd: path.join(__dirname, '../')
        });
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', data => console.log('NPM @', data));
        child.stderr.on('data', data => console.log('NPM !', data));
        child.once('close', code => (console.log('NPM closed with code', code), resolve(true)));
      });
      console.log(`Updated ${name}`);
      return true;
    };
    let res = false;
    if (res = ((await Promise_all([
      updateDep('scratch-vm'),
      updateDep('scratch-render'),
      updateDep('scratch-blocks', 'develop-builds')
    ])).find(item => (typeof item === 'string')))) throw `Failed to update ${res}`;
    res = true;
    console.log('Updated dependancies\nRun:\n1. git add .\n2. git commit -m "Update dependancies"\n3. git push');
    resolve();
  })().catch(err => {
    console.error('Failed with error: ');
    console.error(err);
    resolve();
  });
});
