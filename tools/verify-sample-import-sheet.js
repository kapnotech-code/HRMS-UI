/**
 * Runs every row of the generated sample sheet through the SHARED validator
 * (the same rules the import page uses) to prove the file imports cleanly.
 *
 * Run: node tools/verify-sample-import-sheet.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const XLSX = require('xlsx');
const ts = require('typescript');

const REPO = path.resolve(__dirname, '..');
const SHARED = path.join(REPO, 'src/app/shared');
const COLUMNS_TS = path.join(SHARED, 'constants/employee-report-columns.ts');
const VALIDATOR_TS = path.join(SHARED, 'validators/employee-validators.ts');

function readColumns() {
  const src = fs.readFileSync(COLUMNS_TS, 'utf8');
  const block = src.slice(src.indexOf('const RAW_REPORT_COLUMNS'));
  const re = /\{\s*key:\s*'([^']+)',\s*label:\s*(?:'((?:[^'\\]|\\.)*)'|"([^"]*)")/g;
  const out = [];
  let m;
  while ((m = re.exec(block)) !== null) {
    out.push({ key: m[1], label: (m[2] ?? m[3] ?? '').replace(/\\'/g, "'") });
  }
  return out;
}

/**
 * Compiles the real TypeScript validator (and the column constants it
 * imports) to CommonJS in a temp dir and loads it — so this script exercises
 * the exact same code the Angular app runs, with no copy-paste drift.
 */
function loadValidator() {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emp-validator-'));
  // Mirror the source folder layout so the relative imports still resolve.
  const outPath = {
    [COLUMNS_TS]: path.join(outDir, 'constants', 'employee-report-columns.js'),
    [VALIDATOR_TS]: path.join(outDir, 'validators', 'employee-validators.js'),
  };

  const transpile = (entry) => {
    const result = ts.transpileModule(fs.readFileSync(entry, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const outFile = outPath[entry] ?? path.join(outDir, path.basename(entry).replace(/\.ts$/, '.js'));
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, result.outputText);
    return outFile;
  };

  transpile(COLUMNS_TS);
  const validatorJs = transpile(VALIDATOR_TS);
  return require(validatorJs);
}

const columns = readColumns();
const { validateEmployee } = loadValidator();

// Masters the sample sheet was written against.
const masters = {
  companies: [{ id: 1, name: 'KapnoTech' }],
  departments: [
    { id: 1, name: 'Information Technology' },
    { id: 2, name: 'Human Resources' },
    { id: 3, name: 'Finance' },
    { id: 4, name: 'Sales' },
  ],
  designations: [
    { id: 1, name: 'Software Engineer' },
    { id: 2, name: 'HR Executive' },
    { id: 3, name: 'Accountant' },
    { id: 4, name: 'Sales Executive' },
  ],
  shifts: [
    { id: 1, name: 'Morning Shift' },
    { id: 2, name: 'General Shift' },
    { id: 3, name: 'Night Shift' },
  ],
  // The sample lists Aarav Sharma / Diya Verma as managers, who exist in the
  // very same sheet — pre-seed them so cross-row manager lookups resolve.
  employees: [
    { employeeID: 1, employeeCode: 'EMP-1001', firstName: 'Aarav', lastName: 'Sharma' },
    { employeeID: 2, employeeCode: 'EMP-1002', firstName: 'Diya', lastName: 'Verma' },
  ],
  existingCodes: new Set(),
  existingEmails: new Set(),
};

const wb = XLSX.readFile(path.join(REPO, 'Employee_Import_Sample_10_Rows.xlsx'));
const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });

const usedEmails = new Set();
let bad = 0;

json.forEach((sheetRow, i) => {
  const values = {};
  columns.forEach((c) => {
    values[c.key] = sheetRow[c.label] ?? '';
  });

  // In-file duplicate email, same as the import page checks.
  const email = String(values.email || '').toLowerCase();
  if (email && usedEmails.has(email)) {
    console.log(`row ${i + 2}  ✕  in-file duplicate Email "${values.email}"`);
    bad++;
    return;
  }
  usedEmails.add(email);

  const result = validateEmployee(values, { resolveLookups: true, ...masters });
  if (result.isValid) {
    console.log(`row ${i + 2}  ✓  ${values.employeeCode}  ${values.firstName} ${values.lastName}`);
  } else {
    bad++;
    console.log(`row ${i + 2}  ✕  ${values.employeeCode}`);
    result.messages.forEach((m) => console.log(`          - ${m}`));
  }
});

console.log(`\n${json.length - bad}/${json.length} rows valid`);
process.exit(bad === 0 ? 0 : 1);
