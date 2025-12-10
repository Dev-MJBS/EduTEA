# 🎮 EduTEA - Rodar Localmente com Webcam

## ⚡ Quick Start (30 segundos)

### 1️⃣ Primeira vez (setup)
```zsh
cd /Users/mateusjobdebrito/Documents/Education_Python/EduTEA_PyVision
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2️⃣ Rodar o app
```zsh
./run.sh
```

Ou manualmente:
```zsh
source .venv/bin/activate
python app.py
```

### 3️⃣ Abrir no navegador
Vá para: **http://127.0.0.1:5010**

---

## 🎯 Como Funciona

1. **Backend** (Python)
   - Captura webcam
   - Detecta mão com MediaPipe
   - Envia via WebSocket

2. **Frontend** (JavaScript)
   - Recebe posição da mão
   - Mostra vídeo + jogo
   - Você arrasta letras com a mão

---

## 🎮 Como Jogar

| Ação | Resultado |
|------|-----------|
| **Digite uma palavra** | "CASA", "AMOR", etc. |
| **Clique "INICIAR"** | Embaralha as letras |
| **Feche a mão** | Pega a letra |
| **Arraste** | Move a letra |
| **Abra a mão** | Solta no quadrado |
| **Acertar ordem** | Confete! 🎊 |

---

## 🔍 Troubleshooting

### "Webcam não funciona"
- ✅ Verifique permissões no macOS (Privacidade → Câmera)
- ✅ Teste: http://127.0.0.1:5010/video_feed (deve mostrar vídeo)

### "Mão não detecta"
- Melhore a iluminação
- Fique a ~50cm da câmera
- Estique bem a mão

### "Socket não conecta"
- Verifique se backend está rodando
- Abra DevTools (F12) → Console
- Verifique se há erros

---

## 📱 Para usar em GitHub Pages

Se quiser acessar remotamente com webcam local:
```zsh
# 1. Rodar backend localmente
./run.sh

# 2. Em outro terminal, criar tunnel (ex: ngrok)
ngrok http 5010

# 3. Usar URL do ngrok em docs/script.js
const BACKEND_URL = 'https://seu-ngrok-url.ngrok.io';

# 4. Acessar https://dev-mjbs.github.io/EduTEA/
```

---

## 🚀 Deploy na Nuvem (sem webcam)

Se quiser app 100% online (sem câmera):
- Veja [DEPLOY.md](DEPLOY.md)
- Backend no Render + Frontend no GitHub Pages

---

**Precisa de ajuda?** Abra uma issue no GitHub!
