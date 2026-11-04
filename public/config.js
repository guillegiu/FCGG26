// Datos de la noche. Cambiá lo que quieras acá y volvé a desplegar.
window.EVENTO = {
  nombre: 'GUILLEGIU',
  temporada: 'Temporada 28',
  capitulo: 'Capítulo I',
  lema: 'Esta perfo es personal',

  // Ej: 'Sábado 22 de noviembre'. Si queda vacío, no se muestra.
  fecha: 'Sábado 7 de noviembre',

  presentacion:
    'Estás invitado a mi cumple. Cumplo 28 y no me lo imagino sin vos, así que lo festejamos como corresponde: arrancamos con una previa y después nos vamos a cachenguear. Te espero después de comer.',

  // Se muestra al final, cuando ya respondió y viene.
  bebida: 'La bebida la invita la casa. Vos traé solo ganas de perfo y de pasarla bien.',

  previa: {
    titulo: 'Previa',
    hora: '23:00',
    detalle: 'Open doors',
    direccion: 'Dorrego 59',
    ciudad: 'Rosario',
    mapa: 'Dorrego 59, Rosario, Santa Fe, Argentina',
  },

  // La dirección con la que se confunden: se muestra en un segundo mapa marcada como "no es acá".
  noEsAca: {
    direccion: 'Dorrego 59 bis',
    ciudad: 'Rosario',
    // Ubicación exacta del 59 bis (sacada del link de Google Maps).
    mapa: '-32.9344061,-60.6466143',
  },

  boliche: {
    titulo: 'Boliche',
    hora: '02:00',
    detalle: 'Lugar a confirmar, pero seguro de cachengue',
  },

  plan: [
    { hora: '23:00', texto: 'Open doors en Dorrego 59. Previa, música y alcohol.' },
    { hora: '02:00', texto: 'Salimos para el boliche. Cachengue hasta que el cuerpo diga basta.' },
  ],
};
