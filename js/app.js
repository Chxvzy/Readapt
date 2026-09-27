// ==========================================
// 1. GERENCIAMENTO DE TELAS (NAVEGAÇÃO)
// ==========================================
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add("active");
  }
}

// Aliases para manter compatibilidade
function mudarTela(idDaNovaTela) {
  showScreen(idDaNovaTela);
}

function navegarPara(idDaNovaTela) {
  showScreen(idDaNovaTela);
}

// ==========================================
// 2. GERENCIAMENTO DOS POP-UPS (MODAIS)
// ==========================================
function abrirPopup(id) {
  const popup = document.getElementById(id);
  if (popup) {
    popup.classList.add('active');
  }
}

function fecharPopup(id) {
  const popup = document.getElementById(id);
  if (popup) {
    popup.classList.remove('active');
  }
}

// Fecha o pop-up de sucesso e redireciona para a Tela Principal (Dashboard)
function fecharPopupEIrParaMain(id) {
  fecharPopup(id);
  showScreen("screen-main");
}

// Fechar qualquer pop-up ao clicar no fundo escuro (overlay)
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('popup-overlay')) {
    const popupId = e.target.id;
    e.target.classList.remove('active');

    // Se for o pop-up de Login ou Cadastro, também direciona para a tela principal
    if (popupId === 'popup-login' || popupId === 'popup-cadastro') {
      showScreen("screen-main");
    }
  }
});

// ==========================================
// 3. INICIALIZAÇÃO DE EVENTOS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {

  // 1. Simula a tela de Loading por 2 segundos e vai para o Welcome
  setTimeout(() => {
    showScreen("screen-welcome");
  }, 2000);

  // 2. Botão "Login" da tela de Boas-vindas -> Vai para a Tela de Login
  const btnWelcomeLogin = document.querySelector("#screen-welcome .btn-app-solid");
  if (btnWelcomeLogin) {
    btnWelcomeLogin.addEventListener("click", () => {
      showScreen("screen-login");
    });
  }

  // 3. Botão "Criar nova conta" na Tela de Boas-vindas -> Vai para Cadastro
  const btnRegister = document.querySelector("#screen-welcome .btn-app-outline");
  if (btnRegister) {
    btnRegister.addEventListener("click", () => {
      showScreen("screen-register");
    });
  }

  // 4. Link "Criar conta" na Tela de Login -> Vai para Cadastro
  const btnGoToRegister = document.querySelector("#screen-login .btn-secondary-link");
  if (btnGoToRegister) {
    btnGoToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      showScreen("screen-register");
    });
  }

  // 5. Link "Já tenho uma conta" no Cadastro -> Vai para Login
  const btnGoToLogin = document.querySelector("#screen-register .link-login");
  if (btnGoToLogin) {
    btnGoToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      showScreen("screen-login");
    });
  }

  // 6. Ação do formulário/botão de Login -> Exibe o Pop-up de Login
  const formLogin = document.querySelector("#screen-login form") || document.querySelector("#screen-login .btn-app-solid");
  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      abrirPopup("popup-login");
    });
    // Caso seja apenas um botão sem <form>
    if (formLogin.tagName !== "FORM") {
      formLogin.addEventListener("click", (e) => {
        e.preventDefault();
        abrirPopup("popup-login");
      });
    }
  }

  // 7. Ação do formulário/botão de Cadastro -> Exibe o Pop-up de Cadastro
  const formRegister = document.querySelector("#screen-register form") || document.querySelector("#screen-register .btn-app-solid");
  if (formRegister) {
    formRegister.addEventListener("submit", (e) => {
      e.preventDefault();
      abrirPopup("popup-cadastro");
    });
    // Caso seja apenas um botão sem <form>
    if (formRegister.tagName !== "FORM") {
      formRegister.addEventListener("click", (e) => {
        e.preventDefault();
        abrirPopup("popup-cadastro");
      });
    }
  }

});

document.addEventListener('DOMContentLoaded', () => {
  const periodButtons = document.querySelectorAll('.period-btn');

  periodButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove a classe 'active' de todos os botões
      periodButtons.forEach(btn => btn.classList.remove('active'));

      // Adiciona a classe 'active' apenas no botão clicado
      button.classList.add('active');
    });
  });
});

document.querySelectorAll('.period-btn').forEach(button => {
    button.addEventListener('click', () => {
        const period = button.getAttribute('data-period'); // 'dia', 'semana' ou 'mes'

        // 1. Atualiza botão ativo
        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // 2. Atualiza os gráficos visíveis
        document.querySelectorAll('.chart-content svg.line-chart').forEach(chart => {
            chart.classList.remove('active');
        });
        document.querySelectorAll(`.chart-content svg.line-chart.${period}`).forEach(chart => {
            chart.classList.add('active');
        });

        // 3. Atualiza o ícone SVG e a porcentagem
        document.querySelectorAll('.trend-badge').forEach(badge => {
            const newText = badge.getAttribute(`data-${period}`);
            const newIcon = badge.getAttribute(`data-${period}-icon`);

            const textElement = badge.querySelector('.trend-text');
            const iconElement = badge.querySelector('.trend-icon');

            if (newText && textElement) {
                textElement.textContent = newText;
            }

            if (newIcon && iconElement) {
                iconElement.src = newIcon;
            }
        });
    });
});

function setRealAppHeight() {
    const doc = document.documentElement;
    doc.style.setProperty('--app-height', `${window.innerHeight}px`);
}

// Executa ao carregar e sempre que a tela redimensionar
window.addEventListener('resize', setRealAppHeight);
window.addEventListener('orientationchange', setRealAppHeight);
setRealAppHeight();

// Ativa o botão de editar perfil para abrir o primeiro pop-up
document.getElementById('btn-edit-name').addEventListener('click', function () {
  openPopup('popup-choice');
});

// Função para abrir pop-up
function openPopup(id) {
  document.getElementById(id).classList.add('active');
}

// Função para fechar pop-up
function closePopup(id) {
  document.getElementById(id).classList.remove('active');
}

// Função para fechar um pop-up e abrir o outro logo em seguida
function switchPopup(fromId, toId) {
  closePopup(fromId);
  setTimeout(() => {
    openPopup(toId);
  }, 150); // Pequeno atraso para suavizar a animação
}