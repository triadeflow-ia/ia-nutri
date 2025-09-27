#!/usr/bin/env node

/**
 * Script de Validação Completa da Aplicação
 * 
 * Este script testa todos os componentes essenciais da aplicação
 * antes do deploy em produção.
 */

import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { spawn } from 'child_process';
import axios from 'axios';
import redis from 'redis';
import OpenAI from 'openai';

// Carregar variáveis de ambiente
dotenv.config();

// Cores para output colorido
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

class ValidationSuite {
  constructor() {
    this.results = [];
    this.server = null;
    this.port = process.env.PORT || 1337;
    this.testPort = 1338; // Porta diferente para testes
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  addResult(test, status, message, details = null) {
    this.results.push({
      test,
      status, // 'pass', 'fail', 'warn'
      message,
      details
    });

    const statusColor = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
    const statusIcon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
    
    this.log(`  ${statusIcon} ${test}: ${message}`, statusColor);
    if (details) {
      this.log(`    ${details}`, 'cyan');
    }
  }

  async checkEnvironmentVariables() {
    this.log('\n🔍 Verificando variáveis de ambiente...', 'blue');

    const requiredVars = [
      'NODE_ENV',
      'PORT'
    ];

    const criticalVars = [
      'OPENAI_API_KEY',
      'WHATSAPP_TOKEN',
      'WHATSAPP_VERIFY_TOKEN'
    ];

    const optionalVars = [
      'REDIS_URL',
      'REDIS_PASSWORD',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'LOG_LEVEL'
    ];

    let allRequired = true;
    let allCritical = true;

    // Verificar variáveis obrigatórias
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        this.addResult('Env Var', 'pass', `${varName} está definida`);
      } else {
        this.addResult('Env Var', 'fail', `${varName} não está definida`, 'Variável obrigatória');
        allRequired = false;
      }
    }

    // Verificar variáveis críticas
    for (const varName of criticalVars) {
      if (process.env[varName]) {
        this.addResult('Env Var', 'pass', `${varName} está definida`);
      } else {
        this.addResult('Env Var', 'fail', `${varName} não está definida`, 'Variável crítica para funcionamento');
        allCritical = false;
      }
    }

    // Verificar variáveis opcionais
    for (const varName of optionalVars) {
      if (process.env[varName]) {
        this.addResult('Env Var', 'pass', `${varName} está definida`);
      } else {
        this.addResult('Env Var', 'warn', `${varName} não está definida`, 'Variável opcional');
      }
    }

    // Verificar formato das variáveis críticas
    if (process.env.OPENAI_API_KEY) {
      if (process.env.OPENAI_API_KEY.startsWith('sk-')) {
        this.addResult('Env Format', 'pass', 'OPENAI_API_KEY tem formato válido');
      } else {
        this.addResult('Env Format', 'fail', 'OPENAI_API_KEY tem formato inválido', 'Deve começar com "sk-"');
        allCritical = false;
      }
    }

    if (process.env.STRIPE_SECRET_KEY) {
      if (process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
        this.addResult('Env Format', 'pass', 'STRIPE_SECRET_KEY tem formato válido');
      } else {
        this.addResult('Env Format', 'fail', 'STRIPE_SECRET_KEY tem formato inválido', 'Deve começar com "sk_"');
      }
    }

    return { allRequired, allCritical };
  }

  async checkRedisConnection() {
    this.log('\n🔍 Testando conexão com Redis...', 'blue');

    if (!process.env.REDIS_URL || !process.env.REDIS_PASSWORD) {
      this.addResult('Redis', 'warn', 'Redis não configurado', 'Variáveis REDIS_URL/REDIS_PASSWORD ausentes');
      return true; // Não é crítico se não estiver configurado
    }

    try {
      const client = redis.createClient({
        url: `redis://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_URL}`
      });

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout na conexão Redis'));
        }, 5000);

        client.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });

        client.connect();
      });

      // Testar operações básicas
      await client.set('test_key', 'test_value', { EX: 10 });
      const value = await client.get('test_key');
      await client.del('test_key');
      await client.quit();

      if (value === 'test_value') {
        this.addResult('Redis', 'pass', 'Conexão e operações Redis funcionando');
        return true;
      } else {
        this.addResult('Redis', 'fail', 'Operações Redis falharam');
        return false;
      }

    } catch (error) {
      this.addResult('Redis', 'fail', `Falha na conexão Redis: ${error.message}`);
      return false;
    }
  }

  async checkOpenAIConnection() {
    this.log('\n🔍 Testando conexão com OpenAI API...', 'blue');

    if (!process.env.OPENAI_API_KEY) {
      this.addResult('OpenAI', 'fail', 'OPENAI_API_KEY não definida');
      return false;
    }

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      // Testar com uma requisição simples
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Teste de conexão' }],
        max_tokens: 5
      });

      if (response.choices && response.choices.length > 0) {
        this.addResult('OpenAI', 'pass', 'Conexão OpenAI funcionando');
        return true;
      } else {
        this.addResult('OpenAI', 'fail', 'Resposta OpenAI inválida');
        return false;
      }

    } catch (error) {
      if (error.status === 401) {
        this.addResult('OpenAI', 'fail', 'Chave API OpenAI inválida');
      } else if (error.status === 429) {
        this.addResult('OpenAI', 'fail', 'Limite de taxa OpenAI excedido');
      } else {
        this.addResult('OpenAI', 'fail', `Erro OpenAI: ${error.message}`);
      }
      return false;
    }
  }

  async checkStripeConnection() {
    this.log('\n🔍 Testando conexão com Stripe API...', 'blue');

    if (!process.env.STRIPE_SECRET_KEY) {
      this.addResult('Stripe', 'warn', 'STRIPE_SECRET_KEY não definida', 'Stripe é opcional');
      return true; // Não é crítico
    }

    try {
      const response = await axios.get('https://api.stripe.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
        },
        timeout: 10000
      });

      if (response.status === 200) {
        this.addResult('Stripe', 'pass', 'Conexão Stripe funcionando');
        return true;
      } else {
        this.addResult('Stripe', 'fail', `Stripe retornou status ${response.status}`);
        return false;
      }

    } catch (error) {
      if (error.response?.status === 401) {
        this.addResult('Stripe', 'fail', 'Chave API Stripe inválida');
      } else {
        this.addResult('Stripe', 'fail', `Erro Stripe: ${error.message}`);
      }
      return false;
    }
  }

  async checkServerStartup() {
    this.log('\n🔍 Testando inicialização do servidor...', 'blue');

    // Primeiro, verificar se o servidor já está rodando
    try {
      const response = await axios.get(`http://localhost:${this.port}/`, {
        timeout: 5000
      });

      if (response.status === 200 && response.data.message) {
        this.addResult('Server', 'pass', 'Servidor já está rodando e funcionando');
        return true;
      }
    } catch (error) {
      // Servidor não está rodando, continuar com o teste de inicialização
    }

    return new Promise((resolve) => {
      try {
        // Temporariamente mudar a porta para teste
        const originalPort = process.env.PORT;
        process.env.PORT = this.testPort;

        // Importar e inicializar o app em uma porta diferente
        import('./app.js').then(() => {
          // Aguardar um pouco para o servidor inicializar
          setTimeout(async () => {
            try {
              const response = await axios.get(`http://localhost:${this.testPort}/`, {
                timeout: 5000
              });

              if (response.status === 200 && response.data.message) {
                this.addResult('Server', 'pass', 'Servidor inicializado corretamente');
                resolve(true);
              } else {
                this.addResult('Server', 'fail', 'Resposta do servidor inválida');
                resolve(false);
              }
            } catch (error) {
              this.addResult('Server', 'fail', `Erro ao acessar servidor: ${error.message}`);
              resolve(false);
            } finally {
              // Restaurar porta original
              process.env.PORT = originalPort;
            }
          }, 2000);
        }).catch((error) => {
          // Restaurar porta original
          process.env.PORT = originalPort;
          
          if (error.code === 'EADDRINUSE') {
            this.addResult('Server', 'pass', 'Servidor pode ser inicializado (porta já em uso)');
            resolve(true);
          } else {
            this.addResult('Server', 'fail', `Erro ao importar app.js: ${error.message}`);
            resolve(false);
          }
        });

      } catch (error) {
        this.addResult('Server', 'fail', `Erro na inicialização: ${error.message}`);
        resolve(false);
      }
    });
  }

  async checkEndpoints() {
    this.log('\n🔍 Testando endpoints principais...', 'blue');

    const endpoints = [
      { path: '/', name: 'Root', expectedStatus: 200 },
      { path: '/monitoring/health', name: 'Health Check', expectedStatus: 200 },
      { path: '/admin', name: 'Admin Dashboard', expectedStatus: 200 }
    ];

    let allEndpointsWorking = true;
    let portToUse = this.port;

    // Se o servidor principal não estiver rodando, usar a porta de teste
    try {
      await axios.get(`http://localhost:${this.port}/`, { timeout: 2000 });
    } catch (error) {
      portToUse = this.testPort;
    }

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:${portToUse}${endpoint.path}`, {
          timeout: 5000,
          validateStatus: (status) => status < 500 // Aceitar 4xx como válido
        });

        if (response.status === endpoint.expectedStatus) {
          this.addResult('Endpoint', 'pass', `${endpoint.name} (${endpoint.path})`);
        } else {
          this.addResult('Endpoint', 'warn', `${endpoint.name} retornou ${response.status}`, `Esperado: ${endpoint.expectedStatus}`);
        }

      } catch (error) {
        this.addResult('Endpoint', 'fail', `${endpoint.name} falhou: ${error.message}`);
        allEndpointsWorking = false;
      }
    }

    return allEndpointsWorking;
  }

  async checkDependencies() {
    this.log('\n🔍 Verificando dependências...', 'blue');

    try {
      // Verificar se node_modules existe
      const fs = await import('fs');
      if (fs.existsSync('./node_modules')) {
        this.addResult('Dependencies', 'pass', 'node_modules existe');
      } else {
        this.addResult('Dependencies', 'fail', 'node_modules não encontrado', 'Execute npm install');
        return false;
      }

      // Verificar package.json
      if (fs.existsSync('./package.json')) {
        this.addResult('Dependencies', 'pass', 'package.json existe');
      } else {
        this.addResult('Dependencies', 'fail', 'package.json não encontrado');
        return false;
      }

      // Verificar se as dependências principais estão instaladas
      const criticalDeps = ['express', 'dotenv', 'axios', 'openai', 'redis'];
      let allDepsInstalled = true;

      for (const dep of criticalDeps) {
        try {
          await import(dep);
          this.addResult('Dependencies', 'pass', `${dep} instalado`);
        } catch (error) {
          this.addResult('Dependencies', 'fail', `${dep} não instalado`);
          allDepsInstalled = false;
        }
      }

      return allDepsInstalled;

    } catch (error) {
      this.addResult('Dependencies', 'fail', `Erro ao verificar dependências: ${error.message}`);
      return false;
    }
  }

  async runValidation() {
    this.log('🚀 Iniciando validação completa da aplicação...', 'bright');
    this.log('='.repeat(60), 'cyan');

    const startTime = Date.now();

    // Executar todas as validações
    const envCheck = await this.checkEnvironmentVariables();
    const depsCheck = await this.checkDependencies();
    const redisCheck = await this.checkRedisConnection();
    const openaiCheck = await this.checkOpenAIConnection();
    const stripeCheck = await this.checkStripeConnection();
    const serverCheck = await this.checkServerStartup();
    const endpointsCheck = await this.checkEndpoints();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Gerar relatório final
    this.generateReport(envCheck, depsCheck, redisCheck, openaiCheck, stripeCheck, serverCheck, endpointsCheck, duration);
  }

  generateReport(envCheck, depsCheck, redisCheck, openaiCheck, stripeCheck, serverCheck, endpointsCheck, duration) {
    this.log('\n' + '=' * 60, 'cyan');
    this.log('📊 RELATÓRIO DE VALIDAÇÃO', 'bright');
    this.log('='.repeat(60), 'cyan');

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warn').length;
    const total = this.results.length;

    this.log(`\n📈 Estatísticas:`, 'blue');
    this.log(`  ✓ Testes aprovados: ${passed}`, 'green');
    this.log(`  ✗ Testes falharam: ${failed}`, 'red');
    this.log(`  ⚠ Avisos: ${warnings}`, 'yellow');
    this.log(`  📊 Total de testes: ${total}`);
    this.log(`  ⏱ Tempo de execução: ${duration}s`);

    // Verificar se aplicação está pronta para deploy
    const criticalChecks = [envCheck.allCritical, depsCheck, openaiCheck, serverCheck];
    const allCriticalPassed = criticalChecks.every(check => check === true);

    this.log('\n🎯 Status Final:', 'blue');

    if (allCriticalPassed && failed === 0) {
      this.log('🎉 APLICAÇÃO PRONTA PARA DEPLOY! 🎉', 'bgGreen');
      this.log('Todos os testes críticos passaram com sucesso.', 'green');
    } else if (allCriticalPassed && failed > 0) {
      this.log('⚠️ APLICAÇÃO FUNCIONAL COM AVISOS', 'bgYellow');
      this.log('Testes críticos passaram, mas há falhas não-críticas.', 'yellow');
    } else {
      this.log('❌ APLICAÇÃO NÃO PRONTA PARA DEPLOY', 'bgRed');
      this.log('Testes críticos falharam. Corrija os problemas antes do deploy.', 'red');
    }

    // Mostrar resumo dos problemas
    if (failed > 0 || warnings > 0) {
      this.log('\n🔍 Resumo dos Problemas:', 'blue');
      
      const failedTests = this.results.filter(r => r.status === 'fail');
      const warningTests = this.results.filter(r => r.status === 'warn');

      if (failedTests.length > 0) {
        this.log('\n❌ Falhas Críticas:', 'red');
        failedTests.forEach(test => {
          this.log(`  • ${test.test}: ${test.message}`, 'red');
          if (test.details) {
            this.log(`    ${test.details}`, 'cyan');
          }
        });
      }

      if (warningTests.length > 0) {
        this.log('\n⚠️ Avisos:', 'yellow');
        warningTests.forEach(test => {
          this.log(`  • ${test.test}: ${test.message}`, 'yellow');
          if (test.details) {
            this.log(`    ${test.details}`, 'cyan');
          }
        });
      }
    }

    this.log('\n' + '=' * 60, 'cyan');
    
    // Retornar código de saída apropriado
    process.exit(allCriticalPassed && failed === 0 ? 0 : 1);
  }
}

// Executar validação se script for chamado diretamente
const isMainModule = import.meta.url.endsWith(process.argv[1]) || 
                     import.meta.url.includes('validate-app.js');

if (isMainModule) {
  const validator = new ValidationSuite();
  validator.runValidation().catch(error => {
    console.error('❌ Erro fatal na validação:', error);
    process.exit(1);
  });
}

export default ValidationSuite;
