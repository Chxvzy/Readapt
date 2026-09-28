const API_URL = 'http://localhost:3000/api';

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

function openPopup(id) { abrirPopup(id); }
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

// Mostra o primeiro nome no card de perfil
function atualizarNomePerfil(nomeCompleto) {
  const el = document.querySelector('.profile-name');
  if (el && nomeCompleto) {
    el.textContent = nomeCompleto.trim().split(' ')[0];
  }
}

// ==========================================
// 3. INICIALIZAÇÃO
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

  // Editar nome
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

  // Troca de período nos gráficos
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