// utils\dateUtils.js

import moment from 'moment-timezone';

export function getCurrentDate() {
  return moment().tz("America/Sao_Paulo").format('DD/MM/YYYY');
}

export function getCurrentDateTime() {
  return moment().tz("America/Sao_Paulo").format('DD/MM/YYYY HH:mm:ss');
}

export function getCurrentTime() {
  return moment().tz("America/Sao_Paulo").format('HH:mm:ss');
}

export function formatDate(date, format = 'DD/MM/YYYY') {
  return moment(date).tz("America/Sao_Paulo").format(format);
}

export function getTimestamp() {
  return Date.now();
}

export function getUnixTimestamp() {
  return Math.floor(Date.now() / 1000);
}

export function addDays(date, days) {
  return moment(date).tz("America/Sao_Paulo").add(days, 'days').toDate();
}

export function subtractDays(date, days) {
  return moment(date).tz("America/Sao_Paulo").subtract(days, 'days').toDate();
}

export function getDayOfWeek(date = new Date()) {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[moment(date).tz("America/Sao_Paulo").day()];
}

export function getMonth(date = new Date()) {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[moment(date).tz("America/Sao_Paulo").month()];
}

export function isBusinessDay(date = new Date()) {
  const day = moment(date).tz("America/Sao_Paulo").day();
  return day !== 0 && day !== 6; // 0 = Domingo, 6 = Sábado
}

export function isBusinessHours(date = new Date()) {
  const hour = moment(date).tz("America/Sao_Paulo").hour();
  return hour >= 8 && hour < 18;
}

export function getTimeAgo(date) {
  return moment(date).tz("America/Sao_Paulo").fromNow();
}

export function getTimeDifference(date1, date2, unit = 'minutes') {
  return moment(date1).diff(moment(date2), unit);
}

export function isToday(date) {
  return moment(date).tz("America/Sao_Paulo").isSame(moment().tz("America/Sao_Paulo"), 'day');
}

export function isYesterday(date) {
  const yesterday = moment().tz("America/Sao_Paulo").subtract(1, 'day');
  return moment(date).tz("America/Sao_Paulo").isSame(yesterday, 'day');
}

export function isTomorrow(date) {
  const tomorrow = moment().tz("America/Sao_Paulo").add(1, 'day');
  return moment(date).tz("America/Sao_Paulo").isSame(tomorrow, 'day');
}

export function parseDate(dateString, format = 'DD/MM/YYYY') {
  return moment(dateString, format).tz("America/Sao_Paulo").toDate();
}

export function getStartOfDay(date = new Date()) {
  return moment(date).tz("America/Sao_Paulo").startOf('day').toDate();
}

export function getEndOfDay(date = new Date()) {
  return moment(date).tz("America/Sao_Paulo").endOf('day').toDate();
}

export function getStartOfWeek(date = new Date()) {
  return moment(date).tz("America/Sao_Paulo").startOf('week').toDate();
}

export function getEndOfWeek(date = new Date()) {
  return moment(date).tz("America/Sao_Paulo").endOf('week').toDate();
}

export function getStartOfMonth(date = new Date()) {
  return moment(date).tz("America/Sao_Paulo").startOf('month').toDate();
}

export function getEndOfMonth(date = new Date()) {
  return moment(date).tz("America/Sao_Paulo").endOf('month').toDate();
}