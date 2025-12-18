# [1.15.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.14.0...v1.15.0) (2025-12-11)


### Features

* add disable_request prop to VDataPage and update type definition ([412d55c](https://github.com/marlon-bento/v-sistec-features/commit/412d55c804e8dbee13df754fc294673a0cf0b664))

# [1.14.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.13.0...v1.14.0) (2025-12-11)


### Features

* update v-api-fetch dependency to version 1.6.0 and bump package version to 1.13.0 ([a95d2b3](https://github.com/marlon-bento/v-sistec-features/commit/a95d2b36024aeada2de6ae55264396d9514c4ee2))

# [1.13.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.12.0...v1.13.0) (2025-12-11)


### Features

* update version to 1.12.0 and add disable_request prop to VDataTable ([5b3c1f5](https://github.com/marlon-bento/v-sistec-features/commit/5b3c1f5968d70aac791fd6b9e625535535403cf0))

# [1.12.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.11.0...v1.12.0) (2025-12-09)


### Features

* a partir de agora é possível estilizar a linha em baixo do item que pode ser expandida por botão utilizando a classe expanded-item-row ([85056db](https://github.com/marlon-bento/v-sistec-features/commit/85056dbf51c457394fc7d404ed86a00df4290963))

# [1.11.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.10.5...v1.11.0) (2025-12-04)


### Features

* prop close_expanded_item_on_expand_new adicionada para caso queira mudar o comportamento das expansões das linhas da tabela para fechar as antigas sempre que abrir uma nova e também dar a opção de poder scrollar automaticamente até o item que foi expandido usando a prop scroll_to_expanded_item ([45a8692](https://github.com/marlon-bento/v-sistec-features/commit/45a8692c60c36a95a1c3829cca50f0c33ebed143))

## [1.10.5](https://github.com/marlon-bento/v-sistec-features/compare/v1.10.4...v1.10.5) (2025-11-27)


### Bug Fixes

* bug de continuar aberto a linha adicional quando acontece novas buscas corrigido ([c4a7148](https://github.com/marlon-bento/v-sistec-features/commit/c4a71487b6f29a801c87744af3463abb588a11fb))
* faltou o clickedClearSearch na lista de emits, bug resolvido ([717239b](https://github.com/marlon-bento/v-sistec-features/commit/717239bc15f0c767d153b19c512536e805381d0e))

## [1.10.4](https://github.com/marlon-bento/v-sistec-features/compare/v1.10.3...v1.10.4) (2025-11-26)


### Bug Fixes

* agora é possível utilizar o evento de click no botão x do input de search, é só usar o emit clickedClearSearch para ter acesso ao evento ([471280d](https://github.com/marlon-bento/v-sistec-features/commit/471280db02d6d7ab7943b333c7d0e0cea8364779))

## [1.10.3](https://github.com/marlon-bento/v-sistec-features/compare/v1.10.2...v1.10.3) (2025-11-26)


### Bug Fixes

* agora é possível definir como ficará o v-data-table quando ele estiver em estado parado usando o slot idle-state ([fe64f63](https://github.com/marlon-bento/v-sistec-features/commit/fe64f63f6add730d777f6b436d6a951f201a58d3))

## [1.10.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.10.1...v1.10.2) (2025-11-25)


### Bug Fixes

* agora é possível desativar a pesquisa automatica quando clicar em enter no search e o search estiver vazio ([93e17a2](https://github.com/marlon-bento/v-sistec-features/commit/93e17a28565d306eab2a42ee919ccefebdc2eda5))

## [1.10.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.10.0...v1.10.1) (2025-11-25)


### Bug Fixes

* estilos do btn de mostrar a linha de baixo melhorados ([2ae0eca](https://github.com/marlon-bento/v-sistec-features/commit/2ae0ecabfa3086c968b31bb94780bc4a15fb4381))

# [1.10.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.9.3...v1.10.0) (2025-11-25)


### Features

* agora é possível adicionar um campo abaixo das linhas da tabela para fazer o que quiser ([2071b76](https://github.com/marlon-bento/v-sistec-features/commit/2071b76390e2b4bf948bc278185595c57bf826af))

## [1.9.3](https://github.com/marlon-bento/v-sistec-features/compare/v1.9.2...v1.9.3) (2025-11-25)


### Bug Fixes

* agora é possivel desativar a busca automatica quando limpa o input de texto do v-data-table usando a prop deactivate_search_on_clear ([ba0fbca](https://github.com/marlon-bento/v-sistec-features/commit/ba0fbca85c3cea37d7e96c703d55e87cce1f8fd5))

## [1.9.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.9.1...v1.9.2) (2025-11-25)


### Bug Fixes

* agora é possível trocar o placeholder do input search do v-data-table passado pela prop placeholder_search ([e3059c8](https://github.com/marlon-bento/v-sistec-features/commit/e3059c81ac9a38ea008fe845d0a39fa23421103a))

## [1.9.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.9.0...v1.9.1) (2025-11-24)


### Bug Fixes

* não mostra mais que não existe nenhum dado quando ainda não fez nenhuma busca ([51ba7c4](https://github.com/marlon-bento/v-sistec-features/commit/51ba7c4ce3bd2b655f9c57344d94d14328098b6a))

# [1.9.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.8.2...v1.9.0) (2025-11-24)


### Features

* agora é possivel no v-data-table passar :immediate='false' para não fazer a requisição imediatamente ([6bae42b](https://github.com/marlon-bento/v-sistec-features/commit/6bae42b854f0e57f0f2281f2ebefd424459612a6))

## [1.8.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.8.1...v1.8.2) (2025-11-12)


### Bug Fixes

* concertado problema de estilos do vue-toastfication faltando ([20d6702](https://github.com/marlon-bento/v-sistec-features/commit/20d67022d37a551086924b5439425d0b08748445))
* faltou externalizar o vue-toastfication ([f057002](https://github.com/marlon-bento/v-sistec-features/commit/f0570020eb43ae40479a4f8c2f55f625059f5b3b))

## [1.8.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.8.0...v1.8.1) (2025-11-11)


### Bug Fixes

* debug que não deveria ser subido foi removido e melhora em erros de tipagem ([e71d400](https://github.com/marlon-bento/v-sistec-features/commit/e71d400700a1c6a70b671d28b1f6b57e4e0655a6))

# [1.8.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.7.1...v1.8.0) (2025-11-11)


### Features

* padronização de paginação e agora paginação também está disponível para uso ([5e249a3](https://github.com/marlon-bento/v-sistec-features/commit/5e249a330eabe08535f78ca5bd5dc91c60c9ce39))

## [1.7.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.7.0...v1.7.1) (2025-11-07)


### Bug Fixes

* usando nova versão do v-required ([26f4e47](https://github.com/marlon-bento/v-sistec-features/commit/26f4e474c3b0e0e1c5d533b08daea54d28a103e3))

# [1.7.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.6.2...v1.7.0) (2025-11-06)


### Features

* agora é possível importar e usar o store de toast para mostrar erros ([f5a9886](https://github.com/marlon-bento/v-sistec-features/commit/f5a9886cd9001e053a57d9b00a669ea42a6dad29))

## [1.6.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.6.1...v1.6.2) (2025-11-06)


### Bug Fixes

* Adicionados arquivos .d.ts e configuração do v-required já vem de padrão no plugin do v-sistec ([e3c7195](https://github.com/marlon-bento/v-sistec-features/commit/e3c7195d34edc0236868d13d7f39321488329ba1))

## [1.6.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.6.0...v1.6.1) (2025-11-05)


### Bug Fixes

* adicionada novas opções para o filtro que fica perto do search do datatable, paginação melhorada para o datatable, estilização e melhorias em como funciona o uso dos checkbox dos items ([6c7ea16](https://github.com/marlon-bento/v-sistec-features/commit/6c7ea164bdb11dde81a4e2357c821936364635a4))

# [1.6.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.5.0...v1.6.0) (2025-11-03)


### Features

* agora é possivel colocar ordenação nas colunas desejadas, para crescente e decrescente ([a0a0193](https://github.com/marlon-bento/v-sistec-features/commit/a0a0193a1680b48a928409438d044b4839668e99))

# [1.5.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.4.1...v1.5.0) (2025-11-03)


### Features

* agora o v-data-table possui função de conseguir mover a coluna de lugar e deixar configurado do jeito que quiser, assim como travar uma coluna para não poder ser movida ([bc0c8bb](https://github.com/marlon-bento/v-sistec-features/commit/bc0c8bb26ae3c76eaf28c1a820afb664c635cf14))

## [1.4.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.4.0...v1.4.1) (2025-10-31)


### Bug Fixes

* agora o infinite loading também possui placeholder para loading ([2db6f97](https://github.com/marlon-bento/v-sistec-features/commit/2db6f97fe3f327671e5106da79b09c0e33c866c1))

# [1.4.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.3.3...v1.4.0) (2025-10-31)


### Features

* agora é possível gerenciar os estados da paginação enquanto está carregando, se deu erro e se está vazio ([aa24176](https://github.com/marlon-bento/v-sistec-features/commit/aa241767eff6a99011c17c9abcf02cad0b70bce7))

## [1.3.3](https://github.com/marlon-bento/v-sistec-features/compare/v1.3.2...v1.3.3) (2025-10-31)


### Bug Fixes

* bug de não fazer imediatamente as requisições resolvido ([e9ccbb6](https://github.com/marlon-bento/v-sistec-features/commit/e9ccbb6fd58b9c18da2185d7389e2a43ca5ed2c3))

## [1.3.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.3.1...v1.3.2) (2025-10-30)


### Bug Fixes

* melhoria em como o add_params funciona,agora não é mais preciso usar a função getter para garantir que tenha os params e não é mais preciso usar watch para escutar mudanças no add_params ([bfc8b46](https://github.com/marlon-bento/v-sistec-features/commit/bfc8b463d68bbed990fc6ee79baab2830930aa1b))

## [1.3.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.3.0...v1.3.1) (2025-10-30)


### Bug Fixes

* adicionada possibilidade de scrolar para o topo da página quando a paginação mudar ([e6a9ace](https://github.com/marlon-bento/v-sistec-features/commit/e6a9ace9e104b5ec62eac21d2abc62de4520d4b4))

# [1.3.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.2.6...v1.3.0) (2025-10-30)


### Features

* agora é possivel criar o datapage que é parecido com o datatable, mas para criação de páginas por paginação ou scroll infinito ([e365edb](https://github.com/marlon-bento/v-sistec-features/commit/e365edb068b9c74734e5cd151cba881ebc1a5ebe))

## [1.2.6](https://github.com/marlon-bento/v-sistec-features/compare/v1.2.5...v1.2.6) (2025-10-28)


### Bug Fixes

* retirado alguns espaços desnecessários que ficaram na parte de filtros ([14f3fd3](https://github.com/marlon-bento/v-sistec-features/commit/14f3fd3c4b9490b8222880892875f7581ae0bc30))

## [1.2.5](https://github.com/marlon-bento/v-sistec-features/compare/v1.2.4...v1.2.5) (2025-10-28)


### Bug Fixes

* retirado alguns espaços desnecessários ([1f3635f](https://github.com/marlon-bento/v-sistec-features/commit/1f3635f64b00008329b5584fc52d50458c744817))

## [1.2.4](https://github.com/marlon-bento/v-sistec-features/compare/v1.2.3...v1.2.4) (2025-10-28)


### Bug Fixes

* adicionada class de alteração para o filters ([159e12c](https://github.com/marlon-bento/v-sistec-features/commit/159e12c618baa72501e944ab2ecb70eca4b35c50))

## [1.2.3](https://github.com/marlon-bento/v-sistec-features/compare/v1.2.2...v1.2.3) (2025-10-10)


### Bug Fixes

* bug de alterar o valor do input de mostrar registros e mesmo sem o evento change acontecer a paginação refletia a mudança, agora o pagination não pode mais ser alterado por fora do componente, ele está encapsulado pelas funções de set, set_search, set_limit_per_page, set_page e set_search ([921a53b](https://github.com/marlon-bento/v-sistec-features/commit/921a53bf755ec12839456d43b30a3dadf831e823))

## [1.2.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.2.1...v1.2.2) (2025-10-10)


### Bug Fixes

* limit_per_page não depende mais da ref page_size ([a9557b1](https://github.com/marlon-bento/v-sistec-features/commit/a9557b1998bbdca87c47ce5aef5463fc8a552396))

## [1.2.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.2.0...v1.2.1) (2025-10-10)


### Bug Fixes

* agora é possível alterar o limite de itens por páginas antes de começar a mostrar ([f860096](https://github.com/marlon-bento/v-sistec-features/commit/f860096bc61e79de6776d63b7594e1be821658f4))

# [1.2.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.1.1...v1.2.0) (2025-10-10)


### Features

* adicionada a opção de adicionar click em cada item do datatable ([d4e9400](https://github.com/marlon-bento/v-sistec-features/commit/d4e9400b00ad7dca895508f76708fb51a3f7d024))

## [1.1.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.1.0...v1.1.1) (2025-10-10)


### Bug Fixes

* melhoria na performance e mudado o mostrar notícias para mostrar registros e dando opção de modificação ([31deccd](https://github.com/marlon-bento/v-sistec-features/commit/31deccd5909a77dfe9b0870290471d802d829628))

# [1.1.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.0.0...v1.1.0) (2025-10-09)


### Features

* adicionado o vDataTable para facilidade de implementação de tabelas para vue3 ([cbee25f](https://github.com/marlon-bento/v-sistec-features/commit/cbee25f80b68a0ef3cb71825669586ceae5c321c))

# 1.0.0 (2025-10-01)


### Bug Fixes

* faltou o changelog nas devDependencies ([8ea908d](https://github.com/marlon-bento/v-sistec-features/commit/8ea908d8a4df7ddeaf820202d59885aaaf9467f1))
* first commit ([d51af9b](https://github.com/marlon-bento/v-sistec-features/commit/d51af9bfad8144680729e6de286a93a2190b7fe9))
