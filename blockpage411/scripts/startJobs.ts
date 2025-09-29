// scripts/startJobs.ts
import path from 'path';
import { fork } from 'child_process';

// Start all jobs in jobs/index.ts
const jobsPath = path.resolve(__dirname, '../jobs/index.ts');

fork(jobsPath);

console.log('Automated background jobs started.');
