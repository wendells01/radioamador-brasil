// Teste opcional com Playwright disponível no ambiente e site já servido.
// BASE_URL e CHROMIUM_EXECUTABLE permitem usar o servidor/navegador local.
import assert from 'node:assert/strict';
import {chromium, webkit} from 'playwright';
const base = process.env.BASE_URL || 'http://127.0.0.1:18787';
for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]]) {
  const browser = await engine.launch({headless: true, ...(name === 'Chromium' && process.env.CHROMIUM_EXECUTABLE ? {executablePath: process.env.CHROMIUM_EXECUTABLE} : {})});
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Insere medidores no grafo real; osciladores e ganho continuam nativos.
    await page.addInitScript(() => {
      window.morseAudioProbe = {contexts: [], peak: 0};
      const NativeContext = window.AudioContext || window.webkitAudioContext;
      window.AudioContext = class extends NativeContext {
        constructor(...args) {
          super(...args);
          window.morseAudioProbe.contexts.push(this);
        }
        createGain() {
          const gain = super.createGain();
          const connect = gain.connect.bind(gain);
          gain.connect = destination => {
            if (destination !== this.destination) return connect(destination);
            const analyser = this.createAnalyser();
            analyser.fftSize = 256;
            const data = new Float32Array(analyser.fftSize);
            connect(analyser);
            analyser.connect(destination);
            const end = performance.now() + 1200;
            const sample = () => {
              analyser.getFloatTimeDomainData(data);
              for (const value of data) window.morseAudioProbe.peak = Math.max(window.morseAudioProbe.peak, Math.abs(value));
              if (performance.now() < end) requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
            return destination;
          };
          return gain;
        }
      };
    });
    await page.goto(`${base}/ferramentas/morse.html`);
    await page.waitForLoadState('networkidle');
    assert.equal(await page.evaluate(() => window.morseAudioProbe.contexts.length), 0, 'sem áudio automático');
    await page.locator('#morse-input').fill('TT');
    await page.locator('#morse-play').tap();
    await page.waitForFunction(() => window.morseAudioProbe.peak > .01);
    assert.match(await page.locator('#morse-status').innerText(), /Reproduzindo/);
    await page.waitForSelector('.rhythm-beat--tone.is-active');
    const peak = await page.evaluate(() => window.morseAudioProbe.peak);
    assert.ok(peak <= .121, `pico limitado: ${peak}`);
    await page.locator('#morse-stop').tap();
    assert.equal(await page.locator('#morse-status').innerText(), 'Parado');
    assert.equal(await page.locator('.rhythm-beat.is-active').count(),0);
    // Retomada de um contexto realmente suspenso, sem substituí-lo por fake.
    await page.evaluate(() => window.morseAudioProbe.contexts[0].suspend());
    assert.equal(await page.evaluate(() => window.morseAudioProbe.contexts[0].state), 'suspended');
    await page.evaluate(() => {window.morseAudioProbe.peak = 0;});
    await page.locator('#morse-play').tap();
    await page.waitForFunction(() => window.morseAudioProbe.peak > .01);
    assert.equal(await page.evaluate(() => window.morseAudioProbe.contexts[0].state), 'running');
    await page.locator('#morse-stop').tap();
    await page.evaluate(() => {window.morseAudioProbe.peak = 0;});
    await page.locator('#ex-hear').tap();
    assert.equal(await page.locator('.rhythm-beat.is-active').count(),0,'exercício não revela o caractere na ilustração');
    await page.waitForFunction(() => window.morseAudioProbe.peak > .01);
    await page.locator('#morse-stop').tap();
    await page.locator('#morse-input').fill('E');
    await page.locator('#morse-wpm').fill('30');
    await page.locator('#morse-play').tap();
    await page.waitForFunction(() => document.getElementById('morse-status').textContent === 'Parado');
    assert.deepEqual(errors, []);
    console.log(`${name}: sinal real medido (pico ${peak.toFixed(3)}), Reproduzir/Ouvir/Parar, retomada e término OK.`);
    await page.close();
  } finally {
    await browser.close();
  }
}
