# Skill · Propuesta comercial

Arma una cotización o una propuesta para un cliente concreto.

**Es la skill donde más caro sale un error**, porque el entregable es un
compromiso: lo que diga se va a tener que cumplir.

---

> **Hay una herramienta que hace esto.** El cotizador del hub
> ([`cotizador/`](../../cotizador/)) ejecuta este procedimiento entero: lee
> `datos/precios.json`, separa los dos totales, arma el «qué NO incluye» solo y
> saca el PDF y el mensaje de WhatsApp. Si lo que hace falta es un documento
> para mandar, se usa esa. Esta skill es para cuando hace falta razonar la
> propuesta —qué plan, por qué, qué queda fuera— o entregarla dentro de una
> conversación.

---

## 1 · Cuándo se usa

**Se dispara con:**
- «Arma una propuesta para…»
- «¿Cuánto le cobro a un cliente que necesita…?»
- «Cotiza esto»
- «Compara los planes para este caso»

**NO se usa cuando:**
- Piden copy publicitario → [`anuncio-pagado`](../anuncio-pagado/SKILL.md)
- Solo preguntan un precio suelto → [`datos/precios.json`](../../datos/precios.json)
  y contesta con las cinco partes de la ficha (ver
  [`catalogo/README.md`](../../catalogo/README.md))

---

## 2 · Qué se lee

1. [`datos/precios.json`](../../datos/precios.json) — **primero, y literal**
2. El [`catalogo/`](../../catalogo/) de cada producto implicado
3. [`catalogo/08-fronteras.md`](../../catalogo/08-fronteras.md) — **obligatorio**
   si hay Care, Seguridad, Diagnóstico o Auditoría de por medio
4. [`catalogo/07-condiciones.md`](../../catalogo/07-condiciones.md) — cobro,
   plazos, cancelación
5. [`adn/02-voz-y-tono.md`](../../adn/02-voz-y-tono.md)
6. [`adn/06-claridad.md`](../../adn/06-claridad.md) y
   [`adn/07-redaccion.md`](../../adn/07-redaccion.md) — una propuesta es la pieza
   de decisión por excelencia: van las tres promesas de riesgo, cada una con su
   consecuencia, y la longitud la decide lo que el cliente necesita para decidir,
   no una cuota de recorte

---

## 3 · Qué se pregunta antes de empezar

1. **¿Qué necesita hacer el cliente?** No qué plan quiere — la mayoría no sabe
   cómo se llama lo que necesita.
2. **¿Tiene sitio hoy?** Cambia el producto de entrada por completo.
3. **¿Necesita editar el contenido él mismo?** Es el corte real entre Launch y
   Corporate, y lo que más caro sale prometer de más.

---

## 4 · Procedimiento

### Paso 1 · Elegir el plan por la necesidad

| Si el cliente… | Plan |
|---|---|
| Solo necesita existir en internet, ya | Start $295 |
| Paga publicidad y necesita dónde caer | Launch $450 |
| Quiere editar su contenido sin llamar a nadie | Corporate $850 |
| Quiere cobrar en línea | Commerce $1,200 |

**Si pide una capacidad avanzada**, sube el plan mínimo: reservas, portal o panel
→ Corporate. Catálogo con cobro → Commerce.

### Paso 2 · Sumar capacidades

De [`catalogo/02-capacidades.md`](../../catalogo/02-capacidades.md). Se suman al
plan, no lo sustituyen.

### Paso 3 · Separar los dos totales

**Aquí es donde se rompe una propuesta.**

```
PAGO ÚNICO          $850 Corporate + $600 reservas = $1,450
                    50% al empezar, 50% al entregar

CADA MES            $35 Care Base
                    Sin permanencia. Opcional.
```

**Nunca `$1,485`.** Y nunca proyectar el mensual a doce meses. <!-- v: contraejemplo, $1,485 es la suma prohibida -->

Si hay eBot, sus dos costos de terceros van en su propio bloque:

```
A TERCEROS          $5/mes a Cloudflare + $1–2/mes a la empresa de IA
                    No los cobra PanaClaw
```

### Paso 4 · Añadir plazo y rondas

Plazo del plan **y desde cuándo cuenta**: «desde que recibimos tu material y el
50 % del pago».

Rondas incluidas y el precio de la extra ($40).

### Paso 5 · Escribir el «qué NO incluye»

**Obligatorio, y va arriba, no en una nota al pie.** Es la firma de la marca.

Mínimo:
- Escribir los textos desde cero
- Sesión de fotos y licencias de imágenes de pago
- Posicionamiento en Google
- Mantenimiento (es Care, y es opcional)
- Panel de edición, si el plan es Start o Launch

Más lo específico del producto — cada ficha del catálogo trae su lista.

### Paso 6 · Comprobar las fronteras

Si la propuesta menciona dos o más de Care, Seguridad, Diagnóstico o Auditoría,
pasa el test de
[`catalogo/08-fronteras.md`](../../catalogo/08-fronteras.md).

### Paso 7 · Entregar

```
QUÉ NECESITAS       la situación del cliente, en sus palabras
QUÉ INCLUYE         el plan y las capacidades, en el idioma del cliente
QUÉ NO INCLUYE      la lista
PAGO ÚNICO          la cifra + cómo se cobra
CADA MES            la cifra + que es opcional y sin permanencia
A TERCEROS          si aplica
PLAZO               y desde cuándo cuenta
CAMBIOS             rondas incluidas + $40 la extra
```

---

## 5 · Verificación

- [ ] ¿Cada cifra existe en `datos/precios.json`, verificada ahora?
- [ ] ¿**Dos totales separados**, único y mensual, sin sumar?
- [ ] ¿Se proyectó algún mensual a doce meses? → quítalo
- [ ] ¿Los rangos van enteros?
- [ ] ¿Si hay eBot, están sus dos costos de terceros en su propio bloque?
- [ ] ¿Si hay un mensual de seguridad, está la Auditoría antes y aparte?
- [ ] ¿Está el «qué NO incluye», arriba y no al pie?
- [ ] ¿Se prometió panel de edición en Start o Launch? → no lo llevan
- [ ] ¿Se prometió posicionamiento en Google?
- [ ] ¿El plazo dice desde cuándo cuenta?
- [ ] ¿Están las rondas y el precio de la extra?
- [ ] ¿Se ofreció un descuento? → el único que existe es Care anual
- [ ] ¿Jerga?
- [ ] ¿Pasa el test de fronteras?

---

## Qué se dice al entregar

1. Qué plan se eligió **y por qué** — la necesidad que lo decidió
2. **Qué queda fuera** y qué se cotizaría aparte
3. Si el caso no encaja en ningún plan: dilo. «Nunca vamos a meterte en un plan
   que no te sirve solo porque exista» es política publicada de la marca.
