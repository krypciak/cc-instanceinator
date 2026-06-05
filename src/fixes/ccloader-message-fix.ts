export function ccloaderMessageFix() {
    const ui = document.getElementById('ui')
    if (ui) {
        ui.style.zIndex = '999999999'
    }
}
