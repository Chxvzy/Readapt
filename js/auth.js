const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    // ==========================================
    // LÓGICA DE CADASTRO
    // ==========================================
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;

            // Validação de senhas iguais
            if (password !== confirmPassword) {
                alert('As senhas não coincidem!');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Conta criada com sucesso! Agora você pode fazer login.');
                    formRegister.reset();
                } else {
                    alert(`Erro: ${data.error}`);
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
            }
        });
    }

    // ==========================================
    // LÓGICA DE LOGIN
    // ==========================================
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(`Bem-vindo, ${data.user.name}!`);

                    // Salva os dados do usuário no navegador
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Em vez de redirecionar para index.html, manter dentro do App (SPA)
                    // Se a função showScreen estiver disponível (definida em js/app.js), usá-la.
                    if (typeof showScreen === 'function') {
                        showScreen('screen-main');
                    } else {
                        // Fallback: alterar manualmente classes das telas
                        const loginScreen = document.getElementById('screen-login');
                        const mainScreen = document.getElementById('screen-main');
                        if (loginScreen) loginScreen.classList.remove('active');
                        if (mainScreen) mainScreen.classList.add('active');
                    }
                } else {
                    alert(`Erro: ${data.error}`);
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
            }
        });
    }
});