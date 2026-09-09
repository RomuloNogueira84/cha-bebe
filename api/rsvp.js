const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_DB_TOKEN,
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { nome, email, telefone, confirmado } = req.body;
  if (!nome || !email || !confirmado) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, email, confirmado' });
  }

  try {
    // Garante que a tabela existe (só faz efeito na primeira vez)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rsvps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT,
        confirmado TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    const result = await db.execute({
      sql: `INSERT INTO rsvps (nome, email, telefone, confirmado) VALUES (?, ?, ?, ?)`,
      args: [nome, email, telefone || '', confirmado],
    });

    return res.status(201).json({ id: result.lastInsertRowid.toString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao salvar RSVP' });
  }
};