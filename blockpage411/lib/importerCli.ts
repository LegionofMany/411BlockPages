import fs from 'fs';
import readline from 'readline';
import path from 'path';
import importItems from './importProviderHelper';

export type ImporterOptions = {
  batchSize?: number;
  dryRun?: boolean;
  retryAttempts?: number;
  checkpointFile?: string;
  progressLog?: string | null;
  resume?: boolean;
  // treat file as NDJSON (one JSON object per line) when true
  ndjson?: boolean;
  // simple CSV parsing when true
  csv?: boolean;
};

export async function importFromFile(filePath: string, options: ImporterOptions = {}){
  const batchSize = options.batchSize ?? 1000;
  const dryRun = !!options.dryRun;
  const retryAttempts = options.retryAttempts ?? 3;
  const checkpointFile = options.checkpointFile || path.join(process.cwd(), '.import-status.json');
  const progressLog = options.progressLog || null;
  const resume = !!options.resume;
  const ndjson = !!options.ndjson;
  const csv = !!options.csv;

  if (!fs.existsSync(filePath)) throw new Error('File not found: ' + filePath);

  // determine resume index
  let lastIndex = 0;
  if (resume && fs.existsSync(checkpointFile)){
    try{ const s = JSON.parse(fs.readFileSync(checkpointFile,'utf8')); lastIndex = Number(s.lastIndex) || 0; }catch(e){}
  }

  const writeCheckpoint = (idx: number, processed: number, total: number) => {
    const state = { lastIndex: idx, processed, total, updatedAt: new Date().toISOString() };
    try{ fs.writeFileSync(checkpointFile, JSON.stringify(state, null, 2)); }catch(e){ /* ignore */ }
    if (progressLog){ try{ fs.appendFileSync(progressLog, JSON.stringify(state) + '\n'); }catch(e){} }
  };

  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let total = 0; // unknown until finish for some formats
  let index = 0; // zero-based index of items encountered
  let processed = 0;
  // single narrow use of `any` for unstructured parsed rows from input files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let batch: any[] = [];

  const flushBatch = async () => {
    if (!batch.length) return;
    // try with retry/backoff
    for (let attempt = 0; attempt <= retryAttempts; attempt++){
      try{
        // Guard importItems with a timeout to avoid hanging on misbehaving model calls
        const importPromise = importItems(batch, { batchSize, dryRun, retryAttempts });
        const timeoutMs = 10000;
        const res = await Promise.race([
          importPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('importItems timeout')), timeoutMs))
        ]) as Awaited<ReturnType<typeof importItems>>;
        processed += (res.inserted || 0) + (res.updated || 0);
        // write checkpoint marking we've processed up to index
        writeCheckpoint(index, processed, total || -1);
        batch = [];
        break;
      }catch(e){
        if (attempt === retryAttempts) throw e;
        // exponential backoff
        await new Promise(r => setTimeout(r, 200 * Math.pow(2, attempt)));
      }
    }
  };

  // If CSV option is set, handle header and parse simple CSV
  if (csv){
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(l=>l.trim()).filter(Boolean);
    if (!lines.length) return { processed: 0 };
    const headers = lines.shift()!.split(',').map(h=>h.trim());
    total = lines.length;
    for (let i = 0; i < lines.length; i++){
      index++;
      if (index <= lastIndex) continue;
      const cols = lines[i].split(',').map(c=>c.trim());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: any = {};
      headers.forEach((h, j)=> obj[h] = cols[j]);
      batch.push(obj);
      if (batch.length >= batchSize){ await flushBatch(); }
    }
    await flushBatch();
    writeCheckpoint(index, processed, total);
    return { processed, total };
  }

  // NDJSON or line-delimited JSON
  for await (const line of rl){
    if (!line || !line.trim()) continue;
    // If the file is a JSON array, we didn't handle it here
    if (!ndjson && line.trim().startsWith('[')){
      // fallback: parse whole file (not streaming-friendly)
      rl.close();
      stream.close();
      const raw = fs.readFileSync(filePath, 'utf8');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = [];
      try{ items = JSON.parse(raw); }catch(e){ throw new Error('Failed to parse file as JSON array; for large files use NDJSON or CSV'); }
      total = items.length;
      for (let i = 0; i < items.length; i++){
        index = i;
        if (index < lastIndex) continue;
        batch.push(items[i]);
        if (batch.length >= batchSize) await flushBatch();
      }
      await flushBatch();
      writeCheckpoint(index+1, processed, total);
      return { processed, total };
    }

    // line is a JSON object
    if (index < lastIndex){ index++; continue; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let item: any = null;
    try{ item = JSON.parse(line); }catch(e){
      // skip malformed line but continue
      index++; continue;
    }
    batch.push(item);
    index++;
    if (batch.length >= batchSize){ await flushBatch(); }
  }

  // final flush
  await flushBatch();
  // final checkpoint
  writeCheckpoint(index, processed, total || index);
  return { processed, total: total || index };
}

export default { importFromFile };
