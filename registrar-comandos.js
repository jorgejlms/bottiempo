const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const comandos = require('./comandos.js');

// Si comandos.js exporta un objeto { default: [...] }
const comandosArray = Array.isArray(comandos) ? comandos : comandos.default;

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('⌛ Registrando comandos slash...');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: comandosArray.map(c => c.toJSON()) }
    );

    console.log('✅ Comandos registrados con éxito.');
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();