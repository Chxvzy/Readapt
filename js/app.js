// Função para alternar entre os ecrãs do aplicativo
function mudarTela(idDaNovaTela) {
  // Esconde todos os ecrãs removendo a classe 'active'
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  // Mostra apenas o ecrã pretendido adicionando 'active'
  const telaAlvo = document.getElementById(idDaNovaTela);
  if (telaAlvo) {
    telaAlvo.classList.add('active');
  }
}

// Aguarda o carregamento inicial do DOM e altera para o ecrã de boas-vindas após 3 segundos
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    mudarTela('screen-welcome');
  }, 2000);
});

document.addEventListener("DOMContentLoaded", () => {
    // Função auxiliar para alternar telas
    function showScreen(screenId) {
        document.querySelectorAll(".screen").forEach(screen => {
            screen.classList.remove("active");
        });

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add("active");
        }
    }

    // 1. Simula a tela de Loading por 2 segundos e vai para o Welcome
    setTimeout(() => {
        showScreen("screen-welcome");
    }, 2000);

    // 2. Clique no botão "Login" da tela de Boas-vindas -> Vai para a Tela de Login
    const btnWelcomeLogin = document.querySelector("#screen-welcome .btn-app-solid");
    if (btnWelcomeLogin) {
        btnWelcomeLogin.addEventListener("click", () => {
            showScreen("screen-login");
        });
    }

    // 3. Clique no botão "Criar nova conta" na Tela de Login -> Volta para o Welcome (exemplo)
    const btnRegister = document.querySelector("#screen-welcome .btn-app-outline");
    if (btnRegister) {
        btnRegister.addEventListener("click", () => {
            alert("Tela de cadastro a ser implementada!");
        });
    }
});