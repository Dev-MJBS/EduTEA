#!/bin/zsh
# Start EduTEA Backend Server

echo "🚀 Iniciando EduTEA Backend..."
echo ""

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment não encontrado"
    echo "💡 Execute primeiro: python3 -m venv .venv"
    exit 1
fi

# Activate virtual environment
source .venv/bin/activate

echo "✅ Virtual environment ativado"
echo ""
echo "📦 Verificando dependências..."
pip install -q -r requirements.txt

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎮 EduTEA Backend iniciando..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Acesse: http://127.0.0.1:5010"
echo ""
echo "💡 Para desactivar o servidor: Ctrl+C"
echo ""

# Run the backend
python app.py
