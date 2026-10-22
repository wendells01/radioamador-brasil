// Referência rápida: dados editoriais + filtro local.
// Funções puras primeiro; binding de DOM só roda no navegador.

export function normalize(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matches(query, ...fields) {
  const q = normalize(query);
  if (!q) return true;
  return fields.some((field) => normalize(field).includes(q));
}

// groups: { nome: [linha, ...] } -> cópia filtrada no mesmo formato.
export function filterGroups(groups, query) {
  const out = {};
  for (const [name, rows] of Object.entries(groups)) {
    out[name] = rows.filter((row) => matches(query, ...Object.values(row)));
  }
  return out;
}

export const DATA = {
  alphabet: [
    { letra: "A", palavra: "Alfa" },
    { letra: "B", palavra: "Bravo" },
    { letra: "C", palavra: "Charlie" },
    { letra: "D", palavra: "Delta" },
    { letra: "E", palavra: "Echo" },
    { letra: "F", palavra: "Foxtrot" },
    { letra: "G", palavra: "Golf" },
    { letra: "H", palavra: "Hotel" },
    { letra: "I", palavra: "India" },
    { letra: "J", palavra: "Juliett" },
    { letra: "K", palavra: "Kilo" },
    { letra: "L", palavra: "Lima" },
    { letra: "M", palavra: "Mike" },
    { letra: "N", palavra: "November" },
    { letra: "O", palavra: "Oscar" },
    { letra: "P", palavra: "Papa" },
    { letra: "Q", palavra: "Quebec" },
    { letra: "R", palavra: "Romeo" },
    { letra: "S", palavra: "Sierra" },
    { letra: "T", palavra: "Tango" },
    { letra: "U", palavra: "Uniform" },
    { letra: "V", palavra: "Victor" },
    { letra: "W", palavra: "Whiskey" },
    { letra: "X", palavra: "X-ray" },
    { letra: "Y", palavra: "Yankee" },
    { letra: "Z", palavra: "Zulu" },
  ],
  qcodes: [
    { codigo: "QRA", significado: "nome da estação" },
    { codigo: "QRG", significado: "frequência exata" },
    { codigo: "QRL", significado: "ocupado" },
    { codigo: "QRM", significado: "interferência de outras emissões" },
    { codigo: "QRN", significado: "ruído atmosférico" },
    { codigo: "QRO", significado: "aumentar potência" },
    { codigo: "QRP", significado: "reduzir potência" },
    { codigo: "QRQ", significado: "transmitir mais rápido" },
    { codigo: "QRS", significado: "transmitir mais devagar" },
    { codigo: "QRT", significado: "cessar transmissão" },
    { codigo: "QRV", significado: "pronto" },
    { codigo: "QRX", significado: "aguardar / horário para nova chamada" },
    { codigo: "QRZ", significado: "quem está chamando" },
    { codigo: "QSB", significado: "variação de intensidade do sinal" },
    { codigo: "QSL", significado: "confirmação de recebimento" },
    { codigo: "QSO", significado: "comunicação / contato entre estações" },
    { codigo: "QSY", significado: "mudança de frequência" },
    { codigo: "QTH", significado: "localização" },
  ],
  terms: [
    { termo: "indicativo", definicao: "código que identifica uma estação de radioamador, como PY1ABC." },
    { termo: "QSO", definicao: "comunicação ou contato entre duas estações." },
    { termo: "QSL", definicao: "confirmação de recebimento; também o cartão que confirma um contato." },
    { termo: "DX", definicao: "contato com estação distante, normalmente em outro país." },
    { termo: "simplex", definicao: "transmissão e recepção na mesma frequência." },
    { termo: "duplex", definicao: "transmissão e recepção em frequências diferentes, em par de frequências." },
    { termo: "repetidora", definicao: "estação que recebe e retransmite sinais, ampliando o alcance das estações." },
    { termo: "offset", definicao: "diferença entre as frequências de transmissão e recepção, usada com repetidoras." },
    { termo: "CTCSS", definicao: "tom subaudível de acesso: abre o squelch de quem usa o mesmo tom. Não é privacidade nem criptografia." },
    { termo: "DCS", definicao: "código digital de acesso, equivalente digital do CTCSS. Não é privacidade nem criptografia." },
    { termo: "ROE/SWR", definicao: "relação de onda estacionária; indica o casamento entre antena e linha de transmissão." },
    { termo: "HF", definicao: "alta frequência; faixa de 3 a 30 MHz." },
    { termo: "VHF", definicao: "muito alta frequência; faixa de 30 a 300 MHz." },
    { termo: "UHF", definicao: "ultralta frequência; faixa de 300 a 3000 MHz." },
    { termo: "COER", definicao: "Certificado de Operador de Estação de Radioamador, certificado do radioamador no Brasil." },
  ],
};

if (typeof document !== "undefined") {
  const input = document.querySelector(".ref-search__input");
  const status = document.querySelector(".ref-search__status");
  const empty = document.querySelector(".ref-empty");

  if (input) {
    const groups = Array.from(document.querySelectorAll(".ref-group"));

    input.addEventListener("input", () => {
      const query = input.value;
      let visible = 0;

      for (const group of groups) {
        for (const row of group.querySelectorAll(".ref-table tbody tr")) {
          const show = matches(query, ...Array.from(row.cells).map((cell) => cell.textContent));
          row.hidden = !show;
          if (show) visible += 1;
        }
      }

      if (empty) empty.hidden = visible > 0;
      if (status) {
        status.textContent = normalize(query)
          ? `${visible} resultado${visible === 1 ? "" : "s"} para a busca.`
          : "";
      }
    });
  }
}
