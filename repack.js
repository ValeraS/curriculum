/* eslint-disable no-eval, no-process-exit */
import fs from 'fs-extra';
import path from 'path';
import { UnpackedChallenge } from './unpackedChallenge';

// Repack all challenges from all
// seed/unpacked/00-foo/bar/000-xxx-id.html files
// into
// seed/challenges/00-foo/bar.json files

let unpackedRoot = path.join(__dirname, 'unpacked');
let seedChallengesRoot = path.join(__dirname, 'challenges');

function directoriesIn(parentDir) {
  return fs
    .readdirSync(parentDir)
    .filter(entry => fs.statSync(path.join(parentDir, entry)).isDirectory());
}

let superBlocks = directoriesIn(unpackedRoot);
superBlocks.forEach(superBlock => {
  let superBlockPath = path.join(unpackedRoot, superBlock);
  console.log(`Repacking ${superBlockPath}...`);
  let blocks = directoriesIn(superBlockPath);
  blocks.forEach(blockName => {
    let blockPath = path.join(superBlockPath, blockName);
    let blockFilePath = path.join(blockPath, blockName + '.json');
    let block = require(blockFilePath);
    Promise.all(
      block.challenges.map((challengeJson, index) => {
        let unpackedChallenge = new UnpackedChallenge(
          blockPath,
          challengeJson,
          index
        );
        let unpackedFile = unpackedChallenge.challengeFile();
        return unpackedFile.readChunks().then(chunks => {
          Object.assign(block.challenges[index], chunks);
        });
      })
    ).then(() => {
      let outputFilePath = path.join(
        seedChallengesRoot,
        superBlock,
        blockName + '.json'
      );
      return fs.writeJSON(outputFilePath, block, { spaces: 2 });
    });
  });
});

// let challenges = getChallenges();
// challenges.forEach(challengeBlock => {
//   console.log()
// });
