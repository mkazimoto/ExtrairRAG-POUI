# po-listbox

@description
O componente `po-listbox` é uma caixa suspensa que aparece sobre a interface após ser acionado por um gatilho visível em tela, como o dropdown. Ele apoia trazendo agrupamentos de opções. O componente listbox é composto pelo componente [**PO Item List**](/documentation/po-item-list).

---

**`p-change-search`**

Evento disparado a cada tecla digitada na pesquisa.

---

**`p-change`**

output para evento do checkbox

---

**`p-selectcombo-item`**

output para evento do checkbox

---

**`p-change-all`**

output para evento do checkbox de selecionar todos

---

**`p-activated-tabs`**

Evento disparado quando uma tab é ativada

---

**`p-click-tabs`**

Evento disparado no click de uma aba do tabs

---

**`p-footer-action-listbox-event`**

Evento disparado ao clicar na ação do rodapé do listbox

---

### Enum `PoItemListFilterMode`

### Enum `PoItemListType`

- `action = 'action'`
- `check = 'check'`
- `option = 'option'`
- `danger = 'danger'`



---

### Interface `PoListBoxLiterals`

/**
@usedBy PoListBoxComponent

@description

Interface para definição de literais utilizadas no `po-listbox`
/

- `backToPreviousGroup: string` — Texto do botão para voltar ao agrupador anterior.
- `noItems: string` — Texto exibido quando não houver itens na lista
- `selectAll: string` — Texto do checkbox para selecionar todos os itens.
