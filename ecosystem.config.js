// ecosystem.config.js
// Configuração do PM2 para produção

module.exports = {
  apps: [
    {
      name: 'ia-atendimento-bot',
      script: 'app.js',
      instances: 'max', // Usar todos os cores disponíveis
      exec_mode: 'cluster',
      
      // Configurações de ambiente
      env: {
        NODE_ENV: 'development',
        PORT: 1337
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 1337
      },
      
      // Configurações de restart
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Configurações de memória
      max_memory_restart: '500M',
      
      // Configurações de log
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Configurações de monitoramento
      watch: false, // Desabilitar em produção
      ignore_watch: ['node_modules', 'logs', 'public'],
      
      // Configurações de cluster
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Configurações de health check
      health_check_grace_period: 3000,
      
      // Configurações de merge logs
      merge_logs: true,
      
      // Configurações de source map
      source_map_support: true,
      
      // Configurações de autorestart
      autorestart: true,
      
      // Configurações de cron restart (opcional - reiniciar diariamente às 3h)
      cron_restart: '0 3 * * *',
      
      // Configurações de variáveis de ambiente específicas
      env_file: '.env'
    }
  ],
  
  // Configurações de deploy (opcional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['seu-servidor.com'],
      ref: 'origin/main',
      repo: 'git@github.com:seu-usuario/ia-atendimento-bot.git',
      path: '/var/www/ia-atendimento-bot',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};