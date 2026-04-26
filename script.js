import { db } from "./firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const inputMes = document.getElementById("mesFiltro");
const btnGerarMes = document.getElementById("btnGerarMes");

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

    const mesAnterior = obterMesAnterior(mesSelecionado);

    console.log("Mês atual:", mesSelecionado);
    console.log("Mês anterior:", mesAnterior);

    const q = query(
        collection(db, "ativos"),
        where("mes", "==", mesAnterior)
    );

    const querySnapshot = await getDocs(q);

    console.log("Encontrados:", querySnapshot.size);

    // VALIDAÇÃO 1
    if (querySnapshot.size === 0) {
        alert("Não há dados no mês anterior para copiar.");
        return;
    }

    // VALIDAÇÃO 2
    const qAtual = query(
        collection(db, "ativos"),
        where("mes", "==", mesSelecionado)
    );

    const snapshotAtual = await getDocs(qAtual);

    console.log("Registros no mês atual:", snapshotAtual.size);

    if (snapshotAtual.size > 0) {
        alert("Este mês já possui lançamentos.");
        return;
    }

    // CLONAGEM
    for (const docItem of querySnapshot.docs) {
        const data = docItem.data();

        await addDoc(collection(db, "ativos"), {
            nome: data.nome,
            valor_aluguel: data.valor_aluguel,
            ativo: true,
            status: "pendente",
            mes: mesSelecionado
        });

        console.log("Clonado:", data.nome);
    }

    listarImoveis();
});

async function cadastrarImovel() {
    try {
        const nome = document.getElementById("nome").value;
        const valor = document.getElementById("valor").value;

        if (nome === "" || valor === "") {
            alert("Preencha todos os campos");
            return;
        }

        await addDoc(collection(db, "ativos"), {
            nome: nome,
            valor_aluguel: Number(valor),
            ativo: true,
            status: "pendente",
            mes: mesSelecionado
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

    pendente.innerHTML = "";
    recebido.innerHTML = "";

    // 🔥 ADICIONE AQUI
    let totalPendente = 0;
    let totalRecebido = 0;

    const q = query(
        collection(db, "ativos"),
        where("mes", "==", mesSelecionado)
    );

    const querySnapshot = await getDocs(q);

    let dadosParaRenderizar = [];

if (querySnapshot.empty) {

    console.log("Modo projeção (sem dados no mês)");

    const snapshotTodos = await getDocs(collection(db, "ativos"));

    let ultimoMes = null;

    snapshotTodos.forEach(docItem => {
        const data = docItem.data();

        if (!data.mes) return;

        if (!ultimoMes || data.mes > ultimoMes) {
            ultimoMes = data.mes;
        }
    });

    console.log("Último mês encontrado:", ultimoMes);

    if (!ultimoMes) {
        console.log("Nenhum dado encontrado no banco");
        return;
    }

    const qBase = query(
        collection(db, "ativos"),
        where("mes", "==", ultimoMes)
    );

    const snapshotBase = await getDocs(qBase);

    snapshotBase.forEach(docItem => {
        const data = docItem.data();

        dadosParaRenderizar.push({
            ...data,
            status: "pendente",
            id: null
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

    dadosParaRenderizar.forEach((data) => {
        const id = data.id;

        console.log("Item:", data.nome, "| mês:", data.mes);

        const item = document.createElement("div");
        item.classList.add("card");

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
                <p><strong>Aluguel:</strong> R$ ${data.valor_aluguel}</p>

                ${id ? `<button onclick="darBaixa('${id}')">💰 Dar baixa</button>` : ""}

                ${id ? `<button onclick="editarImovel('${id}', '${data.nome}', ${data.valor_aluguel})">Editar</button>` : ""}

                ${id ? `<button onclick="excluirImovel('${id}')">Excluir</button>` : ""}
            `;
        }

        if (data.status === "recebido") {
            recebido.appendChild(item);
            totalRecebido += data.valor_aluguel;
        } else {
            pendente.appendChild(item);
            totalPendente += data.valor_aluguel;
        }
    });

    const totalP = document.createElement("p");
    totalP.innerHTML = "<strong>Total: R$ " + totalPendente + "</strong>";
    pendente.appendChild(totalP);

    const totalR = document.createElement("p");
    totalR.innerHTML = "<strong>Total: R$ " + totalRecebido + "</strong>";
    recebido.appendChild(totalR);
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

