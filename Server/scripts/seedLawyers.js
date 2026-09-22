const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Lawyer = require('../models/Lawyer');

// Specialization pools for fallbacks
const SPECIALIZATION_POOLS = [
  ['Women Rights', 'Domestic Violence & Protection', 'Family Law & Matrimonial'],
  ['Family Law & Matrimonial', 'Child Custody & Maintenance', 'Civil Law'],
  ['Criminal Defense', 'Domestic Violence & Protection', 'Cyber Crime & Harassment'],
  ['Labor & Workplace Harassment', 'Women Rights', 'Civil Law'],
  ['Constitutional Law', 'Women Rights', 'Human Rights'],
  ['Property Law', 'Family Law & Matrimonial', 'Succession & Inheritance'],
  ['Cyber Crime & Harassment', 'Criminal Defense', 'Women Rights'],
];

// Language mapping based on State
const STATE_LANGUAGES = {
  Maharashtra: ['Marathi', 'Hindi', 'English'],
  'Tamil Nadu': ['Tamil', 'English'],
  Karnataka: ['Kannada', 'English', 'Hindi'],
  Kerala: ['Malayalam', 'English'],
  Rajasthan: ['Hindi', 'English', 'Rajasthani'],
  Gujarat: ['Gujarati', 'Hindi', 'English'],
  'West Bengal': ['Bengali', 'Hindi', 'English'],
  Punjab: ['Punjabi', 'Hindi', 'English'],
  'Uttar Pradesh': ['Hindi', 'English'],
  Delhi: ['Hindi', 'English'],
  'Andhra Pradesh': ['Telugu', 'English', 'Hindi'],
  Telangana: ['Telugu', 'English', 'Hindi'],
  Assam: ['Assamese', 'English', 'Hindi'],
  Odisha: ['Odia', 'English', 'Hindi'],
  Bihar: ['Hindi', 'English'],
};

// Normalize State Names to match INDIAN_STATES
function normalizeState(rawState) {
  if (!rawState) return 'Maharashtra';
  const s = rawState.trim();
  const lower = s.toLowerCase();
  if (lower.includes('maharashtra')) return 'Maharashtra';
  if (lower.includes('tamil nadu')) return 'Tamil Nadu';
  if (lower.includes('karnataka')) return 'Karnataka';
  if (lower.includes('kerala')) return 'Kerala';
  if (lower.includes('rajasthan')) return 'Rajasthan';
  if (lower.includes('delhi')) return 'Delhi';
  if (lower.includes('uttar pradesh')) return 'Uttar Pradesh';
  if (lower.includes('gujarat')) return 'Gujarat';
  if (lower.includes('punjab')) return 'Punjab';
  if (lower.includes('andhra pradesh')) return 'Andhra Pradesh';
  if (lower.includes('telangana')) return 'Telangana';
  if (lower.includes('west bengal')) return 'West Bengal';
  if (lower.includes('madhya pradesh')) return 'Madhya Pradesh';
  if (lower.includes('jammu and kashmir') || lower.includes('jammu & kashmir')) return 'Jammu and Kashmir';
  if (lower.includes('andaman')) return 'Andaman and Nicobar Islands';
  if (lower.includes('dadra')) return 'Dadra and Nagar Haveli and Daman and Diu';
  return s;
}

// Parse Location into City and District
function parseLocation(rawLoc, state) {
  if (!rawLoc) return { city: state, district: state };
  const cleaned = rawLoc.trim();

  if (cleaned.includes('/')) {
    const parts = cleaned.split('/').map((p) => p.trim());
    return {
      city: parts[0] || parts[1] || state,
      district: parts[1] || parts[0] || state,
    };
  }

  return {
    city: cleaned,
    district: cleaned,
  };
}

// Parse lawyers_500_public_contacts.txt
function parseTxtFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const records = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split('|').map((p) => p.trim());
    if (parts.length >= 5 && /^\d+$/.test(parts[0])) {
      const id = parts[0];
      const name = parts[1];
      const location = parts[2];
      const rawState = parts[3];
      const phone = parts[4];

      records.push({
        id: `TXT-${id}`,
        name,
        location,
        state: rawState,
        phone,
      });
    }
  }

  return records;
}

// Parse Excel file (.xlsx)
function parseXlsxFile(filePath) {
  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames.find(
    (n) => n.toLowerCase().includes('seed') || n.toLowerCase().includes('lawyer')
  ) || wb.SheetNames[0];

  const ws = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(ws);
  const records = [];

  for (const row of rows) {
    const name = row['Lawyer Name'] || row['Name'] || row['Advocate Name'];
    if (!name) continue;

    const rawState = row['State / UT'] || row['State'] || 'Maharashtra';
    const location = row['City / Coverage'] || row['City'] || row['District'] || '';
    const phone = row['Phone / Public Contact'] || row['Phone'] || row['Mobile'] || 'Contact via State Bar Council';
    const seedId = row['Seed ID'] || '';
    const primarySpec = row['Primary Specialization'] || '';
    const specTags = row['Specialization Tags']
      ? String(row['Specialization Tags'])
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : primarySpec
      ? [primarySpec]
      : null;

    const notes = row['Notes'] || '';

    records.push({
      id: seedId ? `XLS-${seedId}` : null,
      name,
      location,
      city: location,
      district: location,
      state: rawState,
      phone: String(phone).trim() || 'Contact via State Bar Council',
      specialization: specTags,
      notes,
    });
  }

  return records;
}

async function seed() {
  console.log('=== Shakti-Setu Multi-Source Lawyer Seeder ===');

  // Discover all available seed files in project
  const possiblePaths = [
    // 1. 36 Jurisdictions Excel Seed
    path.join(__dirname, '..', '..', 'lawyers', 'shakti_setu_36_jurisdictions_lawyer_seed.xlsx'),
    path.join(__dirname, '..', 'lawyers', 'shakti_setu_36_jurisdictions_lawyer_seed.xlsx'),
    path.join(process.cwd(), 'lawyers', 'shakti_setu_36_jurisdictions_lawyer_seed.xlsx'),
    // 2. 500 Public Contacts TXT Seed
    path.join(__dirname, '..', '..', 'lawyers', 'lawyers_500_public_contacts.txt'),
    path.join(__dirname, '..', 'lawyers', 'lawyers_500_public_contacts.txt'),
    path.join(process.cwd(), 'lawyers', 'lawyers_500_public_contacts.txt'),
  ];

  // Deduplicate files by basename so duplicates across root and Server/ are not processed twice
  const uniqueByBasename = new Map();
  possiblePaths.forEach((p) => {
    if (fs.existsSync(p)) {
      const base = path.basename(p);
      if (!uniqueByBasename.has(base)) {
        uniqueByBasename.set(base, p);
      }
    }
  });

  const foundFiles = Array.from(uniqueByBasename.values());
  console.log(`Found ${foundFiles.length} unique seed data files:`);
  foundFiles.forEach((f) => console.log(`  - ${f}`));

  if (foundFiles.length === 0) {
    console.error('Error: No lawyer data files found in lawyers/ directory.');
    process.exit(1);
  }

  let allRecords = [];

  for (const filePath of foundFiles) {
    const ext = path.extname(filePath).toLowerCase();
    let fileRecords = [];
    if (ext === '.xlsx') {
      console.log(`Parsing Excel file: ${path.basename(filePath)}...`);
      fileRecords = parseXlsxFile(filePath);
    } else if (ext === '.txt') {
      console.log(`Parsing TXT file: ${path.basename(filePath)}...`);
      fileRecords = parseTxtFile(filePath);
    }
    console.log(`  -> Loaded ${fileRecords.length} records from ${path.basename(filePath)}.`);
    allRecords = allRecords.concat(fileRecords);
  }

  console.log(`Total combined records to seed: ${allRecords.length}`);

  // Connect to MongoDB
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shakti-setu';
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB Connected.');

  const defaultPasswordHash = await bcrypt.hash('PublicListing@2025!', 10);
  const bulkOps = [];
  let index = 0;

  for (const rec of allRecords) {
    index++;
    const state = normalizeState(rec.state);
    const { city, district } = rec.district && rec.city
      ? { city: rec.city, district: rec.district }
      : parseLocation(rec.location, state);

    const safeId = rec.id || `REC-${String(index).padStart(4, '0')}`;
    const stateCode = (state.replace(/[^A-Za-z]/g, '').substring(0, 3) || 'IND').toUpperCase();
    const barNumber = `BAR-${stateCode}-${safeId}`;
    const email = `seed.${safeId.toLowerCase().replace(/[^a-z0-9]/g, '')}@publicdir.shaktisetu.org`;

    // Experience: between 4 and 25 years
    const experience = rec.experience || (5 + (index % 16));

    // Specialization
    const specialization = rec.specialization && Array.isArray(rec.specialization) && rec.specialization.length > 0
      ? rec.specialization
      : SPECIALIZATION_POOLS[index % SPECIALIZATION_POOLS.length];

    // Languages
    const languages = STATE_LANGUAGES[state] || ['Hindi', 'English'];

    const bio = rec.notes
      ? `${rec.notes} Practicing in ${district}, ${state}.`
      : `Publicly listed advocate in ${district}, ${state}. Specializing in ${specialization.slice(0, 2).join(' & ')}.`;

    const lawyerDoc = {
      name: rec.name.trim(),
      email,
      phone: rec.phone.trim(),
      barNumber,
      specialization,
      experience,
      state,
      district,
      city,
      address: `${city ? city + ', ' : ''}${district}, ${state}`,
      status: 'approved',
      isSeed: true,
      bio,
      languages,
      education: ['LL.B - Bachelor of Laws'],
      consultationFee: 0,
      averageRating: 4.2 + ((index % 8) * 0.1),
      totalRatings: 3 + (index % 12),
      totalConsultations: 10 + (index % 30),
      availability: {
        monday: { available: true, hours: '10:00 AM - 5:00 PM' },
        tuesday: { available: true, hours: '10:00 AM - 5:00 PM' },
        wednesday: { available: true, hours: '10:00 AM - 5:00 PM' },
        thursday: { available: true, hours: '10:00 AM - 5:00 PM' },
        friday: { available: true, hours: '10:00 AM - 5:00 PM' },
        saturday: { available: true, hours: '10:00 AM - 2:00 PM' },
        sunday: { available: false, hours: '' },
      },
      password: defaultPasswordHash,
    };

    bulkOps.push({
      updateOne: {
        filter: { barNumber },
        update: { $set: lawyerDoc },
        upsert: true,
      },
    });
  }

  console.log(`Writing ${bulkOps.length} lawyers to database in batches...`);
  const batchSize = 100;
  for (let i = 0; i < bulkOps.length; i += batchSize) {
    const batch = bulkOps.slice(i, i + batchSize);
    await Lawyer.bulkWrite(batch);
    process.stdout.write(`Processed ${Math.min(i + batchSize, bulkOps.length)} / ${bulkOps.length}\r`);
  }

  console.log('\nSeeding completed successfully!');
  const totalApproved = await Lawyer.countDocuments({ status: 'approved' });
  const totalDistricts = await Lawyer.distinct('district', { status: 'approved' });
  const totalStates = await Lawyer.distinct('state', { status: 'approved' });

  console.log(`Total Approved Lawyers in DB: ${totalApproved}`);
  console.log(`Total Covered States & UTs: ${totalStates.length} (${totalStates.join(', ')})`);
  console.log(`Total Covered Districts: ${totalDistricts.length}`);

  await mongoose.disconnect();
  console.log('MongoDB Disconnected.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
