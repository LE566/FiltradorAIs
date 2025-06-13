const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwNpexm9yQo9zayGQL5nbX291jtTFtS6unWJ8XcARNf7JkHV3Ewvs261kbq6DVGP1cFhQ/exec';

// Ruta para actualizar importancia
router.post('/update-importance', async (req, res) => {
  try {
    if (!req.body || !req.body.id || !req.body.hasOwnProperty('important')) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Datos incompletos: se requieren id e important'
      });
    }

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateImportance',
        id: req.body.id,
        important: req.body.important ? 'Si' : 'No' 
      }),
      redirect: 'manual' 
    });

    let finalResponse = response;
    if (response.status === 302) {
      const redirectUrl = response.headers.get('location');
      finalResponse = await fetch(redirectUrl);
    }

    const responseText = await finalResponse.text();
    let data = {};
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parseando respuesta:', responseText);
      throw new Error('Respuesta no válida del servidor');
    }

    res.json({
      status: data.status || 'success',
      success: true,
      tool: req.body.id,
      newValue: req.body.important ? 'Si' : 'No',
      originalResponse: data
    });

  } catch (error) {
    console.error('Error en /api/update-importance:', error);
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message,
      tool: req.body?.id || 'desconocido',
      newValue: null
    });
  }
});

// Ruta para obtener herramientas
router.get('/tools', async (req, res) => {
  try {
    const response = await fetch(GAS_URL);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      success: false,
      message: 'Error al cargar datos desde Google Sheets'
    });
  }
});

module.exports = router;
