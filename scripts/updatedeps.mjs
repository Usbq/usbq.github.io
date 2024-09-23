import childProcess from 'child-process-es6-promise';
import fetch from 'node-fetch';
import fs from 'fs/promises';

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

await new Promise((resolve, reject) => {
  fs.readFile('package-lock.json', 'utf8').then(async (lock) => {
    try {
      lock = JSON.parse(lock.toString());
    } catch {
      throw 'package-lock.json is not valid json?';
    }
    const getSHA = name => {
      const sha = lock['packages'][`node_modules/${name}`]?.resolved;
      if (!sha) throw `Invalid resolved ${name}`;
      return sha.slice(sha.indexOf('#') + 1);
    };
    const updateDep = async (name, branch) => {
      branch = branch || 'develop';
      console.log(`Trying to update ${name}#${branch}`);
      const sha = getSHA(name);
      let res = await fetch(`https://api.github.com/repos/Unsandboxed/${name}/commits/develop?limit=1`);     
      if (!res.ok) return `Failed to fetch commits for ${name}`;
      res = await res.json();
      if (!res || !res.sha) return 'Invalid SHA1 commit hash';
      if (sha === res.sha) return true;
      console.log(`Updating ${name}`);
      await new Promise((resolve, reject) => {
        childProcess.spawn('npm', ['i', name, `github:Unsandboxed/${name}#${branch}`]).then(value => resolve(true)).catch(err => reject(err));
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
  }).catch(err => {
    console.error('Failed with error: ');
    console.error(err);
    resolve();
  });
});
