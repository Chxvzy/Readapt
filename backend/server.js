const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { put, del } = require('@vercel/blob');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const db = require('./db');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();

// Cliente do Google (o 'postmessage' é o valor usado pelo login em pop-up)
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '..', 'frontend')));

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

// Padroniza o e-mail (sem espaços e em minúsculas) para cadastro, login e Google
function normalizarEmail(valor) {
  return String(valor || '').trim().toLowerCase();
}

// Cria o token de login (JWT) que o front guarda e manda nas rotas protegidas
function gerarToken(userId) {
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET não configurado: o login funciona, mas rotas protegidas não.');
    return null;
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Protege rotas: só deixa passar quem mandou um token válido
function autenticar(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Servidor sem JWT_SECRET configurado.' });
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' });
  }
}

// ==========================================
// ENVIO DE E-MAIL (REDEFINIÇÃO DE SENHA)
// ==========================================
function emailConfigurado() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && process.env.FRONTEND_URL);
}

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }
  return transporter;
}

function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

async function enviarEmailRedefinicao(destino, nome, link) {
  const primeiroNome = escaparHtml(String(nome || '').trim().split(' ')[0]);
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}!` : 'Olá!';

  await getTransporter().sendMail({
    from: `"Readapt" <${process.env.GMAIL_USER}>`,
    to: destino,
    subject: 'Criar nova senha do Readapt',
    text:
      `${saudacao.replace(/&#39;/g, "'")}\n\n` +
      `Recebemos um pedido para criar uma nova senha na sua conta do Readapt.\n` +
      `Abra o link abaixo para continuar (vale por 30 minutos e só pode ser usado uma vez):\n\n` +
      `${link}\n\n` +
      `Se você não pediu isso, ignore este e-mail: sua senha continua a mesma.`,
    html:
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222">` +
      `<h2 style="color:#1F41BB;margin:0 0 16px">Readapt</h2>` +
      `<p>${saudacao}</p>` +
      `<p>Recebemos um pedido para criar uma nova senha na sua conta. Toque no botão abaixo para continuar:</p>` +
      `<p style="margin:28px 0"><a href="${link}" style="background:#2463EB;color:#ffffff;text-decoration:none;` +
      `padding:14px 28px;border-radius:12px;font-weight:bold;display:inline-block">Criar nova senha</a></p>` +
      `<p style="font-size:13px;color:#555">O link vale por 30 minutos e só pode ser usado uma vez.</p>` +
      `<p style="font-size:13px;color:#555">Se você não pediu isso, pode ignorar este e-mail: sua senha continua a mesma.</p>` +
      `</div>`
  });
}

// ==========================================
// UPLOAD DE FOTO DE PERFIL
// ==========================================
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const usarBlob = Boolean(
  process.env.VERCEL === '1' ||
  process.env.BLOB_READ_WRITE_TOKEN ||
  (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
);

if (!usarBlob) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  app.use('/uploads', express.static(UPLOADS_DIR));
}

// Recebe o arquivo na memória (limite 2 MB); quem grava é a rota, depois de validar
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

async function apagarFoto(photoUrl) {
  if (!photoUrl) return;

  if (/^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(photoUrl)) {
    await del(photoUrl);
  } else if (photoUrl.startsWith('/uploads/')) {
    await fs.promises.unlink(path.join(UPLOADS_DIR, path.basename(photoUrl))).catch(() => {});
  }
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

    let photo_url;
    if (usarBlob) {
      const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      const blob = await put(`profile-photos/user-${id}.${ext}`, req.file.buffer, {
        access: 'public',
        addRandomSuffix: true,
        contentType
      });
      photo_url = blob.url;
    } else {
      const nomeArquivo = `user-${id}-${Date.now()}.${ext}`;
      await fs.promises.writeFile(path.join(UPLOADS_DIR, nomeArquivo), req.file.buffer);
      photo_url = `/uploads/${nomeArquivo}`;
    }

    await db.query('UPDATE users SET photo_url = ? WHERE id = ?', [photo_url, id]);

    // Apaga a foto anterior para não acumular arquivos
    apagarFoto(rows[0].photo_url).catch((error) => console.error('Erro ao apagar foto anterior:', error));

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

    apagarFoto(rows[0].photo_url).catch((error) => console.error('Erro ao apagar foto anterior:', error));

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
  const { name, password } = req.body;
  const email = normalizarEmail(req.body.email);

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
      user: {
        id: result.insertId,
        name,
        email,
        photo_url: null,
        token: gerarToken(result.insertId)
      }
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
  const { password } = req.body;
  const email = normalizarEmail(req.body.email);

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
        photo_url: user.photo_url || null,
        token: gerarToken(user.id)
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

  const email = normalizarEmail(payload.email);
  const googleId = payload.sub;
  const name = (payload.name || email.split('@')[0]).slice(0, 100);

  try {
    // 2. Já entrou com esse Google antes?
    let [rows] = await db.query('SELECT * FROM users WHERE google_id = ? LIMIT 1', [googleId]);
    let user = rows[0];

    // 3. Não? Procura uma conta com o mesmo e-mail (cadastro normal) e vincula o Google a ela
    if (!user) {
      [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      user = rows[0];
      if (user && !user.google_id) {
        await db.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
      }
    }

    // 4. Continua sem conta: cria uma nova (sem senha)
    if (!user) {
      try {
        const [result] = await db.query(
          'INSERT INTO users (name, email, google_id) VALUES (?, ?, ?)',
          [name, email, googleId]
        );
        user = { id: result.insertId, name, email, photo_url: null };
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
        // Duas requisições ao mesmo tempo: pega a conta que a outra criou
        [rows] = await db.query(
          'SELECT * FROM users WHERE email = ? OR google_id = ? LIMIT 1',
          [email, googleId]
        );
        user = rows[0];
      }
    }

    res.status(200).json({
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photo_url: user.photo_url || null,
        token: gerarToken(user.id) // sempre gera, para conta nova E existente
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ==========================================
// ESQUECI A SENHA: pedir o link por e-mail
// ==========================================
app.post('/api/forgot-password', async (req, res) => {
  const email = normalizarEmail(req.body && req.body.email);

  // Resposta igual exista o e-mail ou não (ninguém descobre quem tem conta)
  const RESPOSTA = {
    message: 'Se esse e-mail estiver cadastrado, enviamos um link para criar uma nova senha.'
  };

  if (!email) {
    return res.status(400).json({ error: 'Digite seu e-mail.' });
  }
  if (!emailConfigurado()) {
    console.error('GMAIL_USER / GMAIL_APP_PASSWORD / FRONTEND_URL não configurados.');
    return res.status(500).json({ error: 'Envio de e-mail não configurado no servidor.' });
  }

  try {
    const [users] = await db.query('SELECT id, name, email FROM users WHERE email = ? LIMIT 1', [email]);
    const user = users[0];

    if (user) {
      // Limite: no máximo 3 pedidos por hora para cada conta
      const [recentes] = await db.query(
        'SELECT COUNT(*) AS total FROM password_resets WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
        [user.id]
      );

      if (Number(recentes[0].total) < 3) {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Links anteriores deixam de valer
        await db.query('UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL', [user.id]);

        // No banco fica só o hash do código, nunca o código em si
        await db.query(
          'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))',
          [user.id, tokenHash]
        );

        const base = process.env.FRONTEND_URL.replace(/\/+$/, '');
        const link = `${base}/app.html#reset=${token}`;

        try {
          await enviarEmailRedefinicao(user.email, user.name, link);
        } catch (erroEmail) {
          // Não revela a falha para quem pediu; fica só no log do servidor
          console.error('Erro ao enviar e-mail de redefinição:', erroEmail.message);
        }
      }
    }

    res.status(200).json(RESPOSTA);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ==========================================
// ESQUECI A SENHA: criar a nova senha com o link
// ==========================================
app.post('/api/reset-password', async (req, res) => {
  const token = String((req.body && req.body.token) || '');
  const password = String((req.body && req.body.password) || '');
  const LINK_INVALIDO = { error: 'Link inválido ou expirado. Peça um novo.' };

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json(LINK_INVALIDO);
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [rows] = await db.query(
      'SELECT id, user_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1',
      [tokenHash]
    );
    if (rows.length === 0) {
      return res.status(400).json(LINK_INVALIDO);
    }
    const reset = rows[0];

    // "Reserva" o link: se duas requisições chegarem juntas, só uma passa
    const [reserva] = await db.query(
      'UPDATE password_resets SET used_at = NOW() WHERE id = ? AND used_at IS NULL',
      [reset.id]
    );
    if (reserva.affectedRows !== 1) {
      return res.status(400).json(LINK_INVALIDO);
    }

    const password_hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, reset.user_id]);

    // Qualquer outro link ainda aberto dessa conta também deixa de valer
    await db.query('UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL', [reset.user_id]);

    res.status(200).json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ==========================================
// EXCLUIR CONTA (protegida por token)
// ==========================================
app.delete('/api/delete-account', autenticar, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT photo_url FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [req.userId]);

    // Apaga a foto (Blob ou disco) sem travar a resposta
    apagarFoto(rows[0].photo_url).catch((error) => console.error('Erro ao apagar foto:', error));

    res.status(200).json({ message: 'Conta excluída com sucesso.' });
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