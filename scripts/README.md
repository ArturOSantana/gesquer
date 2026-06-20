# 🛠️ Scripts Utilitários

## get-network-ip.cjs

Script para obter o IP da rede local e configurar corretamente o `VITE_APP_URL` para que os QR Codes funcionem em dispositivos móveis (iPhone, Android).

### Uso

```bash
npm run get-ip
```

### O que faz

1. Detecta o IP da rede local (IPv4)
2. Lê a porta configurada no `vite.config.js`
3. Mostra instruções de como configurar o `.env.local`
4. Exibe as URLs de acesso (local e rede)

### Exemplo de Saída

```
🌐 Configuração de Rede para QR Codes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 IP da Rede Local: 192.168.1.100
🔌 Porta do Vite: 3000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Configure seu .env.local com:

   VITE_APP_URL=http://192.168.1.100:3000

💡 Ou use detecção automática:

   VITE_APP_URL=auto

📱 Depois, reinicie o servidor:
   npm run dev

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 URLs de Acesso:

   Local:   http://localhost:3000
   Rede:    http://192.168.1.100:3000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Quando Usar

- **Primeira vez** configurando o projeto
- **Mudou de rede Wi-Fi** e o IP mudou
- **QR Codes não funcionam** no celular
- **Quer testar** em dispositivos móveis

### Solução de Problemas

**"Não foi possível detectar o IP da rede"**
- Verifique se está conectado a uma rede Wi-Fi
- Tente conectar a uma rede diferente
- Em último caso, use `ipconfig` (Windows) ou `ifconfig` (Mac/Linux) para ver seu IP manualmente

**"IP mudou depois de configurar"**
- Execute `npm run get-ip` novamente
- Atualize o `.env.local` com o novo IP
- Reinicie o servidor com `npm run dev`

### Dica

Use `VITE_APP_URL=auto` no `.env.local` para não precisar atualizar manualmente quando o IP mudar!