/*
========
Testes unitarios para o composable useAcessibilidade.
Verifica limites de fonte, persistencia no localStorage e alternancia de filtros.
========
*/
import { describe, it, expect, beforeEach } from "vitest";
import { useAcessibilidade } from "@/globais/useAcessibilidade";

describe("useAcessibilidade", () => {
  beforeEach(() => {
    localStorage.clear();
    const { restaurarPadroes } = useAcessibilidade();
    restaurarPadroes();
  });

  it("deve assumir os limites padrao de 80 a 140 quando nao informados", () => {
    const { 
      percentualFonte, 
      diminuirFonte, 
      aumentarFonte, 
      podeDiminuir, 
      podeAumentar 
    } = useAcessibilidade();

    expect(percentualFonte.value).toBe(100);

    // Tenta diminuir alem de 80
    diminuirFonte(); // 90
    diminuirFonte(); // 80
    diminuirFonte(); // deve travar em 80
    expect(percentualFonte.value).toBe(80);
    expect(podeDiminuir.value).toBe(false);

    // Restaura e tenta aumentar alem de 140
    while (podeAumentar.value) {
      aumentarFonte();
    }
    aumentarFonte(); // deve travar em 140
    expect(percentualFonte.value).toBe(140);
    expect(podeAumentar.value).toBe(false);
  });

  it("deve respeitar limites personalizados quando passados por parametro", () => {
    const { percentualFonte, aumentarFonte, podeAumentar } = useAcessibilidade(90, 110);

    aumentarFonte(); // 110
    expect(percentualFonte.value).toBe(110);
    expect(podeAumentar.value).toBe(false);

    aumentarFonte(); // nao deve passar de 110
    expect(percentualFonte.value).toBe(110);
  });

  it("deve aplicar atributo de alto contraste no html e salvar no localStorage", () => {
    const { alternarAltoContraste, altoContraste } = useAcessibilidade();

    alternarAltoContraste();

    expect(altoContraste.value).toBe(true);
    expect(document.documentElement.getAttribute("data-acessibilidade-contraste")).toBe("alto");

    const salvo = JSON.parse(localStorage.getItem("sistec_acessibilidade") || "{}");
    expect(salvo.altoContraste).toBe(true);
  });

  it("deve aumentar e diminuir com base no incremento de fonte passado por parametro", () => {
    const { percentualFonte, aumentarFonte, diminuirFonte } = useAcessibilidade(80, 120, 5);

    expect(percentualFonte.value).toBe(100);

    aumentarFonte(); // 105
    expect(percentualFonte.value).toBe(105);

    diminuirFonte(); // 100
    expect(percentualFonte.value).toBe(100);
  });
});