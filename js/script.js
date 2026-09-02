const menuBtn = document.querySelector('.menu-btn');
const overlay = document.querySelector('.menu-overlay');
const themeSwitch = document.querySelector('#theme-switch');

const logoMobile = document.querySelector('#logo-mobile');
const logoDesktop = document.querySelector('#logo-desktop');

function updateThemeIcons() {
    const dark = document.body.classList.contains('dark');

    document.querySelectorAll('.theme-icon').forEach(icon => {
        if (dark) {
            icon.src = icon.src
                .replace('-black.svg', '-white.svg')
                .replace('-black.png', '-white.png');
        } else {
            icon.src = icon.src
                .replace('-white.svg', '-black.svg')
                .replace('-white.png', '-black.png');
        }
    });
}

// Menu mobile
menuBtn.addEventListener('click', () => {
    overlay.classList.toggle('active');
    document.body.classList.toggle('menu-open');
});

// Verifica o tema salvo
if (localStorage.getItem('theme') === 'dark') {

    document.body.classList.add('dark');

    logoMobile.src = 'assets/logo-readapt-white.png';
    logoDesktop.src = 'assets/logo-readapt-white.png';

} else {

    logoMobile.src = 'assets/readapt-logo.png';
    logoDesktop.src = 'assets/readapt-logo.png';
}

updateThemeIcons();

// Alternar tema
themeSwitch.addEventListener('click', () => {

    document.body.classList.toggle('dark');

    if (document.body.classList.contains('dark')) {

        localStorage.setItem('theme', 'dark');

        logoMobile.src = 'assets/logo-readapt-white.png';
        logoDesktop.src = 'assets/logo-readapt-white.png';

    } else {

        localStorage.setItem('theme', 'light');

        logoMobile.src = 'assets/readapt-logo.png';
        logoDesktop.src = 'assets/readapt-logo.png';
    }

    updateThemeIcons();
});