

export default function animate() {
    document.querySelectorAll('.animation').forEach(element => {
        element.addEventListener('animationend', function () {
            if (element.classList.contains('animation-close')) {
                element.classList.remove('animation-close')
            }
        });
    });
}