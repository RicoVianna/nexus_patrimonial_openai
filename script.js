const inputMes = document.getElementById("mesFiltro");
const btnGerarMes = document.getElementById("btnGerarMes");
const btnIniciarMes = document.getElementById("btnIniciarMes");
console.log("btnIniciarMes:", btnIniciarMes);

btnIniciarMes.addEventListener("click", async () => {
    console.log("INICIANDO MÊS...");

    if (!mesSelecionado) {
        alert("Selecione um mês primeiro");
        return;
    }

    const mesAnterior = obterMesAnterior(mesSelecionado);

    const q = query(
        collection(db, "ativos"),
        where("mes", "==", mesAnterior)
    );

    const querySnapshot = await getDocs(q);

    console.log("Dados do mês anterior:", querySnapshot.size);

    const qAtual = query(
        collection(db, "ativos"),
        where("mes", "==", mesSelecionado)
    );

    const snapshotAtual = await getDocs(qAtual);

    console.log("Dados do mês atual:", snapshotAtual.size);

    if (snapshotAtual.size > 0) {
    alert("Este mês já foi iniciado.");
    return;
}

// 🔁 CLONAGEM
for (const docItem of querySnapshot.docs) {
    const data = docItem.data();

    let novoStatus = "pendente";

    if (data.status === "pendente") {
        novoStatus = "atrasado";
    }

    await addDoc(collection(db, "ativos"), {
        nome: data.nome,
        valor_aluguel: data.valor_aluguel,
        dia_vencimento: data.dia_vencimento, // 🔥 ADICIONAR
        ativo: true,
        status: novoStatus,
        mes: mesSelecionado
    });

    console.log("Clonado:", data.nome);
}

listarImoveis();
});


import { db } from "./firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";


// 🔵 DATA PADRÃO (UMA VEZ SÓ)
const hoje = new Date();
const mesAtual = hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, '0');

// 🔵 ESTADO GLOBAL
let mesSelecionado = mesAtual;

// define valor inicial no input
inputMes.value = mesSelecionado;

// 🔵 FUNÇÃO AUXILIAR
function obterMesAnterior(mes) {
    const [ano, mesNum] = mes.split("-").map(Number);
    let novoMes = mesNum - 1;
    let novoAno = ano;

    if (novoMes === 0) {
        novoMes = 12;
        novoAno--;
    }

    return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
}

// 🔵 ALTERAÇÃO DE MÊS
inputMes.addEventListener("change", () => {
    mesSelecionado = inputMes.value;

    console.log("Mês selecionado:", mesSelecionado);

    listarImoveis();
});

// 🔵 BOTÃO GERAR MÊS
btnGerarMes.addEventListener("click", async () => {

    console.log("BOTÃO CLICADO");

    if (!mesSelecionado) {
        alert("Selecione um mês primeiro");
        return;
    }

    const mesAnterior = obterMesAnterior(mesSelecionado);

    console.log("Mês atual:", mesSelecionado);
    console.log("Mês anterior:", mesAnterior);

    // 🔍 buscar todos os ativos
    const snapshotTodos = await getDocs(collection(db, "ativos"));

    let ultimoMes = null;

    // descobrir o maior mês existente
    snapshotTodos.forEach(docItem => {
        const data = docItem.data();

        if (!data.mes) return;

        if (!ultimoMes || data.mes > ultimoMes) {
            ultimoMes = data.mes;
        }
    });

    console.log("Último mês encontrado:", ultimoMes);

    // se não existir nada no banco
    if (!ultimoMes) {
        alert("Não há dados para iniciar o mês.");
        return;
    }

    // 🔍 buscar base do último mês
    const qBase = query(
        collection(db, "ativos"),
        where("mes", "==", mesSelecionado)
    );

    const querySnapshot = await getDocs(qBase);

    console.log("Base encontrada:", querySnapshot.size);

    // VALIDAÇÃO 1
    if (querySnapshot.size === 0) {
        alert("Não há dados base para iniciar o mês.");
        return;
    }

    // CLONAGEM
    for (const docItem of querySnapshot.docs) {
        const data = docItem.data();

        console.log("Clonando:", data.nome);

        let novoStatus = "pendente";

        if (data.status === "pendente") {
            novoStatus = "atrasado";
        }

        await addDoc(collection(db, "ativos"), {
            nome: data.nome,
            valor_aluguel: data.valor_aluguel,
            dia_vencimento: data.dia_vencimento, // 🔥 ADICIONAR
            ativo: true,
            status: novoStatus,
            mes: mesSelecionado
        });
    }

    console.log("Finalizou clonagem");

    listarImoveis();

    });

async function cadastrarImovel() {
    try {
        const nome = document.getElementById("nome").value;
        const valor = document.getElementById("valor").value;
        const vencimento = document.getElementById("vencimento").value;

        const venc = Number(vencimento);

        if (
            nome === "" ||
            valor === "" ||
            vencimento === "" ||
            venc < 1 ||
            venc > 31
        ) {
            alert("Preencha todos os campos corretamente");
            return;
        }

        await addDoc(collection(db, "ativos"), {
            nome: nome,
            valor_aluguel: Number(valor),
            ativo: true,
            status: "pendente",
            mes: mesSelecionado,
            dia_vencimento: Number(vencimento)
        });

        document.getElementById("nome").value = "";
        document.getElementById("valor").value = "";

        alert("Imóvel cadastrado com sucesso");

        listarImoveis();

    } catch (erro) {
        console.error("Erro ao cadastrar:", erro);
    }
}

async function excluirImovel(id) {
    try {
        await deleteDoc(doc(db, "ativos", id));
        alert("Imóvel excluído");
        listarImoveis();
    } catch (erro) {
        console.error("Erro ao excluir:", erro);
    }
}

async function editarImovel(id, nomeAtual, valorAtual) {
    const novoNome = prompt("Editar nome do imóvel:", nomeAtual);
    const novoValor = prompt("Editar valor do aluguel:", valorAtual);

    if (novoNome === null || novoValor === null) {
        return;
    }

    if (novoNome === "" || novoValor === "") {
        alert("Valores inválidos");
        return;
    }

    try {
        await updateDoc(doc(db, "ativos", id), {
            nome: novoNome,
            valor_aluguel: Number(novoValor)
        });

        alert("Imóvel atualizado");
        listarImoveis();

    } catch (erro) {
        console.error("Erro ao editar:", erro);
    }
}

async function listarImoveis() {

    console.log("Mes selecionado na listagem:", mesSelecionado);

    const mesAnterior = obterMesAnterior(mesSelecionado);

    const pendente = document.getElementById("pendente");
    const recebido = document.getElementById("recebido");
    const atrasadoColuna = document.getElementById("atrasado");

    pendente.innerHTML = "";
    recebido.innerHTML = "";
    atrasadoColuna.innerHTML = "";

    // 🔥 ADICIONE AQUI
    let totalPendente = 0;
    let totalAtrasado = 0;
    let totalRecebido = 0;

    // 🔍 buscar TODOS os ativos
    const snapshotTodos = await getDocs(collection(db, "ativos"));

    let ultimoMes = null;

    // descobrir último mês existente
    snapshotTodos.forEach(docItem => {
        const data = docItem.data();

        if (!data.mes) return;

        if (!ultimoMes || data.mes > ultimoMes) {
            ultimoMes = data.mes;
        }
    });

    console.log("Último mês encontrado:", ultimoMes);

    // se não existir base
    if (!ultimoMes) {
        alert("Não há dados base para iniciar o mês.");
        return;
    }

    // buscar base real
    const q = query(
        collection(db, "ativos"),
        where("mes", "==", mesSelecionado)
    );

    const querySnapshot = await getDocs(q);

    let dadosParaRenderizar = [];

    if (querySnapshot.empty) {

        console.log("Modo projeção (sem dados no mês)");

        // 🔍 usar a própria base já buscada (qBase)
    // 🔍 buscar TODOS os ativos
    const snapshotTodos = await getDocs(collection(db, "ativos"));

    const mesesUnicos = new Set();

    snapshotTodos.forEach(docItem => {
        const data = docItem.data();

    if (data.mes) {
        mesesUnicos.add(data.mes);
    }
});

const listaMeses = Array.from(mesesUnicos).sort();

let mesBase = null;

for (let i = listaMeses.length - 1; i >= 0; i--) {
    if (!mesBase || listaMeses[i] > mesBase) {
        mesBase = listaMeses[i];
    }
}

console.log("Mês base encontrado:", mesBase);

if (!mesBase) {
    console.log("Nenhum mês base encontrado");
    return;
}

// 🔍 buscar dados do mês base correto
const qBase = query(
    collection(db, "ativos"),
    where("mes", "==", mesBase)
);

const snapshotBase = await getDocs(qBase);

// montar projeção
snapshotBase.forEach(docItem => {
    const data = docItem.data();

    console.log("Base usada:", mesBase, "| Imóvel:", data.nome);

    dadosParaRenderizar.push({
        ...data,
        mes: mesSelecionado,
        status: "pendente",
        id: data.id || "projecao"
    });
});

} else {

    console.log("Modo dados reais");

    querySnapshot.forEach(docItem => {
        dadosParaRenderizar.push({
            ...docItem.data(),
            id: docItem.id
        });
    });
}

console.log("Itens para renderizar:", dadosParaRenderizar.length);

    const hoje = new Date();
    const mesAtualReal = hoje.toISOString().slice(0, 7);

    dadosParaRenderizar.forEach((data) => {
        const id = data.id;

        console.log("Item:", data.nome, "| mês:", data.mes);

        console.log("Vencimento:", data.dia_vencimento);

        const diaHoje = hoje.getDate();

let atrasado = false;

if (data.status === "pendente" && data.dia_vencimento) {

    if (mesSelecionado < mesAtualReal) {
        atrasado = true;

    } else if (mesSelecionado <= mesAtualReal) {
        if (diaHoje > data.dia_vencimento) {
            atrasado = true;
        }
    }
}
        const item = document.createElement("div");
        item.classList.add("card");

        if (atrasado) {
            item.style.backgroundColor = "#ffe5e5";
            item.style.border = "2px solid red";
        }

        if (data.status === "recebido") {
            item.innerHTML = `
                <h3>${data.nome}</h3>
                <p><strong>Aluguel:</strong> R$ ${data.valor_aluguel}</p>

                <button onclick="desfazerBaixa('${id}')">
                    ↩️ Desfazer
                </button>

                <button onclick="editarImovel('${id}', '${data.nome}', ${data.valor_aluguel})">
                    Editar
                </button>

                <button onclick="excluirImovel('${id}')">
                    Excluir
                </button>
            `;

        } else {

            item.innerHTML = `
                <h3>${data.nome}</h3>

                ${!id ? `<div style="background:#fff3cd; color:#856404; padding:6px; border-radius:6px; margin:6px 0; font-size:13px;"><strong>📊 Projeção</strong></div>` : ""}

                <p><strong>Aluguel:</strong> R$ ${data.valor_aluguel}</p>

                <p><strong>Vencimento:</strong> dia ${data.dia_vencimento ?? "-"}</p>

                ${atrasado ? `<p style="color:red;"><strong>⚠️ Atrasado</strong></p>` : ""}

                ${id && mesSelecionado <= mesAtualReal ? `<button onclick="darBaixa('${id}')">💰 Dar baixa</button>` : ""}

                ${id && mesSelecionado <= mesAtualReal ? `<button onclick="editarImovel('${id}', '${data.nome}', ${data.valor_aluguel})">Editar</button>` : ""}

                ${id && mesSelecionado <= mesAtualReal ? `<button onclick="excluirImovel('${id}')">Excluir</button>` : ""}
            `;
        }

        if (data.status === "recebido") {

            recebido.appendChild(item);
            totalRecebido += data.valor_aluguel;

        } else {

            if (data.status === "recebido") {
                recebido.appendChild(item);
                totalRecebido += data.valor_aluguel;
            } else if (atrasado) {
                atrasadoColuna.appendChild(item);
                totalAtrasado += data.valor_aluguel;
            } else {
                pendente.appendChild(item);
                totalPendente += data.valor_aluguel;
            }

        }
    });

    const totalP = document.createElement("p");
    totalP.innerHTML = "<strong>Total: R$ " + totalPendente + "</strong>";
    pendente.appendChild(totalP);

    const totalR = document.createElement("p");
    totalR.innerHTML = "<strong>Total: R$ " + totalRecebido + "</strong>";
    recebido.appendChild(totalR);

    const totalA = document.createElement("p");
    totalA.innerHTML = "<strong>Total: R$ " + totalAtrasado + "</strong>";
    atrasadoColuna.appendChild(totalA);
}

document.getElementById("btnCadastrar").addEventListener("click", cadastrarImovel);

window.excluirImovel = excluirImovel;
window.editarImovel = editarImovel;

async function darBaixa(id) {
    try {
        await updateDoc(doc(db, "ativos", id), {
            status: "recebido"
        });

        listarImoveis();
    } catch (erro) {
        console.error("Erro ao dar baixa:", erro);
    }
}

async function desfazerBaixa(id) {
    try {
        await updateDoc(doc(db, "ativos", id), {
            status: "pendente"
        });

        listarImoveis();
    } catch (erro) {
        console.error("Erro ao desfazer baixa:", erro);
    }
}

window.darBaixa = darBaixa;

window.desfazerBaixa = desfazerBaixa;

listarImoveis();

