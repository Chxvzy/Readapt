// Depende de app.js (API_URL, abrirPopup, atualizarNomePerfil).
// No HTML, app.js deve ser carregado ANTES deste arquivo.

// ==========================================
// MENSAGENS DE ERRO NO FORMULÁRIO
// ==========================================
function mostrarErro(form, mensagem, campos = [], campoMsg = null) {
  limparErro(form);

  // Onde a mensagem aparece: campoMsg, ou o 1º campo com erro, ou o último campo do form
  const todos = form.querySelectorAll('.input-group input');
  const alvo = campoMsg || campos[0] || todos[todos.length - 1];

  const grupo = alvo && alvo.closest('.input-group');
  const msg = grupo && grupo.querySelector('.field-error');
  if (msg) {
    msg.textContent = mensagem;
    msg.classList.add('show');
  }

  campos.forEach(campo => campo && campo.classList.add('input-error'));
  if (alvo) alvo.focus();
}

function limparErro(form) {
  form.querySelectorAll('.field-error').forEach(el => {
    el.classList.remove('show');
    el.textContent = '';
  });
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

// ==========================================
// VALIDAÇÃO DE E-MAIL
// ==========================================
const DOMINIOS_COM_ERRO = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.com.br': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com'
};

// Retorna null se o e-mail parece válido, ou a mensagem de erro.
function validarEmail(email) {
  if (!email) return 'Digite seu e-mail.';

  const partes = email.split('@');
  if (partes.length !== 2) return 'Digite um e-mail válido, como nome@exemplo.com.';

  const [usuario, dominio] = partes;

  const usuarioOk = /^[A-Za-z0-9._%+-]+$/.test(usuario) &&
                    !usuario.startsWith('.') && !usuario.endsWith('.') && !usuario.includes('..');
  const dominioOk = /^([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/.test(dominio);

  if (!usuarioOk || !dominioOk) return 'Digite um e-mail válido, como nome@exemplo.com.';

  const sugestao = DOMINIOS_COM_ERRO[dominio.toLowerCase()];
  if (sugestao) return `Você quis dizer ${usuario}@${sugestao}?`;

  return null;
}

document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  // Some o erro assim que a pessoa volta a digitar
  [formLogin, formRegister].forEach(form => {
    if (form) form.addEventListener('input', () => limparErro(form));
  });

  // ==========================================
  // CADASTRO
  // ==========================================
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('reg-name');
      const emailInput = document.getElementById('reg-email');
      const passwordInput = document.getElementById('reg-password');
      const confirmInput = document.getElementById('reg-confirm-password');

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmInput.value;

      // Erros: a pessoa permanece na tela de cadastro
      if (!name) {
        return mostrarErro(formRegister, 'Digite seu nome completo.', [nameInput]);
      }

      const erroEmail = validarEmail(email);
      if (erroEmail) {
        return mostrarErro(formRegister, erroEmail, [emailInput]);
      }

      if (password.length < 6) {
        return mostrarErro(formRegister, 'A senha deve ter pelo menos 6 caracteres.', [passwordInput]);
      }

      if (password !== confirmPassword) {
        return mostrarErro(formRegister, 'As senhas não coincidem.', [passwordInput, confirmInput], confirmInput);
      }

      const submitBtn = formRegister.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();

        if (response.ok && data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          atualizarNomePerfil(data.user.name);
          atualizarFotoPerfil(data.user.photo_url);
          formRegister.reset();
          limparErro(formRegister);
          abrirPopup('popup-cadastro'); // ao fechar, vai para screen-main
        } else {
          mostrarErro(formRegister, data.error || 'Erro ao realizar cadastro.', [emailInput]);
        }
      } catch (error) {
        console.error('Erro de conexão no cadastro:', error);
        mostrarErro(formRegister, 'Não foi possível conectar ao servidor.');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // ==========================================
  // LOGIN
  // ==========================================
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email) {
        return mostrarErro(formLogin, 'Digite seu e-mail.', [emailInput]);
      }
      if (!password) {
        return mostrarErro(formLogin, 'Digite sua senha.', [passwordInput]);
      }

      const submitBtn = formLogin.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok && data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          atualizarNomePerfil(data.user.name);
          atualizarFotoPerfil(data.user.photo_url);
          formLogin.reset();
          limparErro(formLogin);
          abrirPopup('popup-login'); // ao fechar, vai para screen-main
        } else {
          // Erro: permanece na tela de login
          mostrarErro(formLogin, data.error || 'E-mail ou senha incorretos.', [emailInput, passwordInput], passwordInput);
        }
      } catch (error) {
        console.error('Erro de conexão no login:', error);
        mostrarErro(formLogin, 'Não foi possível conectar ao servidor.');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // ==========================================
  // LOGIN SOCIAL (Google / Facebook / Apple)
  // ==========================================
  const btnGoogle = document.getElementById('btn-google');

  // Mostra o erro sem abrir o teclado do celular
  function erroSocial(mensagem) {
    if (!formLogin) return;
    mostrarErro(formLogin, mensagem);
    if (document.activeElement) document.activeElement.blur();
  }

  if (btnGoogle && formLogin) {
    btnGoogle.addEventListener('click', () => {
      limparErro(formLogin);

      if (!window.google || !google.accounts || !google.accounts.oauth2) {
        return erroSocial('Não foi possível carregar o login do Google.');
      }
      if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('COLE_')) {
        console.error('Defina GOOGLE_CLIENT_ID no js/app.js');
        return erroSocial('Login com Google não configurado.');
      }

      const client = google.accounts.oauth2.initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        ux_mode: 'popup',

        callback: async (resp) => {
          if (resp.error || !resp.code) {
            return erroSocial('Login com Google cancelado.');
          }

          btnGoogle.disabled = true;
          try {
            const response = await fetch(`${API_URL}/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: resp.code })
            });
            const data = await response.json();

            if (response.ok && data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));
              atualizarNomePerfil(data.user.name);
              atualizarFotoPerfil(data.user.photo_url);
              formLogin.reset();
              limparErro(formLogin);
              abrirPopup('popup-login'); // ao fechar, vai para screen-main
            } else {
              erroSocial(data.error || 'Não foi possível entrar com o Google.');
            }
          } catch (error) {
            console.error('Erro de conexão no login com Google:', error);
            erroSocial('Não foi possível conectar ao servidor.');
          } finally {
            btnGoogle.disabled = false;
          }
        },

        // Fechou a janela do Google sem escolher a conta: não é erro
        error_callback: (err) => {
          if (err && err.type === 'popup_closed') return;
          erroSocial('Não foi possível abrir o login do Google.');
        }
      });

      client.requestCode();
    });
  }

});