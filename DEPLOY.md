# 🚀 Deploy Backend no Render (Grátis)

## Passo 1: Criar conta no Render
1. Vá para https://render.com
2. Clique **Sign up** (pode usar GitHub)
3. Autorize acesso ao seu GitHub

## Passo 2: Criar Web Service
1. No dashboard do Render, clique **New +** → **Web Service**
2. Selecione seu repositório `Dev-MJBS/EduTEA`
3. Preencha:
   - **Name:** `edutea-backend` (ou qualquer nome)
   - **Region:** `São Paulo (sa-east-1)` (ou mais perto de você)
   - **Runtime:** Python 3.9
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn --worker-class eventlet -w 1 app:app`
4. Clique **Create Web Service**

Render vai:
- ✅ Instalar dependências
- ✅ Iniciar o servidor
- ✅ Dar uma URL tipo: `https://edutea-backend.onrender.com`

**⏰ Demora:** ~5 minutos na primeira vez

## Passo 3: Conectar Frontend ao Backend
Quando o Render disser "live", copie a URL dele e edite `docs/script.js`:

```javascript
// Linha ~6, mude de:
const BACKEND_URL = 'http://127.0.0.1:5010';

// Para:
const BACKEND_URL = 'https://edutea-backend.onrender.com';
```

Faça commit e push:
```zsh
git add docs/script.js
git commit -m "Update backend URL to Render deployment"
git push origin main
```

GitHub Pages atualiza automaticamente. **Pronto!** 🎉

## Acessar o App Online
1. Frontend: https://dev-mjbs.github.io/EduTEA/
2. Backend: https://edutea-backend.onrender.com

## Troubleshooting

### "Cannot connect to backend"
- Verifique a URL no `docs/script.js`
- Abra DevTools (F12) → Console, procure por erros CORS
- Teste a URL backend direto no navegador: `https://edutea-backend.onrender.com/health`
  (deve mostrar `{"status": "ok"}`)

### "Backend spinning down after 15 min"
Plano grátis do Render desativa serviços inativos. Soluções:
- **Upgrade** para plano pago (~$7/mês)
- **Manter vivo:** Cron job que pinga a cada 15 min
- **Alternativa:** Railway ou Heroku

### Camera não funciona online
⚠️ **Importante:** Câmera só funciona em **HTTPS** e na **mesma máquina** do servidor.
- Se backend está em Render (nuvem), ele não consegue acessar sua câmera local
- **Solução:** Backend deve rodar localmente + frontend no localhost
  - Ou: Backend na nuvem aceita imagens por upload (requer mudança no código)

---

**Qual opção você quer?**
1. ✅ Deploy no Render agora (camera só funciona local)
2. 🎯 Backend local + frontend remoto (funciona tudo, mas precisa ter servidor rodando)
3. 🔧 Outro setup customizado
