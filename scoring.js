/**
 * HEAVEN CHECK — Motor de clasificación y personalización
 * ---------------------------------------------------------
 * Traduce las respuestas del cuestionario a:
 *   1) Un puntaje en 4 ejes: Integración (I), Automatización (A),
 *      Visibilidad (V) y Complejidad (C, informativo — nunca penaliza).
 *   2) Un resultado final (A: Preparada para escalar / B: Oportunidad de
 *      integración / C: Oportunidad de mayor control), respetando la
 *      jerarquía de desempate: Control > Integración > Preparada.
 *   3) Hasta 3 "oportunidades" personalizadas, tomadas de la tabla de
 *      mapeo del brief, según qué respuestas puntuales dispararon flags.
 *
 * Los puntos y umbrales son un primer modelo razonable a partir de la
 * lógica cualitativa del documento: quedan aislados acá arriba para que
 * se puedan calibrar fácil después de probar con respuestas reales.
 */

// ---- Preguntas y efectos por opción -------------------------------------

const QUESTIONS = [
  {
    id: "q1_canales",
    type: "multi",
    text: "¿Por qué canales vendés actualmente?",
    hint: "Podés seleccionar más de una opción.",
    options: [
      { value: "local", label: "Local físico", emoji: "🏬" },
      { value: "meli", label: "Mercado Libre", emoji: "🛒" },
      { value: "tienda_online", label: "Tienda online", emoji: "💻" },
      { value: "redes", label: "Redes sociales", emoji: "📱" },
      { value: "otros_marketplaces", label: "Otros marketplaces", emoji: "🌐" },
      { value: "otro", label: "Otro", emoji: "✏️", allowText: true },
    ],
  },
  {
    id: "q2_stock",
    type: "single",
    text: "¿Dónde gestionás actualmente tu stock?",
    options: [
      { value: "unico_sistema", label: "En un único sistema", effects: { I: 2 } },
      { value: "sistemas_por_canal", label: "En diferentes sistemas según el canal", effects: { I: -1, C: 1 }, flags: ["sistemas_distintos"] },
      { value: "planillas", label: "En planillas", effects: { A: -1, V: -1 }, flags: ["stock_manual"] },
      { value: "manual", label: "De forma manual", effects: { A: -2, V: -1 }, flags: ["stock_manual"] },
      { value: "sin_control", label: "No llevo un control centralizado del stock", effects: { A: -2, V: -2 }, flags: ["stock_manual", "sin_visibilidad"] },
    ],
  },
  {
    id: "q3_sync_stock",
    type: "single",
    text: "Cuando realizás una venta, ¿el stock se actualiza automáticamente en todos tus canales?",
    options: [
      { value: "si_todos", label: "Sí, en todos", effects: { A: 2 } },
      { value: "algunos", label: "Solo en algunos", effects: { A: 0, I: -1 }, flags: ["sync_parcial"] },
      { value: "manual", label: "No, tengo que actualizarlo manualmente", effects: { A: -2 }, flags: ["stock_manual"] },
      { value: "no_aplica", label: "No aplica / vendo por un solo canal", effects: {} },
    ],
  },
  {
    id: "q4_facturacion",
    type: "single",
    text: "¿Cómo gestionás actualmente la facturación?",
    options: [
      { value: "manual_arca", label: "Manualmente desde ARCA", effects: { A: -2, I: -1 }, flags: ["factura_manual"] },
      { value: "software", label: "Con un software de facturación", effects: { A: 1 } },
      { value: "gestion", label: "Con un sistema de gestión", effects: { I: 2, A: 2 } },
      { value: "por_canal", label: "Utilizo diferentes herramientas según el canal", effects: { I: -1, C: 1 }, flags: ["sistemas_distintos"] },
      { value: "sin_proceso", label: "No tengo un proceso definido", effects: { V: -2, A: -2 }, flags: ["factura_manual", "sin_visibilidad"] },
    ],
  },
  {
    id: "q5_recursos",
    type: "single",
    text: "¿Cuántos recursos destinás hoy a tareas administrativas y de gestión?",
    options: [
      { value: "pocas_horas", label: "Menos de una persona / algunas horas por semana", effects: { A: 1 } },
      { value: "una_persona", label: "Una persona full time", effects: {} },
      { value: "mas_una", label: "Más de una persona", effects: { C: 1, A: -1 }, flags: ["equipo_admin"] },
      { value: "equipo", label: "Tenemos un equipo administrativo", effects: { C: 2, A: -1 }, flags: ["equipo_admin"] },
      { value: "no_identificado", label: "No tengo identificado cuánto tiempo o recursos destinamos", effects: { V: -2 }, flags: ["sin_visibilidad"] },
    ],
  },
  {
    id: "q6_crecimiento",
    type: "single",
    text: "¿Cómo describirías hoy el crecimiento de tu negocio?",
    options: [
      { value: "crece_rentable", label: "Mis ventas y mi rentabilidad están creciendo", effects: { V: 2 } },
      { value: "vende_mas_no_rentable", label: "Vendo más, pero mi rentabilidad no crece al mismo ritmo", effects: { V: -1 }, flags: ["vende_mas_no_gana"] },
      { value: "estables", label: "Mis ventas se mantienen relativamente estables", effects: {} },
      { value: "sin_info", label: "Hoy no tengo información suficiente para saber con precisión cuánto estoy ganando", effects: { V: -2 }, flags: ["sin_visibilidad", "vende_mas_no_gana"] },
    ],
  },
  {
    id: "q7_costo_real",
    type: "single",
    text: "¿Qué nivel de visibilidad tenés sobre el costo real de tu operación?",
    hint: "Considerando impuestos, costos de reposición, comisiones, gastos operativos y capital inmovilizado en stock.",
    options: [
      { value: "identificados", label: "Tengo estos costos identificados y actualizados", effects: { V: 2 } },
      { value: "algunos", label: "Conozco algunos, pero no tengo una visión completa", effects: { V: 0 } },
      { value: "manual", label: "Los calculo de forma manual cuando los necesito", effects: { V: -1, A: -1 }, flags: ["costo_no_centralizado"] },
      { value: "no_centralizada", label: "No tengo hoy esa información centralizada", effects: { V: -2 }, flags: ["costo_no_centralizado"] },
      { value: "no_sabria", label: "No sabría decir cuál es el costo total de mi operación", effects: { V: -3 }, flags: ["costo_no_centralizado", "sin_visibilidad"] },
    ],
  },
  {
    id: "q8_cuentas_meli",
    type: "single",
    text: "¿Cuántas cuentas de Mercado Libre administra tu negocio?",
    options: [
      { value: "ninguna", label: "No vendemos por Mercado Libre", emoji: "➖", effects: {} },
      { value: "una", label: "1 cuenta", emoji: "🏷️", effects: {} },
      { value: "dos", label: "2 cuentas", emoji: "🏷️", effects: { C: 1 }, triggersFollowUp: true },
      { value: "tres_mas", label: "3 o más cuentas", emoji: "🏷️", effects: { C: 2 }, triggersFollowUp: true },
    ],
  },
  {
    id: "q8b_gestion_cuentas",
    type: "single",
    text: "¿Cómo gestionás actualmente esas cuentas?",
    conditionalOn: { question: "q8_cuentas_meli", values: ["dos", "tres_mas"] },
    options: [
      { value: "unico_sistema", label: "Desde un único sistema", effects: { I: 2 } },
      { value: "por_separado", label: "Ingresando y gestionando cada cuenta por separado", effects: { I: -2, A: -1 }, flags: ["meli_desconectado"] },
      { value: "distintas_herramientas", label: "Con diferentes herramientas", effects: { I: -1 }, flags: ["meli_desconectado"] },
      { value: "otra", label: "De otra manera", effects: { I: -1 } },
    ],
  },
];

// ---- Tabla de oportunidades (según flags disparados) ---------------------
// Orden = prioridad cuando hay más de 3 candidatas.

const OPPORTUNITY_MAP = [
  { flag: "sin_visibilidad", emoji: "🔍", text: "Centralizar información para tener mayor claridad sobre el desempeño del negocio." },
  { flag: "costo_no_centralizado", emoji: "💰", text: "Obtener mayor visibilidad sobre los costos que impactan en la operación." },
  { flag: "stock_manual", emoji: "📦", text: "Sincronizar el stock entre tus canales de venta." },
  { flag: "factura_manual", emoji: "🧾", text: "Integrar la facturación a la gestión diaria de tus ventas." },
  { flag: "sync_parcial", emoji: "🔄", text: "Automatizar la actualización de stock entre canales." },
  { flag: "meli_desconectado", emoji: "🏷️", text: "Centralizar la gestión de tus cuentas de Mercado Libre." },
  { flag: "sistemas_distintos", emoji: "🧩", text: "Centralizar herramientas y procesos en un mismo entorno." },
  { flag: "equipo_admin", emoji: "👥", text: "Reducir tareas administrativas repetitivas mediante automatización." },
  { flag: "vende_mas_no_gana", emoji: "📈", text: "Ganar mayor visibilidad sobre la relación entre ventas, costos y rentabilidad." },
];

const OPPORTUNITY_MULTICANAL_AUTOMATIZADO = {
  emoji: "🚀",
  text: "Seguir escalando una operación multicanal manteniendo el control.",
};

// ---- Resultados -----------------------------------------------------------

const OUTCOMES = {
  preparada: {
    id: "preparada",
    nombre: "Gestión preparada para escalar",
    emoji: "🚀",
    diagnostico:
      "Tu negocio ya tiene una base de gestión sólida: buena centralización, automatización y visibilidad, incluso manejando una operación con varios frentes. Heaven puede ayudarte a integrar aún más lo que ya funciona y acompañar la próxima etapa de escala.",
  },
  integracion: {
    id: "integracion",
    nombre: "Oportunidad de integración",
    emoji: "🔗",
    diagnostico:
      "Tu negocio tiene herramientas y procesos funcionando, pero algunos corren por separado. No es que falte gestión: hay una oportunidad concreta de conectar mejor lo que hoy ya está en marcha.",
  },
  control: {
    id: "control",
    nombre: "Oportunidad de mayor control",
    emoji: "🧭",
    diagnostico:
      "Antes de sumar más canales o herramientas, hay una oportunidad clara de ganar información, orden y control sobre la operación actual — la base que sostiene cualquier crecimiento posterior.",
  },
};

// ---- Cálculo ---------------------------------------------------------------

function scoreAnswers(answers) {
  const totals = { I: 0, A: 0, V: 0, C: 0 };
  const flags = new Set();
  let channelCount = 0;
  let hasGoodAutomation = false;

  for (const q of QUESTIONS) {
    const answer = answers[q.id];
    if (answer === undefined || answer === null) continue;

    if (q.id === "q1_canales" && Array.isArray(answer)) {
      channelCount = answer.length;
      if (channelCount > 1) totals.C += channelCount - 1;
      continue;
    }

    const opt = q.options.find((o) => o.value === answer);
    if (!opt) continue;
    if (opt.effects) {
      for (const k of Object.keys(opt.effects)) totals[k] += opt.effects[k];
    }
    if (opt.flags) opt.flags.forEach((f) => flags.add(f));
  }

  if (answers.q3_sync_stock === "si_todos" && channelCount > 2) {
    hasGoodAutomation = true;
  }

  // --- Clasificación con jerarquía: Control > Integración > Preparada ---
  let outcomeId;
  if (totals.V <= -3 || totals.A <= -4) {
    outcomeId = "control";
  } else if (totals.I <= 1 || totals.A <= -1 || flags.has("sistemas_distintos") || flags.has("meli_desconectado") || flags.has("sync_parcial")) {
    outcomeId = "integracion";
  } else {
    outcomeId = "preparada";
  }

  // --- Oportunidades personalizadas (hasta 3, priorizadas por orden del mapa) ---
  let opportunities = OPPORTUNITY_MAP.filter((o) => flags.has(o.flag)).map((o) => ({ text: o.text, emoji: o.emoji }));
  // dedupe conservando orden (por texto)
  const seen = new Set();
  opportunities = opportunities.filter((o) => (seen.has(o.text) ? false : (seen.add(o.text), true)));

  if (opportunities.length === 0 && hasGoodAutomation) {
    opportunities.push(OPPORTUNITY_MULTICANAL_AUTOMATIZADO);
  }
  opportunities = opportunities.slice(0, 3);

  // Si el resultado es "preparada" y hay poco para mostrar, sumamos el mensaje de escala
  if (outcomeId === "preparada" && opportunities.length < 3 && hasGoodAutomation) {
    if (!opportunities.some((o) => o.text === OPPORTUNITY_MULTICANAL_AUTOMATIZADO.text)) {
      opportunities.push(OPPORTUNITY_MULTICANAL_AUTOMATIZADO);
    }
    opportunities = opportunities.slice(0, 3);
  }

  return {
    totals,
    flags: [...flags],
    outcome: OUTCOMES[outcomeId],
    opportunities,
  };
}

if (typeof module !== "undefined") {
  module.exports = { QUESTIONS, OUTCOMES, OPPORTUNITY_MAP, scoreAnswers };
}
