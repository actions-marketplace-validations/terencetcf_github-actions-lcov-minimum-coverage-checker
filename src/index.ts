import fs from 'fs';
import path from 'path';
import os from 'os';
import core from '@actions/core';
import github from '@actions/github';
import parseLCOV from 'parse-lcov';

async function run() {
  try {
    const tmpPath = path.resolve(os.tmpdir(), github.context.action);
    const coverageFilesPattern = core.getInput('coverage-file');
    const coverageFilePath = tmpPath + coverageFilesPattern;
    const coverageFileContent = fs.readFileSync(coverageFilePath, {
      encoding: 'utf-8',
    });
    const lcovRecords = parseLCOV(coverageFileContent);
    const totalLinesHit = lcovRecords.reduce<number>(
      (acc, rec) => acc + rec.lines.hit,
      0
    );
    const totalLinesFound = lcovRecords.reduce<number>(
      (acc, rec) => acc + rec.lines.found,
      0
    );
    const totalCoverage = Math.round((totalLinesHit / totalLinesFound) * 100);
    const minimumCoverage = parseInt(core.getInput('minimum-coverage'));
    const isFailure = totalCoverage < minimumCoverage;

    if (isFailure) {
      core.setFailed(
        `The current code coverage (${totalCoverage}%) is below the ${minimumCoverage}%.`
      );
      return;
    }

    core.info(`The current code coverage ${totalCoverage}%`);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
