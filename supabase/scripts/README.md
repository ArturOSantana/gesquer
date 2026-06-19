# Scripts SQL do Sistema QuermesseOn

## limpar-banco-testes.sql

Script para limpar todos os dados de teste do banco de dados.

### O que faz:
- Apaga todos os clientes
- Apaga todos os cartoes
- Apaga todas as transacoes
- Apaga todas as vendas
- Apaga todos os produtos
- Apaga todas as barracas
- Apaga todos os usuarios (EXCETO SuperAdmin)
- Reseta sequences (IDs voltam para 1)

### O que mantem:
- Usuario SuperAdmin (admin@quermesse.com)
- Estrutura do banco (tabelas, colunas, RLS)

### Como executar:

1. Acesse o Supabase Dashboard
2. Va em SQL Editor
3. Copie e cole o conteudo do arquivo
4. Execute o script
5. Verifique a tabela de resultados

### Quando usar:
- Apos testes de desenvolvimento
- Antes de um novo evento
- Para resetar o sistema

### ATENCAO:
Este script e DESTRUTIVO e nao pode ser desfeito.
Faca backup antes se necessario.