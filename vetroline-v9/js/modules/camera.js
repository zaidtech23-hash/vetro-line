// ═══════════════════════════════════════════════════════════════
// MÓDULO: CÂMERA — Tira foto dentro do app, comprime e envia
// ═══════════════════════════════════════════════════════════════

const Camera = {
  
  stream: null,
  currentCallback: null,
  
  // Abre a câmera
  async open(callback) {
    this.currentCallback = callback;
    
    try {
      // Tenta câmera traseira primeiro (melhor pra obra)
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Câmera de TRÁS
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      const video = document.getElementById('cameraVideo');
      video.srcObject = this.stream;
      video.play();
      
      Utils.openModal('cameraModal');
    } catch (err) {
      console.error('Erro câmera:', err);
      Utils.toast('Não consegui acessar a câmera. Permita o acesso!', 'error');
      // Fallback: abre seletor de arquivo
      this.openFilePicker();
    }
  },
  
  // Tira a foto
  capture() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Mostra preview
    const preview = document.getElementById('cameraPreview');
    preview.src = canvas.toDataURL('image/jpeg', 0.85);
    
    document.getElementById('cameraStep1').style.display = 'none';
    document.getElementById('cameraStep2').style.display = 'block';
    document.getElementById('cameraFooter1').style.display = 'none';
    document.getElementById('cameraStep2Footer').style.display = 'flex';
  },
  
  // Refazer foto
  retake() {
    document.getElementById('cameraStep1').style.display = 'block';
    document.getElementById('cameraStep2').style.display = 'none';
    document.getElementById('cameraFooter1').style.display = 'flex';
    document.getElementById('cameraStep2Footer').style.display = 'none';
  },
  
  // Confirma e envia
  async confirm() {
    const canvas = document.getElementById('cameraCanvas');
    
    // Comprime (qualidade 80%, JPEG)
    const blob = await new Promise(resolve => 
      canvas.toBlob(resolve, 'image/jpeg', 0.80)
    );
    
    // Cria um File object pra enviar
    const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    this.close();
    
    // Chama o callback com o arquivo
    if (this.currentCallback) {
      const fakeEvent = { target: { files: [file] } };
      this.currentCallback(fakeEvent);
      this.currentCallback = null;
    }
  },
  
  // Fecha câmera
  close() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    document.getElementById('cameraStep1').style.display = 'block';
    document.getElementById('cameraStep2').style.display = 'none';
    document.getElementById('cameraFooter1').style.display = 'flex';
    document.getElementById('cameraStep2Footer').style.display = 'none';
    Utils.closeModal('cameraModal');
  },
  
  // Fallback: abre seletor de arquivo (galeria/câmera nativa)
  openFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      if (this.currentCallback) {
        this.currentCallback(e);
        this.currentCallback = null;
      }
    };
    input.click();
  }

};
