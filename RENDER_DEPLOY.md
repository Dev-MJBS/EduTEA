# Guia Render - EduTEA

## Deploy em 3 passos

### 1. Criar nova Web Service no Render
- Acesse: https://dashboard.render.com/
- Clique em **"New +"** → **"Web Service"**
- Conecte seu repositório GitHub: `Dev-MJBS/EduTEA`
- Configure:
  - **Name**: `edutea-backend` (qualquer nome)
  - **Branch**: `main`
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT app:app`
  - **Environment**: 
    - Deixe vazio (não precisa de variáveis)

### 2. Configurar domínio
- Render vai gerar URL tipo: `https://edutea-backend.onrender.com`
- **Importante**: Você pode usar esse domínio no arquivo `docs/script.js`

### 3. Testar
```bash
# Frontend local (já funciona)
http://127.0.0.1:5010

# Frontend + Backend Render
Editar docs/script.js linha 1:
BACKEND_URL = "https://seu-app.onrender.com"

# Depois acessar:
https://dev-mjbs.github.io/EduTEA/
```

## Observações
- ⚠️ Render free: app hibernará após 15 min sem uso
- ✅ Webcam funciona (backend Render lê a webcam do seu PC local)
- ✅ MediaPipe + OpenCV funcionam normalmente

## Troubleshooting
- Erro de conexão? Verifique se CORS está ativado (já está em app.py)
- Página em branco? Abra DevTools (F12) → Console para ver erros
