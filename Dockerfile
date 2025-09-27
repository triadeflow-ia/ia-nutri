# Dockerfile otimizado para produção
FROM node:22-alpine AS builder

# Instalar dependências necessárias para compilação
RUN apk add --no-cache python3 make g++

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Estágio de produção
FROM node:22-alpine AS production

# Instalar PM2 globalmente
RUN npm install -g pm2

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar dependências do estágio anterior
COPY --from=builder /app/node_modules ./node_modules

# Copiar código da aplicação
COPY --chown=nodejs:nodejs . .

# Criar diretórios necessários
RUN mkdir -p logs public && \
    chown -R nodejs:nodejs logs public

# Expor porta
EXPOSE 1337

# Configurar usuário
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node scripts/health-check.js

# Comando de inicialização
CMD ["pm2-runtime", "start", "ecosystem.config.js"]