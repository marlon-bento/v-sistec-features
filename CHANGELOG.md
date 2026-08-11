# Changelog

## [1.31.4](https://github.com/marlon-bento/v-sistec-features/compare/v1.31.3...v1.31.4) (2026-08-11)


### Bug Fixes

* melhoria arquitetural nas props, agora percorre o vnode pra ver se as props foram passadas ou não ignorando o gerencimento do vue que as vezes falha ([63268ac](https://github.com/marlon-bento/v-sistec-features/commit/63268ac2ded1c017d62c5db1aa0d0ffdea66a56e))

## [1.31.3](https://github.com/marlon-bento/v-sistec-features/compare/v1.31.2...v1.31.3) (2026-08-11)


### Bug Fixes

* para garantir que os globais funcionem e não acharem que tem algo em classes por começarem no default '', agora as props de estilo, começam com undefined pra só mudar se o usuário passar algo ([49fa4d1](https://github.com/marlon-bento/v-sistec-features/commit/49fa4d1718ff13d3f1cb5da5b0a74f5e8ac27463))

## [1.31.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.31.1...v1.31.2) (2026-08-11)


### Bug Fixes

* por causa de alterações passadas em como as props eram passadas os valores padrões foram prejudicados, arrumando agora o bug voltando para props with default ([3232935](https://github.com/marlon-bento/v-sistec-features/commit/32329353fbe0a11d2c7898999aa5d8f08276a608))
* por causa de alterações passadas em como as props eram passadas os valores padrões foram prejudicados, arrumando agora o bug voltando para props with default ([5db2b2c](https://github.com/marlon-bento/v-sistec-features/commit/5db2b2c7d33cbbffb8c8ea1e2ce74b1eb1d92ae1))

## [1.31.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.31.0...v1.31.1) (2026-08-05)


### Bug Fixes

* as colunas que não pode ser ocultadas não aparecem mais no dropdown por que é inútil ([08b7f8b](https://github.com/marlon-bento/v-sistec-features/commit/08b7f8bdcec1042ee856c40665fa47b3900f5817))

# [1.31.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.30.0...v1.31.0) (2026-08-05)


### Features

* agora é possível proibir uma coluna de ser ocultada sem precisar travar ela, também é possível travar no começo ou travar no final as colunas ([faeb483](https://github.com/marlon-bento/v-sistec-features/commit/faeb4836e6a827697a78ae3f827e5494b704d919))

# [1.30.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.29.0...v1.30.0) (2026-08-04)


### Features

* agora o datatable expoem os items para poder facilitar o uso no futuro caso o usuário precisar dos dados pra não ter que refazer fetch por fora do datatable, o retorno items vai entregar a paginação, e o retorno results para mostrar os dados que vieram brutos da requisição sem a transformação do datatable ([430af45](https://github.com/marlon-bento/v-sistec-features/commit/430af45285b845e5170b685fcd3551c95c238a5d))

# [1.29.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.28.0...v1.29.0) (2026-08-03)


### Features

* agora o v-data-table permite datakey vazio para pegar da raiz os items, e também permite receber todos os dados de uma vez e já paginar diretamente no frontend ([d5fcd5c](https://github.com/marlon-bento/v-sistec-features/commit/d5fcd5c08b393e685f10ec7596c0683e02aac1e8))

# [1.28.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.27.2...v1.28.0) (2026-07-29)


### Features

* resolvido problema de reatividade das props, melhorado a granularidade de como parametros podem ser processados, antigamente era possível usar o v-datatable para mandar no addparams, mas o addparams já possuí internamente a caracteristica base de refazer o fetch e também voltar para a primeira página, pensando nisso foram adicionadas duas novas props de parametros, que em suma fazem o mesmo que o addparams, só que uma não refaz o fetch e não volta para a primeira página, e a outra refaz o fetch mas não volta para a primeira página ([6590430](https://github.com/marlon-bento/v-sistec-features/commit/6590430253f217e1b79cbbab0b4e7755968a8a71))

## [1.27.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.27.1...v1.27.2) (2026-07-24)


### Bug Fixes

* icon tava com erro por que tava com um span quebrado ([8038ef6](https://github.com/marlon-bento/v-sistec-features/commit/8038ef6e503af9bf2daf86405cbf85d223cc05f9))

## [1.27.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.27.0...v1.27.1) (2026-07-24)


### Bug Fixes

* faltou adicionar as classes do column manager na prop ([07feec4](https://github.com/marlon-bento/v-sistec-features/commit/07feec4fe8562905b3166c49fde3865a28db9816))

# [1.27.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.26.4...v1.27.0) (2026-07-22)


### Features

* adicionado para a biblioteca a possibilidade de teleportar o extra actions e o column manage, também foi refatorado algumas coisas e estou começando a colocar a possibilidade de desativar a estilização padrão para poder o usuário customizar como quiser, também está sendo refatorado o código para melhor manutenção futura ([73bd552](https://github.com/marlon-bento/v-sistec-features/commit/73bd5526c4dbe9ebfb0d176a2b192e32826773e0))

## [1.26.4](https://github.com/marlon-bento/v-sistec-features/compare/v1.26.3...v1.26.4) (2026-07-21)


### Bug Fixes

* arrumando bug do teleport ([cbc7f6c](https://github.com/marlon-bento/v-sistec-features/commit/cbc7f6ca273e600efbbcf8112d68a3ca554b4dba))

## [1.26.3](https://github.com/marlon-bento/v-sistec-features/compare/v1.26.2...v1.26.3) (2026-07-20)


### Bug Fixes

* resolvendo bug da versão anterior que estava sem o slot de extra-actions ([d2ac36b](https://github.com/marlon-bento/v-sistec-features/commit/d2ac36bc78d6d0e0861dae02857cd8ce5526f56b))

## [1.26.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.26.0...v1.26.2) (2026-07-20)


### Bug Fixes

* arrumando erro de lógica, o disable search tava afetando o template extra-actions gerando comportamento inesperado ([c0a28f1](https://github.com/marlon-bento/v-sistec-features/commit/c0a28f15b57ae08aa4aac16fd3616549e4ffa4eb))
* teve um erro no commit anteriror que a prop não era usada, resolvendo nesse e mudando a lógica para buildar primeiro e se falhar nem gera nova release ([0ba5335](https://github.com/marlon-bento/v-sistec-features/commit/0ba5335076f86ee7a3a4a4a20e9d17a9cea337e4))

# [1.26.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.25.0...v1.26.0) (2026-07-20)


### Features

* realizei algumas refatorações no datatable elas são: agora é posivel adicionar mais um slot do lado direito do componente de search, também é possível quando usar o header custom, pegar como retorno do slot o próprio componente de ordenação para se quiser reutilizar o botão já vim pronto para renderizar, também agora é possível usar uma prop para ativar o uso de um dropdown pronto que fica do lado do buscar, para o usuário poder escolher quais colunas estarão visíveis sem precisar usar as funções exportadas para isso, a não ser que o usuário queira mudar o estilo ([701a07c](https://github.com/marlon-bento/v-sistec-features/commit/701a07c5682b5e4b3c44eccba2aa0c92588382b3))

# [1.25.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.24.0...v1.25.0) (2026-07-17)


### Features

* agora é possível escolher qual coluna fica visivel por padrão e o usuário escolher quais ele quer ver ([0fd2339](https://github.com/marlon-bento/v-sistec-features/commit/0fd2339a66d3dc9cd63c7ab24720d93b2c3db771))

# [1.24.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.23.2...v1.24.0) (2026-07-17)


### Features

* agora é possível mostrar o header mesmo que não tenha itens vindos da api ([2ae7a2f](https://github.com/marlon-bento/v-sistec-features/commit/2ae7a2fcb78e0543269bf1365fdb36e89b3ba8dd))

## [1.23.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.23.1...v1.23.2) (2026-07-17)


### Bug Fixes

* atualisando modo de publicação para oidc e atualizando a biblioteca do v-required para a nova versão ([1de85be](https://github.com/marlon-bento/v-sistec-features/commit/1de85be1fc6c4b95e249a8ced90be6f3473d277c))

## [1.23.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.23.0...v1.23.1) (2026-06-19)


### Bug Fixes

* teste autenticação oidc com npm para não precisar de token mais ([dbdbe08](https://github.com/marlon-bento/v-sistec-features/commit/dbdbe08e44f6bbec04b006a9dd10df18a27c1a0b))
* teste autenticação oidc com npm para não precisar de token mais ([60793a7](https://github.com/marlon-bento/v-sistec-features/commit/60793a72e79aaab7d7f097c54a6b30d09d188731))
* teste autenticação oidc com npm para não precisar de token mais ([bed1f51](https://github.com/marlon-bento/v-sistec-features/commit/bed1f516a1b96ffb529d2afe4d15ae9ca6befc44))
* teste de oidc npm novamente ([69c6532](https://github.com/marlon-bento/v-sistec-features/commit/69c6532934bdc404ad6246627c19e3c674ed1bcf))
* teste de oidc npm novamente ([781ebf9](https://github.com/marlon-bento/v-sistec-features/commit/781ebf9b20ba0f033fa21c5ff83ef2189c29928e))

# [1.23.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.22.3...v1.23.0) (2026-06-19)


### Features

* agora é possível mudar a forma como a header de cada coluna é exibida usando slots, um slot para adicionar mais coisa, e outro pra sobrescrever todo o comportamento padrão ([605ec28](https://github.com/marlon-bento/v-sistec-features/commit/605ec283dd744932bbb205b52fa76b3bca071454))

## [1.22.3](https://github.com/marlon-bento/v-sistec-features/compare/v1.22.2...v1.22.3) (2026-06-17)


### Bug Fixes

* testando se a nova forma de token pulando 2fa funciona ([672ec89](https://github.com/marlon-bento/v-sistec-features/commit/672ec8941ec6d994582388a8da39058798d6e6e4))

## [1.22.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.22.1...v1.22.2) (2026-06-17)


### Bug Fixes

* forçando nova versão pelo bug da última por falta de token válido por causa da mudança no npm ([6fb61db](https://github.com/marlon-bento/v-sistec-features/commit/6fb61db901a1e95a4812f477fd8e205f4c418aac))

## [1.22.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.22.0...v1.22.1) (2026-06-17)


### Bug Fixes

* tava dando problema o watch com imediate, por que gerava uma condição de corrida que o authorization com token ainda não tava definido então passei a lógica para o onmounted ([f1f4a31](https://github.com/marlon-bento/v-sistec-features/commit/f1f4a31bb66130fedf7f80e1e5d04170bae28b6c))

# [1.22.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.21.0...v1.22.0) (2026-01-19)


### Features

* add index to loading and body slots for improved item tracking in VDataPage ([c0daaa2](https://github.com/marlon-bento/v-sistec-features/commit/c0daaa25b3bdd7bb097e02b8ea6173261f5c6640))

# [1.21.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.20.0...v1.21.0) (2026-01-19)


### Features

* add index to item slot in VDataTable and VDataPage for improved item tracking ([ed78455](https://github.com/marlon-bento/v-sistec-features/commit/ed7845590d0cfa38eba21114f3e581cd9a670f0f))

# [1.20.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.19.0...v1.20.0) (2026-01-19)


### Features

* add pagination_teleport and search_teleport props for enhanced teleportation support in VDataTable and VDataPage ([022f7d8](https://github.com/marlon-bento/v-sistec-features/commit/022f7d8740595be2a0a14f0ae8c725e72788f3dc))

# [1.19.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.18.0...v1.19.0) (2026-01-09)


### Features

* add disable_search prop to VDataTable for enhanced search control ([6db48dd](https://github.com/marlon-bento/v-sistec-features/commit/6db48ddcb76676bf4cbc08e8542d482c0a5a987a))
* add disable_search prop to VDataTable for improved search control ([9fa5a1f](https://github.com/marlon-bento/v-sistec-features/commit/9fa5a1f4d55fbf51bab3802758bd6e9613804243))
* add disable_search prop to VDataTableProps for enhanced search functionality ([e3c975f](https://github.com/marlon-bento/v-sistec-features/commit/e3c975fb74614cb8d9791715b4381289d9049ddc))

# [1.18.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.17.7...v1.18.0) (2026-01-08)


### Features

* implement global configuration for data table and toast options ([3c8f194](https://github.com/marlon-bento/v-sistec-features/commit/3c8f194740484f5a8c96e82a55f9bede731c54e8))
* minha nova funcionalidade em beta ([a837d90](https://github.com/marlon-bento/v-sistec-features/commit/a837d90a0d2c6b38cde238293e7c28b42c623a5c))
* restore data_key and total_key props in VDataTable component ([28ad89b](https://github.com/marlon-bento/v-sistec-features/commit/28ad89b81789e49805ae007b50de863195a1f32b))
* teste de separação ([1108f07](https://github.com/marlon-bento/v-sistec-features/commit/1108f07b216c32920d1ad76dfb7f9bf0657a183b))

# [1.18.0-beta.3](https://github.com/marlon-bento/v-sistec-features/compare/v1.18.0-beta.2...v1.18.0-beta.3) (2026-01-08)


### Features

* restore data_key and total_key props in VDataTable component ([28ad89b](https://github.com/marlon-bento/v-sistec-features/commit/28ad89b81789e49805ae007b50de863195a1f32b))

# [1.18.0-beta.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.18.0-beta.1...v1.18.0-beta.2) (2026-01-08)


### Features

* implement global configuration for data table and toast options ([3c8f194](https://github.com/marlon-bento/v-sistec-features/commit/3c8f194740484f5a8c96e82a55f9bede731c54e8))

# [1.18.0-beta.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.17.7...v1.18.0-beta.1) (2026-01-08)


### Features

* minha nova funcionalidade em beta ([a837d90](https://github.com/marlon-bento/v-sistec-features/commit/a837d90a0d2c6b38cde238293e7c28b42c623a5c))
* teste de separação ([1108f07](https://github.com/marlon-bento/v-sistec-features/commit/1108f07b216c32920d1ad76dfb7f9bf0657a183b))

## [1.17.7](https://github.com/marlon-bento/v-sistec-features/compare/v1.17.6...v1.17.7) (2026-01-06)


### Bug Fixes

* adjust color and border styles for v-bentri-editor upload-placeholder ([49e6ca2](https://github.com/marlon-bento/v-sistec-features/commit/49e6ca21b327fe7c5ed86aaf51eaccbfd56223d4))

## [1.17.6](https://github.com/marlon-bento/v-sistec-features/compare/v1.17.5...v1.17.6) (2026-01-06)


### Bug Fixes

* update upload-placeholder styling to be nested within v-bentri-editor ([eb58024](https://github.com/marlon-bento/v-sistec-features/commit/eb5802461ab8f606c20f45305353cb5858229d18))

## [1.17.5](https://github.com/marlon-bento/v-sistec-features/compare/v1.17.4...v1.17.5) (2026-01-06)


### Bug Fixes

* separate styles for v-bentri-editor and upload-placeholder in error state ([ff40285](https://github.com/marlon-bento/v-sistec-features/commit/ff4028580607a7480e3a93a683476daa006cfdb7))

## [1.17.4](https://github.com/marlon-bento/v-sistec-features/compare/v1.17.3...v1.17.4) (2026-01-06)


### Bug Fixes

* add upload-placeholder styling to v-bentri-editor error state ([1791d12](https://github.com/marlon-bento/v-sistec-features/commit/1791d1291c2428f277a9f49061109879e36b788f))

## [1.17.3](https://github.com/marlon-bento/v-sistec-features/compare/v1.17.2...v1.17.3) (2026-01-06)


### Bug Fixes

* update package version to 1.17.1 and enhance error styling in v-required-style ([c98c3f6](https://github.com/marlon-bento/v-sistec-features/commit/c98c3f665d6846438b685dfe579a562c1b7772da))

## [1.17.2](https://github.com/marlon-bento/v-sistec-features/compare/v1.17.1...v1.17.2) (2025-12-22)


### Bug Fixes

* teste se os provides vão ter desempenho bom ([209158b](https://github.com/marlon-bento/v-sistec-features/commit/209158b2c4d42f0f9cd44cc01c307993351ee088))

## [1.17.1](https://github.com/marlon-bento/v-sistec-features/compare/v1.17.0...v1.17.1) (2025-12-22)


### Bug Fixes

* faltou os returns para acessar os valores que agora são salvos ([7ac7c9c](https://github.com/marlon-bento/v-sistec-features/commit/7ac7c9c03c0f38d4a756efd0ce986c450aeb74d6))

# [1.17.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.16.0...v1.17.0) (2025-12-22)


### Features

* adicionada forma de ver o tema que está sendo usado pelo useTheme() ([b3b565f](https://github.com/marlon-bento/v-sistec-features/commit/b3b565ff22bd901ff9abb31a4c55ab24da1de197))

# [1.16.0](https://github.com/marlon-bento/v-sistec-features/compare/v1.15.0...v1.16.0) (2025-12-18)


### Features

* agora é possível criar classes customizadas utilizando funções que recebem o item como parâmetro ([a617356](https://github.com/marlon-bento/v-sistec-features/commit/a617356e7153db88e0c3738307ba8cf6cec1aa50))

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
