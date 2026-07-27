const menuBtn = document.querySelector('.menu-btn');
const overlay = document.querySelector('.menu-overlay');
const themeSwitch = document.querySelector('#theme-switch');
const logo = document.querySelector('#logo-img');

function updateThemeIcons() {

    const dark = document.body.classList.contains('dark');

    document.querySelectorAll('.theme-icon').forEach(icon => {

        if (dark) {

            icon.src = icon.src.replace('-black.svg', '-white.svg');

        } else {

            icon.src = icon.src.replace('-white.svg', '-black.svg');

        }

    });

}

menuBtn.addEventListener('click', () => {

    overlay.classList.toggle('active');
    document.body.classList.toggle('menu-open');

});

if (localStorage.getItem('theme') === 'dark') {

    document.body.classList.add('dark');
    logo.src = 'assets/logo-readapt-white.png';

} else {

    logo.src = 'assets/readapt-logo.png';

}

updateThemeIcons();

themeSwitch.addEventListener('click', () => {

    document.body.classList.toggle('dark');

    if (document.body.classList.contains('dark')) {

        localStorage.setItem('theme', 'dark');
        logo.src = 'assets/logo-readapt-white.png';

    } else {

        localStorage.setItem('theme', 'light');
        logo.src = 'assets/readapt-logo.png';

    }

    updateThemeIcons();

});

