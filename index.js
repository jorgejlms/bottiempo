const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');

// Usa variables de entorno (Heroku)
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const DATA_FILE = './tiempos.json';

// Cargar datos
let tiempos = {};
if (fs.existsSync(DATA_FILE)) {
  tiempos = JSON.parse(fs.readFileSync(DATA_FILE));
}

function guardarDatos() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tiempos, null, 2));
}

const sesionesActivas = new Map();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: Object.values(Partials),
});

client.on('ready', () => {
  console.log(`✅ Bot iniciado como ${client.user.tag}`);
});

// ----------- COMANDOS POR MENSAJE -----------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const contenido = message.content.toLowerCase();
  const userId = message.author.id;

  // Comando de ayuda (visible para todos)
  if (contenido === '/ayuda' || contenido === '/comandos') {
    return message.channel.send(
      '📦 **Comandos disponibles:**\n' +
      '```md\n' +
      '# /entrada → Inicia el registro de tiempo\n' +
      '# /salida → Finaliza el registro y guarda el tiempo\n' +
      '# /sumarminutos @usuario cantidad → Suma minutos manualmente a un usuario\n' +
      '# /restarminutos @usuario cantidad → Resta minutos manualmente a un usuario\n' +
      '# /fichaje50 @usuario → Muestra el resumen de fichajes de un usuario\n' +
      '# /verfichaje @usuario → Muestra el tiempo total trabajado de un usuario\n' +
      '# /servicio → Muestra cuántas personas están en servicio\n' +
      '# /forzarsalida @usuario → Fuerza la salida de un usuario en servicio\n' +
      '# /forzarsalidaglobal → Fuerza la salida de todos los usuarios en servicio\n' +
      '# /reset → Resetea todos los tiempos a 0\n' +
      '# /rankin → Muestra el top 5 de personas con más tiempo\n' +
      '# /comandos → Muestra esta ayuda\n' +
      '```'
    );
  }

  // /entrada
  if (contenido === '/entrada') {
    if (sesionesActivas.has(userId)) {
      return message.reply('⏱ Ya iniciaste el tiempo. Usa /salida para detenerlo.');
    }
    sesionesActivas.set(userId, Date.now());
    return message.reply('🟢 Tiempo iniciado...');
  }

  // /salida
  if (contenido === '/salida') {
    if (!sesionesActivas.has(userId)) {
      return message.reply('❌ Aún no has iniciado el tiempo con /entrada.');
    }
    const inicio = sesionesActivas.get(userId);
    const fin = Date.now();
    const duracionMin = Math.max(1, Math.floor((fin - inicio) / 1000 / 60));
    sesionesActivas.delete(userId);

    if (!tiempos[userId]) {
      tiempos[userId] = { minutos: 0, sesiones: 0, historial: [] };
    }

    tiempos[userId].minutos += duracionMin;
    tiempos[userId].sesiones += 1;
    tiempos[userId].historial.push(`Fichaje: ${duracionMin} min`);
    guardarDatos();
    return message.reply(
      `🛑 Tiempo detenido. Estuviste activo ${duracionMin} minutos.\n` +
      `📊 Total acumulado: ${tiempos[userId].minutos} minutos en ${tiempos[userId].sesiones} sesiones.`
    );
  }

  // /sumarminutos @usuario cantidad
  if (contenido.startsWith('/sumarminutos')) {
    const partes = message.content.split(' ');

    if (partes.length < 3 || message.mentions.users.size === 0) {
      return message.reply('❌ Uso correcto: `/sumarminutos @usuario cantidad`');
    }

    const usuarioMencionado = message.mentions.users.first();
    const cantidad = parseInt(partes[2]);

    if (isNaN(cantidad) || cantidad <= 0) {
      return message.reply('❌ Ingresa una cantidad válida de minutos.');
    }

    const targetId = usuarioMencionado.id;
    if (!tiempos[targetId]) {
      tiempos[targetId] = { minutos: 0, sesiones: 0, historial: [] };
    }

    tiempos[targetId].minutos += cantidad;
    tiempos[targetId].historial.push(`Sumado manualmente: ${cantidad} min`);
    guardarDatos();

    return message.reply(`✅ Se sumaron ${cantidad} minutos a ${usuarioMencionado.username}. Total ahora: ${tiempos[targetId].minutos} minutos.`);
  }

  // /restarminutos @usuario cantidad
  if (contenido.startsWith('/restarminutos')) {
    const partes = message.content.split(' ');

    if (partes.length < 3 || message.mentions.users.size === 0) {
      return message.reply('❌ Uso correcto: `/restarminutos @usuario cantidad`');
    }

    const usuarioMencionado = message.mentions.users.first();
    const cantidad = parseInt(partes[2]);

    if (isNaN(cantidad) || cantidad <= 0) {
      return message.reply('❌ Ingresa una cantidad válida de minutos.');
    }

    const targetId = usuarioMencionado.id;
    if (!tiempos[targetId]) {
      tiempos[targetId] = { minutos: 0, sesiones: 0, historial: [] };
    }

    tiempos[targetId].minutos = Math.max(0, tiempos[targetId].minutos - cantidad);
    tiempos[targetId].historial.push(`Restado manualmente: ${cantidad} min`);
    guardarDatos();

    return message.reply(`✅ Se restaron ${cantidad} minutos a ${usuarioMencionado.username}. Total ahora: ${tiempos[targetId].minutos} minutos.`);
  }

  // /fichaje50 @usuario
  if (contenido.startsWith('/fichaje50')) {
    if (message.mentions.users.size === 0) {
      return message.reply('❌ Debes mencionar a un usuario: `/fichaje50 @usuario`');
    }
    const usuarioMencionado = message.mentions.users.first();
    const id = usuarioMencionado.id;
    const datos = tiempos[id];

    if (!datos) {
      return message.reply(`⛔ No hay datos registrados para ${usuarioMencionado.username}.`);
    }

    const horas = Math.floor(datos.minutos / 60);
    const minutos = datos.minutos % 60;

    let reporte = `👤 **${usuarioMencionado.username}**\n`;
    reporte += `📝 Fichaje del usuario\n`;
    reporte += `⏱️ ${horas} horas y ${minutos} minutos trabajados\n`;

    return message.reply(reporte);
  }

  // /verfichaje @usuario
  if (contenido.startsWith('/verfichaje')) {
    if (message.mentions.users.size === 0) {
      return message.reply('❌ Debes mencionar a un usuario: `/verfichaje @usuario`');
    }
    const usuarioMencionado = message.mentions.users.first();
    const id = usuarioMencionado.id;
    const datos = tiempos[id];

    if (!datos) {
      return message.reply(`⛔ No hay datos registrados para ${usuarioMencionado.username}.`);
    }

    return message.reply(`⏱ ${usuarioMencionado.username} ha trabajado un total de **${datos.minutos} minutos**.`);
  }

  // /forzarsalida @usuario
  if (contenido.startsWith('/forzarsalida')) {
    if (message.mentions.users.size === 0) {
      return message.reply('❌ Uso correcto: `/forzarsalida @usuario`');
    }
    const usuarioMencionado = message.mentions.users.first();
    const targetId = usuarioMencionado.id;

    if (!sesionesActivas.has(targetId)) {
      return message.reply(`❌ ${usuarioMencionado.username} no está en servicio.`);
    }

    const inicio = sesionesActivas.get(targetId);
    const fin = Date.now();
    const duracionMin = Math.max(1, Math.floor((fin - inicio) / 1000 / 60));
    sesionesActivas.delete(targetId);

    if (!tiempos[targetId]) {
      tiempos[targetId] = { minutos: 0, sesiones: 0, historial: [] };
    }

    tiempos[targetId].minutos += duracionMin;
    tiempos[targetId].sesiones += 1;
    tiempos[targetId].historial.push(`Fichaje forzado: ${duracionMin} min`);
    guardarDatos();

    return message.reply(`🛑 Se forzó la salida de ${usuarioMencionado.username}. Tiempo sumado: ${duracionMin} minutos.`);
  }

  // /forzarsalidaglobal
  if (contenido === '/forzarsalidaglobal') {
    if (sesionesActivas.size === 0) {
      return message.reply('🚫 No hay nadie en servicio ahora mismo.');
    }
    let reporte = '';
    for (const [userId, inicio] of sesionesActivas.entries()) {
      const fin = Date.now();
      const duracionMin = Math.max(1, Math.floor((fin - inicio) / 1000 / 60));
      if (!tiempos[userId]) {
        tiempos[userId] = { minutos: 0, sesiones: 0, historial: [] };
      }
      tiempos[userId].minutos += duracionMin;
      tiempos[userId].sesiones += 1;
      tiempos[userId].historial.push(`Fichaje forzado global: ${duracionMin} min`);
      const miembro = await client.users.fetch(userId).catch(() => null);
      const nombre = miembro ? miembro.username : `ID: ${userId}`;
      reporte += `🛑 ${nombre}: ${duracionMin} minutos sumados\n`;
    }
    sesionesActivas.clear();
    guardarDatos();
    return message.reply(`Se forzó la salida de todos:\n${reporte}`);
  }

  // /servicio mejorado
  if (contenido === '/servicio') {
    if (sesionesActivas.size === 0) {
      return message.reply('🚫 No hay nadie en servicio ahora mismo.');
    }
    let lista = [];
    for (const [userId, inicio] of sesionesActivas.entries()) {
      const miembro = await client.users.fetch(userId).catch(() => null);
      const nombre = miembro ? miembro.username : `ID: ${userId}`;
      const minutos = Math.max(1, Math.floor((Date.now() - inicio) / 1000 / 60));
      lista.push(`${nombre} (${minutos} min)`);
    }
    return message.reply(
      `👥 En servicio ahora mismo (${sesionesActivas.size}):\n- ${lista.join('\n- ')}`
    );
  }

  // /reset
  if (contenido === '/reset') {
    for (const id in tiempos) {
      tiempos[id].minutos = 0;
      tiempos[id].sesiones = 0;
      tiempos[id].historial = [];
    }
    guardarDatos();
    return message.reply('🔄 Todos los tiempos han sido reseteados a 0.');
  }

  // /rankin
  if (contenido === '/rankin') {
    if (Object.keys(tiempos).length === 0) {
      return message.reply('⛔ No hay datos registrados todavía.');
    }
    const top = Object.entries(tiempos)
      .sort((a, b) => b[1].minutos - a[1].minutos)
      .slice(0, 5);

    let texto = '🏆 **Top 5 personas con más tiempo:**\n';
    for (let i = 0; i < top.length; i++) {
      const [id, datos] = top[i];
      const miembro = await message.client.users.fetch(id).catch(() => null);
      const nombre = miembro ? miembro.username : `ID: ${id}`;
      texto += `**${i + 1}.** ${nombre} — ${datos.minutos} min\n`;
    }
    return message.reply(texto);
  }
});

// ----------- COMANDOS SLASH -----------
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user, options } = interaction;

  // /entrada
  if (commandName === 'entrada') {
    if (sesionesActivas.has(user.id)) {
      return interaction.reply({ content: '⏱ Ya iniciaste el tiempo. Usa /salida para detenerlo.' });
    }
    sesionesActivas.set(user.id, Date.now());
    return interaction.reply({ content: '🟢 Tiempo iniciado...' });
  }

  // /salida
  if (commandName === 'salida') {
    if (!sesionesActivas.has(user.id)) {
      return interaction.reply({ content: '❌ Aún no has iniciado el tiempo con /entrada.' });
    }
    const inicio = sesionesActivas.get(user.id);
    const fin = Date.now();
    const duracionMin = Math.max(1, Math.floor((fin - inicio) / 1000 / 60));
    sesionesActivas.delete(user.id);

    if (!tiempos[user.id]) {
      tiempos[user.id] = { minutos: 0, sesiones: 0, historial: [] };
    }

    tiempos[user.id].minutos += duracionMin;
    tiempos[user.id].sesiones += 1;
    tiempos[user.id].historial.push(`Fichaje: ${duracionMin} min`);
    guardarDatos();
    return interaction.reply({
      content: `🛑 Tiempo detenido. Estuviste activo ${duracionMin} minutos.\n📊 Total acumulado: ${tiempos[user.id].minutos} minutos en ${tiempos[user.id].sesiones} sesiones.`
    });
  }

  // /sumarminutos
  if (commandName === 'sumarminutos') {
    const usuarioMencionado = options.getUser('usuario');
    const cantidad = options.getInteger('minutos');

    if (!usuarioMencionado || !cantidad || cantidad <= 0) {
      return interaction.reply({ content: '❌ Ingresa un usuario y una cantidad válida de minutos.' });
    }

    const targetId = usuarioMencionado.id;
    if (!tiempos[targetId]) {
      tiempos[targetId] = { minutos: 0, sesiones: 0, historial: [] };
    }

    tiempos[targetId].minutos += cantidad;
    tiempos[targetId].historial.push(`Sumado manualmente: ${cantidad} min`);
    guardarDatos();

    return interaction.reply({
      content: `✅ Se sumaron ${cantidad} minutos a ${usuarioMencionado.username}. Total ahora: ${tiempos[targetId].minutos} minutos.`
    });
  }

  // /restarminutos
  if (commandName === 'restarminutos') {
    const usuarioMencionado = options.getUser('usuario');
    const cantidad = options.getInteger('minutos');

    if (!usuarioMencionado || !cantidad || cantidad <= 0) {
      return interaction.reply({ content: '❌ Ingresa un usuario y una cantidad válida de minutos.' });
    }

    const targetId = usuarioMencionado.id;
    if (!tiempos[targetId]) {
      tiempos[targetId] = { minutos: 0, sesiones: 0, historial: [] };
    }

    tiempos[targetId].minutos = Math.max(0, tiempos[targetId].minutos - cantidad);
    tiempos[targetId].historial.push(`Restado manualmente: ${cantidad} min`);
    guardarDatos();

    return interaction.reply({
      content: `✅ Se restaron ${cantidad} minutos a ${usuarioMencionado.username}. Total ahora: ${tiempos[targetId].minutos} minutos.`
    });
  }

  // ...continúan los demás comandos slash igual que antes...
});

// Servidor Express para mantener el bot activo (opcional)
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot activo');
});

app.listen(3000, () => {
  console.log('Servidor Express encendido en puerto 3000');
});

client.login(TOKEN);
