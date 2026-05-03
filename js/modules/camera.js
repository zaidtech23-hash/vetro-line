// ═══════════════════════════════════════════════════════════════
// MÓDULO: CÂMERA — Usa câmera NATIVA do celular (qualidade boa!)
// ═══════════════════════════════════════════════════════════════

const Camera = {
  
  // Abre câmera nativa do celular
  open(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Câmera traseira (qualidade nativa)
    input.style.display = 'none';
    
    input.onchange = (e) => {
      if (callback && typeof callback === 'function') {
        callback(e);
      }
      // Remove input depois de usar
      if (input.parentNode) input.parentNode.removeChild(input);
    };
    
    document.body.appendChild(input);
    input.click();
  }

};
