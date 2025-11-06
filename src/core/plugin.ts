import type { App } from 'vue';
/*esse é o plugin que vai configurar as partes excenciais de todas as aplicações
* do sistec
*
* Observações:
* import de tabler-themes deve ser feito depois do tabler.min.css ou não funcionará
* 
* até o momento as funções são
* - importar o css e js do tabler
* - disponibilizar o tabler globalmente como window.bootstrap 
* (as novas versões do tabler não incluem mais o bootstrap, então isso foi necessário)
* 
* - futuras funções podem ser adicionadas aqui
* - como adicionar componentes globais
* - adicionar diretivas globais
* - adicionar filtros globais
* - adicionar mixins globais
* - adicionar propriedades globais
* 
* para usar o plugin, basta fazer app.use(SistecPlugin) na aplicação vue
*/

// Configurações do Tabler
import '@tabler/core/dist/css/tabler.min.css';
import '@tabler/core/dist/css/tabler-themes.min.css'
import * as Tabler from '@tabler/core/dist/js/tabler.min.js';
import vRequired from "v-required"
import '../assets/v-required-style.css'

const SistecPlugin = {
  // até o momento não usamos opções nem o app, mas deixei aqui caso precise no futuro
  install: (app: App, _options?: any) => {
    // Disponibiliza o Tabler globalmente
    (window as any).bootstrap = Tabler;

    // futuros upgrades podem ser feitos aqui
    // Ex: app.component('MeuComponente', MeuComponente);
    app.directive('required', vRequired);
  }
};
export { SistecPlugin };