const themeIcons = document.querySelectorAll(".theme-icon");

function updateInstructionIcons() {

    const themeIcons = document.querySelectorAll(".theme-icon");

    const dark = document.body.classList.contains("dark");

    themeIcons.forEach(icon => {

        if(dark){

            icon.src = icon.src.replace("-black.svg", "-white.svg");

        }else{

            icon.src = icon.src.replace("-white.svg", "-black.svg");

        }

    });

}

updateInstructionIcons();