/*
========
Responsável por mesclar as propriedades recebidas pelo componente VDataTable com a configuração global da aplicação.
========
*/
import { computed, inject, getCurrentInstance } from 'vue';
import { DATA_TABLE_CONFIG } from '@/DatatableVue/config/datatableConfig';
import type { VDataTableProps, DataTablePropsWithDefaults } from '../types/v-data-table';
import { defaultDataTableConfig } from '@/DatatableVue/config/datatableDefaults';
/*
Função que gera as opções finais da tabela.
Recebe: As propriedades (props) originais do componente.
Devolve: Um objeto reativo (computed) com todas as propriedades mescladas com os valores globais.
Por que é usada: Limpa o componente principal, isolando a lógica de fallback de configurações e facilitando a manutenção de novas propriedades.
*/
export function useDataTableConfig(props: VDataTableProps) {
    const globalConfig = inject(DATA_TABLE_CONFIG, {});
    /* Instância interna para acesso ao Virtual DOM e leitura crua dos atributos */
    const instance = getCurrentInstance();
    const options = computed<DataTablePropsWithDefaults>(() => {
        const rawProps = instance?.vnode.props || {};
        const propsPassadas = Object.keys(props).reduce((acc, key) => {
            const kebabKey = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
            const snakeToKebab = key.replace(/_/g, '-');
            
            if (key in rawProps || kebabKey in rawProps || snakeToKebab in rawProps) {
                acc[key] = props[key as keyof VDataTableProps];
            }
            return acc;
        }, {} as Record<string, any>);

        // 2. O Merge Dinâmico!
        // A ordem importa! O que vem por último sobrescreve o anterior. 
        // (Prop > Global > Default) 
        return {
            ...defaultDataTableConfig,       // 1º Camada: Prioridade Mínima (Valores Padrão)
            ...globalConfig,                 // 2º Camada: Prioridade Média (Valores Globais definidos por quem usa o plugin)
            ...propsPassadas      // 3º Camada: Prioridade Máxima (O que o dev digitou na tela)
        } as DataTablePropsWithDefaults; 
    });

    return { options };
}