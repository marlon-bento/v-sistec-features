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
