#!/usr/bin/env node

/**
 * Script para obter o IP da rede local
 * Útil para configurar VITE_APP_URL corretamente
 * 
 * Uso:
 *   node scripts/get-network-ip.js
 *   npm run get-ip
 */

const os = require('os');

/**
 * Obtém o IP da rede local (IPv4)
 * Ignora interfaces internas (localhost) e IPv6
 */
function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Pula interfaces internas (localhost) e IPv6
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

/**
 * Obtém a porta do Vite (padrão: 3000)
 */
function getVitePort() {
  // Tenta ler do vite.config.js
  try {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), 'vite.config.js');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    
    // Procura por "port: XXXX"
    const portMatch = configContent.match(/port:\s*(\d+)/);
    if (portMatch) {
      return portMatch[1];
    }
  } catch (err) {
    // Ignora erros e usa porta padrão
  }
  
  return '3000';
}

// Execução principal
const ip = getNetworkIP();
const port = getVitePort();

console.log('\n🌐 Configuração de Rede para QR Codes\n');
console.log('━'.repeat(50));
console.log(`\n📍 IP da Rede Local: ${ip}`);
console.log(`🔌 Porta do Vite: ${port}`);
console.log('\n━'.repeat(50));

if (ip === 'localhost') {
  console.log('\n⚠️  AVISO: Não foi possível detectar o IP da rede!');
  console.log('   Verifique se você está conectado a uma rede Wi-Fi.\n');
} else {
  console.log('\n✅ Configure seu .env.local com:\n');
  console.log(`   VITE_APP_URL=http://${ip}:${port}`);
  console.log('\n💡 Ou use detecção automática:\n');
  console.log('   VITE_APP_URL=auto');
  console.log('\n📱 Depois, reinicie o servidor:');
  console.log('   npm run dev\n');
  console.log('━'.repeat(50));
  console.log('\n🔗 URLs de Acesso:\n');
  console.log(`   Local:   http://localhost:${port}`);
  console.log(`   Rede:    http://${ip}:${port}`);
  console.log('\n━'.repeat(50));
}

console.log('\n');

// Made with Bob
