/*
========
Testes de componente para o WidgetAcessibilidade.
Valida abertura do modal, repasse de props de limite e cliques nos botoes.
========
*/
import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import WidgetAcessibilidade from "@/globais/WidgetAcessibilidade.vue";
import { useAcessibilidade } from "@/globais/useAcessibilidade";

describe("WidgetAcessibilidade", () => {
  beforeEach(() => {
    localStorage.clear();
    useAcessibilidade().restaurarPadroes();
  });

  it("deve desabilitar o botao de aumentar ao atingir o limiteFonteMaxima passado via prop", async () => {
    const wrapper = mount(WidgetAcessibilidade, {
      props: {
        limiteFonteMinima: 90,
        limiteFonteMaxima: 110,
      },
      global: {
        // Faz stub do modal caso ele use Teleport ou dependencias externas
        stubs: {
          ModalBaseDefault: {
            template: "<div><slot /><slot name='botoes-esquerda' /></div>",
          },
        },
      },
    });

    const botoes = wrapper.findAll("button");
    const botaoAumentar = botoes.find((b) => b.text().includes("A+ Aumentar"))!;

    expect(botaoAumentar.attributes("disabled")).toBeUndefined();

    // Clica uma vez: vai de 100% para 110% (limite maximo)
    await botaoAumentar.trigger("click");

    expect(wrapper.text()).toContain("110%");
    expect(botaoAumentar.attributes("disabled")).toBeDefined();
  });
});