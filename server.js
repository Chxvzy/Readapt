const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const db = require('./db');
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');

const app = express();

// Cliente do Google (o 'postmessage' é o valor usado pelo login em pop-up)
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ==========================================
// UPLOAD DE FOTO DE PERFIL
// ==========================================
const UPLOADS_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

// Recebe o arquivo na memória (limite 2 MB); quem grava no disco é a rota, depois de validar
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }
});

function receberFoto(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'A foto deve ter no máximo 2 MB.' });
      }
      return res.status(400).json({ error: 'Erro ao enviar a foto.' });
    }
    next();
  });
}

// Confere o tipo REAL do arquivo pelos primeiros bytes (não confia no nome nem no mimetype)
function detectarTipoImagem(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'png';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

app.post('/api/upload-photo', receberFoto, async (req, res) => {
  const id = parseInt(req.body && req.body.id, 10);

  if (!id || !req.file) {
    return res.status(400).json({ error: 'Envie uma foto válida.' });
  }

  const ext = detectarTipoImagem(req.file.buffer);
  if (!ext) {
    return res.status(400).json({ error: 'Formato inválido. Use JPG, PNG ou WEBP.' });
  }

  try {
    const [rows] = await db.query('SELECT photo_url FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const nomeArquivo = `user-${id}-${Date.now()}.${ext}`;
    await fs.promises.writeFile(path.join(UPLOADS_DIR, nomeArquivo), req.file.buffer);

    const photo_url = `/uploads/${nomeArquivo}`;
    await db.query('UPDATE users SET photo_url = ? WHERE id = ?', [photo_url, id]);

    // Apaga a foto anterior para não acumular arquivos
    const antiga = rows[0].photo_url;
    if (antiga && antiga.startsWith('/uploads/')) {
      fs.promises.unlink(path.join(UPLOADS_DIR, path.basename(antiga))).catch(() => {});
    }

    res.status(200).json({ message: 'Foto atualizada com sucesso!', photo_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

app.post('/api/remove-photo', async (req, res) => {
  const id = parseInt(req.body && req.body.id, 10);

  if (!id) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  try {
    const [rows] = await db.query('SELECT photo_url FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await db.query('UPDATE users SET photo_url = NULL WHERE id = ?', [id]);

    // Apaga o arquivo da pasta uploads
    const antiga = rows[0].photo_url;
    if (antiga && antiga.startsWith('/uploads/')) {
      fs.promises.unlink(path.join(UPLOADS_DIR, path.basename(antiga))).catch(() => {});
    }

    res.status(200).json({ message: 'Foto removida com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ==========================================
// CADASTRO
// ==========================================
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos!' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado!' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    );

    res.status(201).json({
      message: 'Conta criada com sucesso!',
      user: { id: result.insertId, name, email, photo_url: null }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'E-mail já cadastrado!' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ==========================================
// LOGIN
// ==========================================
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Preencha e-mail e senha!' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos!' });
    }

    const user = users[0];
        // Conta criada pelo Google não tem senha
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Esta conta usa o login com Google.' });
    }
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos!' });
    }

    res.status(200).json({
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photo_url: user.photo_url || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ==========================================
// LOGIN COM GOOGLE
// ==========================================
app.post('/api/auth/google', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Código do Google não recebido.' });
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET não configurados no .env');
    return res.status(500).json({ error: 'Login com Google não configurado no servidor.' });
  }

  // 1. Troca o código pelo token e confere se ele foi emitido para o NOSSO app
  let payload;
  try {
    const { tokens } = await googleClient.getToken(code);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error('Erro ao validar login do Google:', error.message);
    return res.status(401).json({ error: 'Não foi possível validar o login com o Google.' });
  }

  if (!payload || !payload.email || !payload.email_verified) {
    return res.status(401).json({ error: 'O e-mail da conta Google não está verificado.' });
  }

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;
  const name = (payload.name || email.split('@')[0]).slice(0, 100);

  try {
    // 2. Já existe? (pelo id do Google ou pelo e-mail)
    const [rows] = await db.query(
      'SELECT * FROM users WHERE google_id = ? OR email = ? LIMIT 1',
      [googleId, email]
    );

    let user = rows[0];

    if (user) {
      // Conta criada com e-mail/senha: vincula o Google a ela
      if (!user.google_id) {
        await db.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
      }
    } else {
      // 3. Primeira vez: cria a conta (sem senha)
      const [result] = await db.query(
        'INSERT INTO users (name, email, google_id) VALUES (?, ?, ?)',
        [name, email, googleId]
      );
      user = { id: result.insertId, name, email, photo_url: null };
    }

    res.status(200).json({
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photo_url: user.photo_url || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ==========================================
// ATUALIZAR NOME
// ==========================================
app.put('/api/update-name', async (req, res) => {
  const { id, name } = req.body;

  if (!id || !name || !name.trim()) {
    return res.status(400).json({ error: 'Nome inválido!' });
  }

  try {
    await db.query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), id]);
    res.status(200).json({ message: 'Nome atualizado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});