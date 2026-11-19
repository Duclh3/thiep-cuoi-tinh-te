import fs from 'node:fs';
import path from 'node:path';

const memoryWishesByCustomer = {};

function getSafeCustomer(req) {
  const urlObj = new URL(req.url || '/', 'http://localhost');
  const raw = req.query?.customer ?? urlObj.searchParams.get('customer') ?? '';
  const safe = String(raw).replace(/[^a-z0-9-]/gi, '').toLowerCase();
  return safe || 'default';
}

function getWishesFilePath(customerKey) {
  const fileName = customerKey === 'default' ? 'wishes.json' : `wishes-${customerKey}.json`;
  return path.join(process.cwd(), 'data', fileName);
}

function loadWishes(customerKey) {
  if (memoryWishesByCustomer[customerKey]) return memoryWishesByCustomer[customerKey];
  const filePath = getWishesFilePath(customerKey);
  try {
    if (fs.existsSync(filePath)) {
      memoryWishesByCustomer[customerKey] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return memoryWishesByCustomer[customerKey];
    }
  } catch {
    // ignore
  }
  memoryWishesByCustomer[customerKey] = [];
  return memoryWishesByCustomer[customerKey];
}

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const customerKey = getSafeCustomer(req);
  const filePath = getWishesFilePath(customerKey);

  if (req.method === 'GET') {
    return res.status(200).json(loadWishes(customerKey));
  }
  if (req.method === 'POST') {
    const wish = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const current = loadWishes(customerKey);
    memoryWishesByCustomer[customerKey] = [wish, ...current];
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(memoryWishesByCustomer[customerKey], null, 2), 'utf-8');
    } catch {
      // On read-only serverless container, memoryWishesByCustomer + client storage keeps it alive
    }
    return res.status(200).json(memoryWishesByCustomer[customerKey]);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
