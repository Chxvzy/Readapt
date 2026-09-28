const API_URL = 'http://localhost:3000/api';
const BASE_URL = API_URL.replace(/\/api\/?$/, ''); // origem do servidor (para montar o link das fotos)
const FOTO_PADRAO = 'assets/perfil-img.png';

// ==========================================
// 1. NAVEGAÇÃO ENTRE TELAS
// ==========================================
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

// ==========================================
// 2. POP-UPS
// ==========================================
function abrirPopup(id) {
  const popup = document.getElementById(id);
  if (popup) popup.classList.add('active');
}

function fecharPopup(id) {
  const popup = document.getElementById(id);
  if (popup) popup.classList.remove('active');
}

function openPopup(id) {
  // Sempre abre o pop-up de foto "limpo"
  if (id === 'popup-edit-photo') resetarPopupFoto();
  abrirPopup(id);
}
function closePopup(id) { fecharPopup(id); }

function switchPopup(fromId, toId) {
  closePopup(fromId);
  setTimeout(() => openPopup(toId), 150);
}

// Fecha o pop-up de sucesso e vai para a tela principal
function fecharPopupEIrParaMain(id) {
  fecharPopup(id);
  showScreen('screen-main');
}

// ==========================================
// 3. PERFIL (NOME E FOTO)
// ==========================================
function atualizarNomePerfil(nomeCompleto) {
  const el = document.querySelector('.profile-name');
  if (el && nomeCompleto) {
    el.textContent = nomeCompleto.trim().split(' ')[0];
  }
}

// Sem foto salva -> volta para a foto padrão
function atualizarFotoPerfil(photoUrl) {
  const img = document.querySelector('.profile-avatar img');
  if (img) img.src = photoUrl ? BASE_URL + photoUrl : FOTO_PADRAO;
}

// Reduz a foto (máx. 512px) e converte para JPEG antes de enviar.
// Fotos de celular têm vários MB; assim o envio é rápido e nunca passa do limite.
function redimensionarImagem(file, lado = 512) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * escala);
      const h = Math.round(img.naturalHeight * escala);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF'; // PNG transparente não vira preto
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Falha ao processar a imagem.'))),
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler essa imagem.'));
    };

    img.src = url;
  });
}

let fotoSelecionada = null; // Blob pronto para enviar

function resetarPopupFoto() {
  fotoSelecionada = null;

  const input = document.getElementById('input-photo');
  const preview = document.getElementById('photo-preview');
  const btnSave = document.getElementById('btn-save-photo');
  const erro = document.getElementById('photo-error');

  if (input) input.value = '';
  if (preview) {
    preview.hidden = true;
    preview.removeAttribute('src');
  }
  if (btnSave) btnSave.disabled = true;
  if (erro) erro.textContent = '';
}

// ==========================================
// 4. INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

  // Não mantém login: ao abrir ou recarregar a página, descarta qualquer usuário salvo
  localStorage.removeItem('user');

  // Loading (2s) -> sempre vai para a tela de escolha (Login / Cadastrar)
  setTimeout(() => showScreen('screen-welcome'), 2000);

  // Welcome -> Login / Cadastro
  const btnWelcomeLogin = document.querySelector('#screen-welcome .btn-app-solid');
  if (btnWelcomeLogin) btnWelcomeLogin.addEventListener('click', () => showScreen('screen-login'));

  const btnWelcomeRegister = document.querySelector('#screen-welcome .btn-app-outline');
  if (btnWelcomeRegister) btnWelcomeRegister.addEventListener('click', () => showScreen('screen-register'));

  // Login <-> Cadastro
  const btnGoToRegister = document.querySelector('#screen-login .btn-secondary-link');
  if (btnGoToRegister) {
    btnGoToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      showScreen('screen-register');
    });
  }

  const btnGoToLogin = document.querySelector('#screen-register .link-login');
  if (btnGoToLogin) {
    btnGoToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      showScreen('screen-login');
    });
  }

  // Pop-ups de sucesso: clicar em qualquer ponto fecha e vai para a tela principal
  ['popup-login', 'popup-cadastro'].forEach(id => {
    const popup = document.getElementById(id);
    if (popup) popup.addEventListener('click', () => fecharPopupEIrParaMain(id));
  });

  // ------------------------------------------
  // Editar nome
  // ------------------------------------------
  const btnEditName = document.getElementById('btn-edit-name');
  if (btnEditName) btnEditName.addEventListener('click', () => openPopup('popup-choice'));

  const btnConfirmName = document.getElementById('btn-confirm-edit-name');
  const inputEditName = document.getElementById('input-edit-name');

  if (btnConfirmName) {
    btnConfirmName.addEventListener('click', async () => {
      const novoNome = inputEditName ? inputEditName.value.trim() : '';

      if (!novoNome) {
        alert('Por favor, digite um nome válido!');
        return;
      }

      const rawUser = localStorage.getItem('user');
      if (!rawUser) {
        alert('Usuário não autenticado.');
        return;
      }
      const userObj = JSON.parse(rawUser);

      try {
        const response = await fetch(`${API_URL}/update-name`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userObj.id, name: novoNome })
        });
        const data = await response.json();

        if (response.ok) {
          userObj.name = novoNome;
          localStorage.setItem('user', JSON.stringify(userObj));
          atualizarNomePerfil(novoNome);
          inputEditName.value = '';
          closePopup('popup-edit-name');
        } else {
          alert(data.error || 'Erro ao atualizar o nome.');
        }
      } catch (error) {
        console.error('Erro de conexão ao atualizar nome:', error);
        alert('Não foi possível conectar ao servidor.');
      }
    });
  }

  // ------------------------------------------
  // Editar foto
  // ------------------------------------------
  const avatar = document.getElementById('btn-edit-photo');
  const inputPhoto = document.getElementById('input-photo');
  const btnPickPhoto = document.getElementById('btn-pick-photo');
  const btnSavePhoto = document.getElementById('btn-save-photo');
  const photoPreview = document.getElementById('photo-preview');
  const photoError = document.getElementById('photo-error');

  // Tocar na foto do perfil abre direto o pop-up de foto
  if (avatar) avatar.addEventListener('click', () => openPopup('popup-edit-photo'));

  // "Acessar biblioteca de fotos" abre a galeria/câmera do aparelho
  if (btnPickPhoto && inputPhoto) {
    btnPickPhoto.addEventListener('click', () => inputPhoto.click());
  }

  // Escolheu uma imagem: valida, reduz e mostra a prévia
  if (inputPhoto) {
    inputPhoto.addEventListener('change', async () => {
      const file = inputPhoto.files && inputPhoto.files[0];
      if (!file) return;

      photoError.textContent = '';
      btnSavePhoto.disabled = true;
      fotoSelecionada = null;

      if (!file.type.startsWith('image/')) {
        photoError.textContent = 'Escolha um arquivo de imagem.';
        return;
      }

      try {
        fotoSelecionada = await redimensionarImagem(file);
        photoPreview.src = URL.createObjectURL(fotoSelecionada);
        photoPreview.hidden = false;
        btnSavePhoto.disabled = false;
      } catch (error) {
        photoError.textContent = error.message || 'Não foi possível usar essa imagem.';
      }
    });
  }

  // "Salvar foto": envia para o servidor
  if (btnSavePhoto) {
    btnSavePhoto.addEventListener('click', async () => {
      if (!fotoSelecionada) return;

      const rawUser = localStorage.getItem('user');
      if (!rawUser) {
        photoError.textContent = 'Usuário não autenticado.';
        return;
      }
      const userObj = JSON.parse(rawUser);

      const formData = new FormData();
      formData.append('id', userObj.id); // campos de texto antes do arquivo
      formData.append('photo', fotoSelecionada, 'foto.jpg');

      btnSavePhoto.disabled = true;
      photoError.textContent = '';

      try {
        // Não defina Content-Type: o navegador coloca o boundary sozinho
        const response = await fetch(`${API_URL}/upload-photo`, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();

        if (response.ok && data.photo_url) {
          userObj.photo_url = data.photo_url;
          localStorage.setItem('user', JSON.stringify(userObj));
          atualizarFotoPerfil(data.photo_url);
          closePopup('popup-edit-photo');
        } else {
          photoError.textContent = data.error || 'Erro ao salvar a foto.';
          btnSavePhoto.disabled = false;
        }
      } catch (error) {
        console.error('Erro de conexão ao enviar foto:', error);
        photoError.textContent = 'Não foi possível conectar ao servidor.';
        btnSavePhoto.disabled = false;
      }
    });
  }

  // ------------------------------------------
  // Troca de período nos gráficos
  // ------------------------------------------
  const periodButtons = document.querySelectorAll('.period-btn');
  periodButtons.forEach(button => {
    button.addEventListener('click', () => {
      const period = button.getAttribute('data-period');

      periodButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      document.querySelectorAll('.chart-content svg.line-chart').forEach(chart => chart.classList.remove('active'));
      document.querySelectorAll(`.chart-content svg.line-chart.${period}`).forEach(chart => chart.classList.add('active'));

      document.querySelectorAll('.trend-badge').forEach(badge => {
        const newText = badge.getAttribute(`data-${period}`);
        const newIcon = badge.getAttribute(`data-${period}-icon`);
        const textElement = badge.querySelector('.trend-text');
        const iconElement = badge.querySelector('.trend-icon');

        if (newText && textElement) textElement.textContent = newText;
        if (newIcon && iconElement) iconElement.src = newIcon;
      });
    });
  });
});

// Fechar pop-ups comuns clicando no fundo escuro
// (os de sucesso têm tratamento próprio acima)
document.addEventListener('click', (e) => {
  if (
    e.target.classList.contains('popup-overlay') &&
    e.target.id !== 'popup-login' &&
    e.target.id !== 'popup-cadastro'
  ) {
    e.target.classList.remove('active');
  }
});

// Altura real no PWA
function setRealAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}
window.addEventListener('resize', setRealAppHeight);
window.addEventListener('orientationchange', setRealAppHeight);
setRealAppHeight();