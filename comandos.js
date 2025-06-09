const { SlashCommandBuilder } = require('discord.js');

module.exports = [
  new SlashCommandBuilder()
    .setName('entrada')
    .setDescription('Registra tu hora de entrada.'),

  new SlashCommandBuilder()
    .setName('salida')
    .setDescription('Registra tu hora de salida y guarda el tiempo.'),

  new SlashCommandBuilder()
    .setName('sumarminutos')
    .setDescription('Suma minutos manualmente a un usuario.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que sumar minutos')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('minutos')
        .setDescription('Cantidad de minutos a sumar')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('fichaje50')
    .setDescription('Muestra el resumen de tiempos de un usuario.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a consultar')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('servicio')
    .setDescription('Muestra cuántas personas están en servicio ahora mismo.'),

  new SlashCommandBuilder()
    .setName('restarminutos')
    .setDescription('Resta minutos manualmente a un usuario.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que restar minutos')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('minutos')
        .setDescription('Cantidad de minutos a restar')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('forzarsalida')
    .setDescription('Fuerza la salida de un usuario en servicio.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que forzar la salida')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('forzarsalidaglobal')
    .setDescription('Fuerza la salida de todos los usuarios en servicio.'),

  new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Resetea todos los tiempos de las personas a 0.'),

  new SlashCommandBuilder()
    .setName('rankin')
    .setDescription('Muestra el top 5 de personas con más tiempo.'),

  new SlashCommandBuilder()
    .setName('verfichaje')
    .setDescription('Muestra el tiempo total trabajado de un usuario.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a consultar')
        .setRequired(true)),
];