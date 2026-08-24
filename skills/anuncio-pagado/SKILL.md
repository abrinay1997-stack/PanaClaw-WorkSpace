# Skill · Anuncio pagado

Produce copy y especificación de piezas de pauta.

---

## 1 · Cuándo se usa

**Se dispara con:**
- «Anuncios para Meta / Instagram / Facebook»
- «Copy para pauta»
- «Necesito variantes para probar»
- «Una campaña de Google»

**NO se usa cuando:**
- Piden la campaña entera con su embudo → [`campanas/README.md`](../../campanas/README.md) primero
- Piden solo la imagen → [`lote-visual`](../lote-visual/SKILL.md)
- Piden contenido orgánico → [`prompts/texto/organico.md`](../../prompts/texto/organico.md)
- Piden una cotización para un cliente → [`propuesta-comercial`](../propuesta-comercial/SKILL.md)

---

## 2 · Qué se lee

1. [`adn/02-voz-y-tono.md`](../../adn/02-voz-y-tono.md)
2. [`adn/06-claridad.md`](../../adn/06-claridad.md) — la altura del gancho, la
   regla de que todo «no» viene con su «sí», y la prueba del rótulo
3. [`adn/07-redaccion.md`](../../adn/07-redaccion.md) — **el oficio**: las seis
   palancas, la prueba, las cinco formas de gancho, el ritmo y el cierre
4. [`adn/04-audiencia.md`](../../adn/04-audiencia.md) — los ganchos y las
   objeciones salen de aquí
5. [`datos/precios.json`](../../datos/precios.json) — **literal**, no de memoria
6. El [`catalogo/`](../../catalogo/) del producto que se anuncia
7. [`campanas/plantillas/estructura-anuncio.md`](../../campanas/plantillas/estructura-anuncio.md)
8. [`campanas/canales/`](../../campanas/canales/) — el del canal
9. [`prompts/texto/anuncios.md`](../../prompts/texto/anuncios.md)
10. **Si el creativo se compone con Meta AI** (imagen + texto ya montados, no
    solo copy para pegar en el editor del canal):
    [`prompts/plataformas/meta-ai.md`](../../prompts/plataformas/meta-ai.md) y
    [`prompts/imagen/texto-en-imagen.md`](../../prompts/imagen/texto-en-imagen.md).
    El símbolo va como el SVG/Path2D **literal** de esos archivos —nunca
    descrito para que Meta AI lo redibuje— y la holgura de interlínea se
    calcula para cada par de líneas del titular, sin saltarse ninguna. Las
    dos son reglas inquebrantables, iguales para un post orgánico y para un
    creativo de pauta.

---

## 3 · Qué se pregunta antes de empezar

1. **¿Qué producto?** Hay seis con seis precios y seis públicos.
2. **¿Etapa: frío, tibio o remarketing?** Cambia qué se dice por completo.
3. **¿A dónde cae el clic?** `/planes/`, `/cotizador/`, `/ebot/`, `/seguridad/`
   o WhatsApp.

**Por defecto**, si dicen «lo que veas»:
- Canal: Meta (es el único con medición activa)
- Etapa: frío
- Producto: Start $295 o Diagnóstico $49 — las dos cifras que funcionan en frío
- Objetivo: **conversaciones de WhatsApp**, no `Lead` del sitio. El porqué está
  en [`campanas/canales/meta.md`](../../campanas/canales/meta.md)
- Destino: WhatsApp en frío, `/planes/` cuando el destino sea el sitio
- **De 8 a 12 conceptos distintos**, en una campaña y un conjunto

---

## 4 · Procedimiento

### Paso 1 · Fijar público y ángulo

Un público de los seis. **Un solo ángulo**: precio, propiedad, plazo o velocidad.

### Paso 2 · Sacar el gancho

De la columna «situación» del público en
[`adn/04-audiencia.md`](../../adn/04-audiencia.md). Segunda persona, presente,
afirmativo. Sin nombrar la marca.

### Paso 3 · Verificar el precio

Abre [`datos/precios.json`](../../datos/precios.json) y **cópialo**. No de
memoria.

Comprueba: ¿es un rango? → entero o con «desde». ¿Hay una mensualidad de por
medio? → dos totales separados, nunca sumados.

### Paso 4 · Escribir las cuatro partes

`gancho → giro → cifra → límite`. Las cuatro.

**Y se escriben con el método de [`adn/07-redaccion.md`](../../adn/07-redaccion.md) §7:**
la oferta en una frase llana primero, diez ganchos de los que sobrevive uno, el
cuerpo largo y feo sin editar, borrar el 30 %, leerlo en voz alta. Las listas de
comprobación van al final; comprobar mientras se escribe produce texto correcto
y muerto.

El **límite** es el que hace que suene a esta marca: «el reloj arranca cuando nos
das tus textos y la mitad del pago», «los $5 de la nube se pagan aparte, no a
nosotros».

### Paso 5 · Comprobar los límites del canal

Meta: gancho y cifra dentro de los **primeros 125 caracteres**.
Google: títulos de **30 caracteres, contados**.

### Paso 6 · Conceptos

**Una hipótesis por concepto**, y de 8 a 12 conceptos. Doce redacciones del mismo
mensaje no son doce conceptos: son uno repetido doce veces, y la plataforma los
agrupa y los hace competir entre sí en vez de ampliar el alcance.

Lo que se varía entre conceptos —dolor, ángulo, escena madre y formato— y lo que
no se varía nunca —el bloque de estilo, la paleta, las dos familias— está en
[`campanas/canales/meta.md`](../../campanas/canales/meta.md).

### Paso 7 · Entregar

Tabla: concepto · hipótesis · gancho · cuerpo · llamada a la acción · destino ·
formato.

Y arriba, la estructura de campaña: objetivo, público, presupuesto diario y qué
automatizaciones van activadas. Sin eso es copy suelto, no una campaña.

---

## 5 · Verificación

- [ ] ¿Las cuatro partes, incluido el **límite**?
- [ ] ¿El gancho es una situación en 2ª persona y presente, sin nombrar la marca?
- [ ] ¿Cada cifra existe en `datos/precios.json`, verificada ahora?
- [ ] ¿Los rangos, enteros o con «desde»?
- [ ] ¿Algún pago único sumado a una mensualidad?
- [ ] ¿Si es eBot, están los dos costos de terceros?
- [ ] ¿Si es un mensual de seguridad, dice que la Auditoría va antes y aparte?
- [ ] ¿Emojis, exclamaciones, urgencia o descuentos inventados?
- [ ] ¿Se promete posicionamiento en Google?
- [ ] ¿Algún testimonio, métrica o número de clientes?
- [ ] ¿Una sola llamada a la acción?
- [ ] ¿El CTA de WhatsApp va sin número?
- [ ] ¿Cabe en el límite del canal, contado?
- [ ] ¿Cada concepto prueba una hipótesis distinta?
- [ ] ¿Son de 8 a 12 conceptos, en una campaña y un conjunto?
- [ ] ¿El titular de cada anuncio está a la altura de la consecuencia, y cada
      «no» lleva su «sí»? → [`adn/06-claridad.md`](../../adn/06-claridad.md)
- [ ] ¿Pasa la prueba del rótulo? Tapa la marca y la cifra: ¿se sabe qué se
      vende sin deducirlo?
- [ ] ¿Pasa la prueba del descarte? Si el gancho valdría para otra agencia de
      Panamá, es un rótulo → [`adn/07-redaccion.md`](../../adn/07-redaccion.md)
- [ ] ¿Más de una palanca **añadida** sobre las cuatro partes? Las cuatro partes
      ya son cuatro palancas y no cuentan: `07-redaccion.md` §2
- [ ] ¿Cada afirmación fuerte lleva su prueba a menos de una frase? → `07` §3
- [ ] ¿La pieza de decisión lleva las tres promesas de riesgo, cada una con su
      consecuencia? → `07` §2
- [ ] ¿Va declarado el contenido generado con IA? Los fondos de esta marca los
      genera un generador de imagen, y no declararlo tumba el anuncio
- [ ] ¿Están desactivadas las mejoras automáticas de creativo?

---

## Qué se dice al entregar

1. Producto, público, etapa, canal y objetivo
2. **Qué hipótesis prueba cada concepto**
3. Si aplica: que no hay cadena de producción de vídeo, o que Google no se puede
   medir todavía (falta GA4). Ver
   [`operacion/deuda-conocida.md`](../../operacion/deuda-conocida.md)
