// routes/test.js
import express from 'express';
import * as onboardingService from '../services/onboardingService.js';

const router = express.Router();

// Endpoint para testar onboarding manualmente
router.post('/start-onboarding', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber é obrigatório' });
    }

    console.log(`🧪 Teste manual de onboarding para: ${phoneNumber}`);
    
    // Iniciar onboarding
    await onboardingService.startOnboarding(phoneNumber);
    
    res.json({ 
      success: true, 
      message: 'Onboarding iniciado com sucesso!',
      phoneNumber 
    });
    
  } catch (error) {
    console.error('Erro no teste de onboarding:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
